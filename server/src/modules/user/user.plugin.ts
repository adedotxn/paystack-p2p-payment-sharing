import { Elysia, t } from "elysia";
import { Environments } from "../../config/environment.config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const userPlugin = new Elysia({ prefix: "/user" })
  .get("/bills", async ({ cookie, error }) => {
    const access_token = cookie.access_token.value;

    if (!access_token) {
      return error(401, { status: false, message: "User not authenticated" });
    }

    try {
      const user = await prisma.userVerification.findUnique({
        where: { accessToken: access_token },
        include: { user: true },
      });

      if (!user) {
        return error(401, { status: false, message: "User not authenticated" });
      }

      // Fetch bills the user owns or is a member of
      const ownedBills = await prisma.bill.findMany({
        where: { ownerId: user.user.id },
        include: { members: true },
      });

      const memberOfBills = await prisma.bill.findMany({
        where: {
          members: {
            some: {
              userId: user.user.id,
            },
          },
        },
        include: { members: true },
      });

      // Combine owned and member bills
      const allBills = [...ownedBills, ...memberOfBills];

      return { status: true, bills: allBills };
    } catch (e) {
      if (e instanceof Error) {
        error(400, { status: false, message: e.message });
      }
    }
  })
  .get("/bills/active", async ({ cookie, error }) => {
    const access_token = cookie.access_token.value;

    if (!access_token) {
      return error(401, { status: false, message: "User not authenticated" });
    }

    try {
      const user = await prisma.userVerification.findUnique({
        where: { accessToken: access_token },
        include: { user: true },
      });

      if (!user) {
        return error(401, { status: false, message: "User not authenticated" });
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

      return { status: true, activeBills: allActiveBills };
    } catch (e) {
      if (e instanceof Error) {
        error(400, { status: false, message: e.message });
      }
    }
  });
