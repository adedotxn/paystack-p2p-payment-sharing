import { Elysia, t } from "elysia";
import { Environments } from "../../config/environment.config";
import { PrismaClient } from "@prisma/client";

enum InvitationStatus {
  pending = "pending",
  accepted = "accepted",
  rejected = "rejected",
}

const prisma = new PrismaClient();
export const billsPlugin = new Elysia().group("/bill", (app) =>
  app
    .post(
      "/",
      async ({ body, cookie, error }) => {
        // CREATE A BILL
        if (!cookie.access_token.value) {
          error(401);
        }

        if (body.assignedCreatorAmount < 100) {
          return error(400, {
            status: false,
            message: "Assigned amount should be > 100",
          });
        }

        if (body.amount < 100) {
          return error(400, {
            status: false,
            message: "Assigned amount should be > 100",
          });
        }

        try {
          const billCreator = await prisma.userVerification.findUnique({
            where: { accessToken: cookie.access_token.value },
          });

          if (!billCreator) {
            error(404, "User not found");
          }

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

          if (!createdBill) {
            return error(500, {
              status: false,
              message: "An error occured while creating bill",
            });
          }

          if (createdBill) {
            await prisma.billMember.create({
              data: {
                userId: createdBill.ownerId,
                billId: createdBill.id,
                role: "OWNER",
                assignedAmount: body.assignedCreatorAmount,
                paidAmount: 0,
              },
            });
          }

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
          assignedCreatorAmount: t.Number(),
        }),
        detail: {
          tags: ["Bill"],
        },
      },
    )
    .get(
      "/:billId",
      async ({ params, error }) => {
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

          const assignedAmountFromMembers = bill.members.reduce(
            (total, member) => total + member.assignedAmount,
            0,
          );

          const assignedAmountFromInvitations = bill.invitations
            .filter((invite) => invite.status === "PENDING") // Only considering pending invitations
            .reduce((total, invite) => total + invite.assignedAmount, 0);

          const totalAssignedAmount =
            assignedAmountFromMembers + assignedAmountFromInvitations;

          const unassignedAmount = bill.totalAmount - totalAssignedAmount;

          return {
            status: true,
            data: {
              ...bill,
              unassignedAmount: unassignedAmount >= 0 ? unassignedAmount : 0,
            },
          };
        } catch (e) {
          if (e instanceof Error) {
            error(400, { status: false, message: e.message });
          }
        }
      },
      {
        detail: {
          tags: ["Bill"],
        },
      },
    )
    .post(
      "/invite",
      async ({ body, error, cookie }) => {
        // SEND BILL INVITE TO ANOTHER USER
        const { email, billId, assignedAmount } = body;
        if (!cookie.access_token.value) {
          error(401, {
            status: false,
            message: "Unauthorized",
          });
        }

        try {
          const invitedUserExists = await prisma.user.findUnique({
            where: { email },
          });

          if (!invitedUserExists) {
            return error(404, {
              status: false,
              message: "The user being invited does not exist",
            });
          }

          const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: { owner: true, members: true, invitations: true },
          });

          if (!bill) {
            return error(404, { status: false, message: "Bill not found" });
          }

          const isAlreadyMember = bill.members.some(
            (member) => member.userId === invitedUserExists.id,
          );

          if (isAlreadyMember) {
            return error(400, {
              status: false,
              message: "User is already a member of this bill",
            });
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
        detail: {
          tags: ["Bill"],
        },
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
        detail: {
          tags: ["Bill"],
        },
      },
    )
    .get(
      "/invites",
      async ({ cookie, error, query }) => {
        // GET INVITES FOR A USER

        const access_token = cookie.access_token.value;

        if (!access_token) {
          return error(401, {
            status: false,
            message: "User not authenticated",
          });
        }

        try {
          // Fetch user based on access token (assuming you manage auth in cookies)
          const user = await prisma.userVerification.findUnique({
            where: { accessToken: access_token },
            include: { user: true },
          });

          if (!user) {
            return error(400, {
              status: false,
              message: "User not authenticated",
            });
          }

          const statusFilter = query.status;

          const invites = await prisma.invitation.findMany({
            where: {
              email: user.user.email,
              ...(statusFilter && {
                status:
                  statusFilter === "pending"
                    ? "PENDING"
                    : statusFilter === "accepted"
                      ? "ACCEPTED"
                      : "REJECTED",
              }),
            },
            include: {
              bill: {
                select: {
                  title: true,
                  slug: true,
                  status: true,
                  owner: {
                    select: { name: true },
                  },
                },
              },
            },
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
      },
      {
        query: t.Object({
          status: t.Optional(t.Enum(InvitationStatus)),
        }),
        detail: {
          tags: ["Bill"],
        },
      },
    )
    .get(
      "/invites/:billId",
      async ({ params, error }) => {
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
      },
      {
        detail: {
          tags: ["Bill"],
        },
      },
    )
    .patch(
      "/:billId/close",
      async ({ params, error }) => {
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
              message:
                "Bill cannot be closed until the total amount is reached",
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
      },
      {
        detail: {
          tags: ["Bill"],
        },
      },
    ),
);
