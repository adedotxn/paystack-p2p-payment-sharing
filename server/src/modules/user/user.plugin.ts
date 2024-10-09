import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { BillStatus, userService } from "./user.service";

const prisma = new PrismaClient();

export const userPlugin = new Elysia().group("/user", (app) =>
  app
    .guard({
      headers: t.Object({
        authorization: t.String(),
      }),
      async beforeHandle({ headers, error }) {
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
    .get(
      "/profile",
      async ({ headers, error }) => {
        const authHeader = headers.authorization;

        try {
          const user = await userService.getUserFromToken(authHeader);

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
      async ({ error, query, headers }) => {
        const authHeader = headers.authorization;

        try {
          const user = await userService.getUserFromToken(authHeader);

          if (!user) {
            return error(401, {
              status: false,
              message: "User not authenticated",
            });
          }

          const limit = query.limit ? parseInt(query.limit) : null;

          const statusFilter = query.status;

          let bills = await userService.getUserBills(
            user.user.id,
            statusFilter,
          );

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
      async ({ error, headers }) => {
        const authHeader = headers.authorization;

        try {
          const user = await userService.getUserFromToken(authHeader);

          if (!user) {
            return error(401, {
              status: false,
              message: "User not authenticated",
            });
          }

          const allActiveBills = await userService.getUserActiveBills(
            user.user.id,
          );

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
    )
    .get(
      "/overview",
      async ({ error, headers }) => {
        const authHeader = headers.authorization;

        try {
          const user = await userService.getUserFromToken(authHeader!);

          if (!user) {
            return error(401, {
              status: false,
              message: "User not authenticated",
            });
          }

          const paymentSummary = await userService.getUserPaymentSummary(
            user.user.id,
          );

          const totalPaid = paymentSummary.totalPaid;
          const totalAssigned = paymentSummary.totalAssigned;
          const totalPaidAssigned = paymentSummary.totalPaidAssigned;

          return {
            status: true,
            data: {
              totalPaid,
              totalAssigned,
              totalPaidAssigned,
              totalUnpaid: totalAssigned - totalPaidAssigned,
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
          tags: ["User"],
        },
      },
    ),
);
