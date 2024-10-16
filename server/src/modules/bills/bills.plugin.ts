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
    .guard({
      beforeHandle({ headers, error }) {
        const authHeader = headers.authorization;

        if (!authHeader) {
          return error(401, {
            status: false,
            message: "User not authenticated",
          });
        }

        const tokenParts = authHeader.split(" ");
        if (tokenParts[0] !== "Bearer" || !tokenParts[1]) {
          return error(401, {
            status: false,
            message: "Invalid Authorization format",
          });
        }
      },
    })
    .post(
      "/",
      async ({ body, headers, error }) => {
        const authHeader = headers.authorization;
        const tokenParts = authHeader.split(" ");
        const access_token = tokenParts[1];

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

        if (body.assignedCreatorAmount >= body.amount) {
          return error(400, {
            status: false,
            message:
              "Cannot assign amoung greater than or same as the bill amount",
          });
        }

        try {
          const billCreator = await prisma.userVerification.findUnique({
            where: { accessToken: access_token },
          });

          if (!billCreator) {
            error(404, "User not found");
          }

          const createdBill = await prisma.bill.create({
            data: {
              title: body.name,
              // slug: body.slug,
              description: body.description,
              currentAmount: 0,
              totalAmount: body.amount,
              status: "OPEN",
              currency: "NGN",
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
        headers: t.Object({
          authorization: t.String(),
        }),
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
    .patch(
      "/invite/accept",
      async ({ body, error }) => {
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
              message: "Invalid or already accepted/rejected invitation",
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
    .patch(
      "/invite/reject",
      async ({ body, error }) => {
        const { invitationId } = body;
        try {
          const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: { bill: { include: { members: true } } },
          });

          if (!invitation || invitation.status !== "PENDING") {
            return error(404, {
              status: false,
              message: "Invalid or already accepted/rejected invitation",
            });
          }

          const user = await prisma.user.findUnique({
            where: { email: invitation.email },
          });

          if (!user) {
            return error(404, { status: false, message: "User not found" });
          }

          await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: "REJECTED" },
          });

          return {
            status: true,
            message: "Invitation rejected",
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
      async ({ headers, error, query }) => {
        // GET INVITES FOR A USER

        const authHeader = headers.authorization;
        const tokenParts = authHeader.split(" ");
        const access_token = tokenParts[1];

        try {
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
        headers: t.Object({
          authorization: t.String(),
        }),
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
