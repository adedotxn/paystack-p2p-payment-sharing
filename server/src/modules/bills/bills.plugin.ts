import { Elysia, t } from "elysia";
import { Environments } from "../../config/environment.config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const billsPlugin = new Elysia({ prefix: "/bill" })
  .post(
    "/",
    async ({ body, cookie, error }) => {
      // CREATE A BILL
      if (!cookie.access_token.value) {
        error(401);
      }

      try {
        const billCreator = await prisma.userVerification.findUnique({
          where: { accessToken: cookie.access_token.value },
        });

        console.log("billcreator", billCreator);

        if (!billCreator) {
          error(404, "User not found");
        }

        console.log(body);

        const res = await fetch("https://api.paystack.co/page", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            name: body.name,
            amount: body.amount,
            description: body.description,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Environments.PAYSTACK_SECRET_KEY}`,
          },
        });

        const paystackPageResponse = (await res.json()) as {
          status: boolean;
          message: string;
          data: {
            name: string;
            description: string;
            amount: number;
            split_code: string;
            integration: number;
            domain: string;
            slug: string;
            currency: string;
            type: string;
            collect_phone: boolean;
            active: boolean;
            published: boolean;
            migrate: boolean;
            id: number;
            createdAt: string;
            updatedAt: string;
          };
        };

        if (!paystackPageResponse.status) {
          return error(400, {
            status: paystackPageResponse.status,
            message: paystackPageResponse.message,
          });
        }
        console.log("paystack respoNse", paystackPageResponse);

        console.log("starting prisma");
        const createdBill = await prisma.bill.create({
          data: {
            title: paystackPageResponse.data.name,
            slug: paystackPageResponse.data.slug,
            description: paystackPageResponse.data.description,
            currentAmount: 0,
            totalAmount: paystackPageResponse.data.amount,
            status: "OPEN",
            currency: paystackPageResponse.data.currency,
            owner: {
              connect: { id: billCreator?.id },
            },
            members: {
              create: [],
            },
            invitations: {
              create: [],
            },
          },
        });

        console.log("created bill", createdBill);
        return { status: true, data: createdBill };
      } catch (e) {
        if (e instanceof Error) {
          error(400, { status: false, message: e.message });
        }
      }
    },
    {
      body: t.Object({
        name: t.String(),
        amount: t.Number(),
        description: t.String(),
      }),
    },
  )
  .get("/:billId", async ({ params, error }) => {
    try {
      const bill = await prisma.bill.findUnique({
        where: { id: Number(params.billId) },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          owner: true,
          invitations: true,
          payments: true,
        },
      });

      if (!bill) {
        return error(404, { status: true, message: "Bill not found" });
      }

      return { status: true, data: bill };
    } catch (e) {
      if (e instanceof Error) {
        error(400, { status: false, message: e.message });
      }
    }
  })
  .post(
    "/invite",
    async ({ body, error }) => {
      // SEND BILL INVITE TO ANOTHER USER
      const { email, billId, assignedAmount } = body;

      try {
        const invitedUserExists = await prisma.user.findUnique({
          where: { email },
        });

        if (!invitedUserExists) {
          return error(404, {
            status: false,
            message: "User being invited does not exist",
          });
        }

        const bill = await prisma.bill.findUnique({
          where: { id: billId },
          include: { owner: true, members: true, invitations: true },
        });

        if (!bill) {
          return error(404, { status: false, messae: "Bill not found" });
        }

        const existingInvite = await prisma.invitation.findUnique({
          where: { email_billId: { email, billId } },
        });

        if (existingInvite) {
          return error(400, {
            status: false,
            message: "User already invited to this bill",
          });
        }

        const invitation = await prisma.invitation.create({
          data: {
            email,
            billId,
            status: "PENDING",
            assignedAmount,
          },
        });

        return { status: true, message: "Invite sent", data: invitation };
      } catch (e) {
        if (e instanceof Error) {
          error(400, { status: false, message: e.message });
        }
      }
    },
    {
      body: t.Object({
        email: t.String(),
        billId: t.Number(),
        assignedAmount: t.Number(),
      }),
    },
  )
  .post(
    "/invite/accept",
    async ({ body, error, cookie }) => {
      /**
      ACCEPT BILL INVITATION

      Bills have unique invititation Id's
      but the BillId for a bill is what connects the invites
      */
      const { invitationId } = body;

      try {
        const invitation = await prisma.invitation.findUnique({
          where: { id: invitationId },
          include: { bill: { include: { members: true } } },
        });

        if (!invitation || invitation.status !== "PENDING") {
          return error(404, {
            status: false,
            message: "Invalid or already accepted invitation",
          });
        }

        const user = await prisma.user.findUnique({
          where: { email: invitation.email },
        });

        if (!user) {
          return error(404, { status: false, message: "User not found" });
        }

        const totalAssignedAmount = invitation.bill.members.reduce(
          (sum, member) => sum + member.assignedAmount,
          0,
        );

        const remainingAmount =
          invitation.bill.totalAmount - totalAssignedAmount;

        if (invitation.assignedAmount > remainingAmount) {
          return error(400, {
            status: false,
            message: `Assigned amount exceeds the remaining balance of ${remainingAmount}.`,
          });
        }

        await prisma.billMember.create({
          data: {
            userId: user.id,
            billId: invitation.billId,
            role: "MEMBER",
            assignedAmount: invitation.assignedAmount,
            paidAmount: 0,
          },
        });

        await prisma.invitation.update({
          where: { id: invitationId },
          data: { status: "ACCEPTED" },
        });

        return {
          status: true,
          message: "Invitation accepted and user added to the bill",
        };
      } catch (e) {
        if (e instanceof Error) {
          error(400, { status: false, message: e.message });
        }
      }
    },
    {
      body: t.Object({
        invitationId: t.Number(),
      }),
    },
  )
  .get("/invites", async ({ cookie, error }) => {
    // GET INVITES FOR A USER

    const access_token = cookie.access_token.value;

    if (!access_token) {
      return error(401, { status: false, message: "User not authenticated" });
    }

    try {
      // Fetch user based on access token (assuming you manage auth in cookies)
      const user = await prisma.userVerification.findUnique({
        where: { accessToken: access_token },
        include: { user: true },
      });

      if (!user) {
        return error(400, { status: false, message: "User not authenticated" });
      }

      const invites = await prisma.invitation.findMany({
        where: { email: user.user.email },
        include: { bill: true },
      });

      if (!invites) {
        error(404, { status: false, message: "User's invites not found" });
      }

      return { status: true, data: invites };
    } catch (e) {
      if (e instanceof Error) {
        error(400, { status: false, message: e.message });
      }
    }
  })
  .get("/invites/:billId", async ({ params, error }) => {
    // GET INVITES SENT OUT FOR A BILL
    // Todo: add filter for invite status
    try {
      const invites = await prisma.invitation.findMany({
        where: { billId: Number(params.billId) },
        include: { invitedUser: true },
      });

      if (!invites) {
        error(404, { status: false, message: "Bill invites not found" });
      }

      return { status: true, data: invites };
    } catch (e) {
      if (e instanceof Error) {
        error(400, { status: false, message: e.message });
      }
    }
  })
  .patch("/:billId/close", async ({ params, error }) => {
    try {
      const bill = await prisma.bill.findUnique({
        where: { id: Number(params.billId) },
        select: { currentAmount: true, totalAmount: true },
      });

      if (!bill) {
        return error(404, { status: false, message: "Bill not found" });
      }

      if (bill.currentAmount < bill.totalAmount) {
        return error(400, {
          status: false,
          message: "Bill cannot be closed until the total amount is reached",
        });
      }

      if (bill.currentAmount === bill.totalAmount) {
        const closedBill = await prisma.bill.update({
          where: { id: Number(params.billId) },
          data: { status: "CLOSED" },
        });

        return { status: true, message: "Bill closed", data: closedBill };
      }
    } catch (e) {
      if (e instanceof Error) {
        error(400, { status: false, message: e.message });
      }
    }
  });
