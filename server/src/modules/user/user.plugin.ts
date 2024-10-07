import { Elysia, t } from "elysia";
import { Environments } from "../../config/environment.config";
import { PrismaClient } from "@prisma/client";

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

          // Fetch bills the user owns or is a member of
          const ownedBills = await prisma.bill.findMany({
            where: { ownerId: user.user.id },
            include: {
              owner: true,
              members: {
                include: { user: true, payments: true },
              },
            },
          });

          const memberOfBills = await prisma.bill.findMany({
            where: {
              members: {
                some: {
                  userId: user.user.id,
                },
              },
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

          let allBills = [...ownedBills, ...memberOfBills];

          allBills.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );

          if (limit) {
            allBills = allBills.slice(0, limit);
          }

          const billsWithPaymentStatus = allBills.map((bill) => {
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
        // response: {
        //   200: t.Object({
        //     status: t.Boolean(),
        //     data: t.Array(
        //       t.Object({
        //         id: t.Number(),
        //         title: t.String(),
        //         slug: t.String(),
        //         description: t.String(),
        //         totalAmount: t.Number(),
        //         currentAmount: t.Number(),
        //         createdAt: t.String(),
        //         updatedAt: t.String(),
        //         currency: t.String(),
        //         ownerId: t.Number(),
        //         members: t.Array(t.Object({ userId: t.Number() })),
        //       }),
        //     ),
        //   }),
        //   400: t.Object({
        //     status: t.Boolean(),
        //     message: t.String(),
        //   }),
        //   401: t.Object({
        //     status: t.Boolean(),
        //     message: t.String(),
        //   }),
        //   500: t.Object({
        //     status: t.Boolean(),
        //     message: t.String(),
        //   }),
        // },
        cookie: t.Cookie({
          access_token: t.String(),
        }),
        query: t.Object({
          limit: t.Optional(t.String()),
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

          const ownedActiveBills = await prisma.bill.findMany({
            where: {
              ownerId: user.user.id,
              status: {
                in: ["OPEN"],
              },
            },
            include: { members: true },
          });

          const memberOfActiveBills = await prisma.bill.findMany({
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

          const allActiveBills = [...ownedActiveBills, ...memberOfActiveBills];

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
