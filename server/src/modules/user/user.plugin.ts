import { Elysia, t } from "elysia";
import { Environments } from "../../config/environment.config";
import { PrismaClient } from "@prisma/client";

enum BillStatus {
  open = "open",
  closed = "closed",
  settled = "settled",
}

const prisma = new PrismaClient();
export const userPlugin = new Elysia().group("/user", (app) =>
  app
    .get(
      "/profile",
      async ({ cookie, error }) => {
        const access_token = cookie.access_token.value;

        if (!access_token) {
          return error(401, {
            status: false,
            message: "User not authenticated",
          });
        }

        try {
          const user = await prisma.userVerification.findUnique({
            where: { accessToken: access_token },
            include: { user: true },
          });

          if (!user) {
            return error(404, { status: false, message: "User not found" });
          }

          return { status: true, data: user.user };
        } catch (e) {
          if (e instanceof Error) {
            error(400, { status: false, message: e.message });
          }
        }
      },
      {
        detail: {
          tags: ["User"],
        },
      },
    )
    .get(
      "/bills",
      async ({ cookie, error, query }) => {
        const access_token = cookie.access_token.value;

        if (!access_token) {
          return error(401, {
            status: false,
            message: "User not authenticated",
          });
        }

        try {
          const user = await prisma.userVerification.findUnique({
            where: { accessToken: access_token },
            include: { user: true },
          });

          if (!user) {
            return error(401, {
              status: false,
              message: "User not authenticated",
            });
          }

          const limit = query.limit ? parseInt(query.limit) : null;

          const statusFilter = query.status;

          let bills = await prisma.bill.findMany({
            where: {
              members: {
                some: {
                  userId: user.user.id,
                },
              },

              ...(statusFilter && {
                status:
                  statusFilter === "open"
                    ? "OPEN"
                    : statusFilter === "settled"
                      ? "SETTLED"
                      : "CLOSED",
              }),
            },
            include: {
              owner: true,
              members: {
                include: {
                  user: true,
                  payments: true,
                },
              },
            },
          });

          bills.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );

          if (limit) {
            bills = bills.slice(0, limit);
          }

          const billsWithPaymentStatus = bills.map((bill) => {
            const paidMembers = bill.members.filter(
              (member) => member.paidAmount >= member.assignedAmount,
            );
            const unpaidMembers = bill.members.filter(
              (member) => member.paidAmount < member.assignedAmount,
            );
            return {
              ...bill,
              paidMembers,
              unpaidMembers,
            };
          });

          return { status: true, data: billsWithPaymentStatus };
        } catch (e) {
          if (e instanceof Error) {
            error(400, { status: false, message: e.message });
          }
        }
      },
      {
        cookie: t.Cookie({
          access_token: t.String(),
        }),
        query: t.Object({
          limit: t.Optional(t.String()),
          status: t.Optional(t.Enum(BillStatus)),
        }),
        detail: {
          tags: ["User"],
        },
      },
    )
    .get(
      "/bills/active",
      async ({ cookie, error }) => {
        const access_token = cookie.access_token.value;

        if (!access_token) {
          return error(401, {
            status: false,
            message: "User not authenticated",
          });
        }

        try {
          const user = await prisma.userVerification.findUnique({
            where: { accessToken: access_token },
            include: { user: true },
          });

          if (!user) {
            return error(401, {
              status: false,
              message: "User not authenticated",
            });
          }

          const allActiveBills = await prisma.bill.findMany({
            where: {
              members: {
                some: {
                  userId: user.user.id,
                },
              },
              status: {
                in: ["OPEN"],
              },
            },
            include: { members: true },
          });

          return { status: true, data: allActiveBills };
        } catch (e) {
          if (e instanceof Error) {
            error(400, { status: false, message: e.message });
          }
        }
      },
      {
        detail: {
          tags: ["User"],
        },
      },
    ),
);
