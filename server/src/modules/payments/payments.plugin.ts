import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { Environments } from "../../config/environment.config";

const prisma = new PrismaClient();
export const paymentsPlugin = new Elysia().group("/payment", (app) =>
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
      "/:billId",
      async ({ headers, body, params, error }) => {
        const authHeader = headers.authorization;
        const tokenParts = authHeader.split(" ");
        const access_token = tokenParts[1];

        try {
          const user = await prisma.userVerification.findUnique({
            where: { accessToken: access_token },
            include: { user: true },
          });

          if (!user) {
            return error(404, { status: false, message: "User not found" });
          }

          // Fetch BillMember to ensure user is part of the bill
          const billMember = await prisma.billMember.findFirst({
            where: { userId: user.user.id, billId: params.billId },
          });

          if (!billMember) {
            return error(403, {
              status: false,
              message: "You are not part of this bill",
            });
          }

          // Paystack charge API
          const res = await fetch(
            "https://api.paystack.co/transaction/initialize",
            {
              method: "POST",
              body: JSON.stringify({
                email: user.user.email,
                amount: body.amount,
              }),
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Environments.PAYSTACK_SECRET_KEY}`,
              },
            },
          );

          const paystackResponse = await res.json();
          if (!paystackResponse.status) {
            return error(400, {
              status: false,
              message: paystackResponse.message,
            });
          }

          const payment = await prisma.payment.create({
            data: {
              amount: body.amount,
              status: "PENDING",
              paystackRef: paystackResponse.data.reference,
              userId: user.user.id,
              billId: params.billId,
              billMemberId: billMember.id,
            },
          });

          return { status: true, message: "Payment initiated", data: payment };
        } catch (e) {
          if (e instanceof Error) {
            return error(400, { status: false, message: e.message });
          }
        }
      },
      {
        headers: t.Object({
          authorization: t.String(),
        }),
        body: t.Object({
          amount: t.Number(),
        }),
        params: t.Object({
          billId: t.Number(),
        }),
        detail: {
          tags: ["Payment"],
        },
      },
    )
    .patch(
      "/verify/:billId",
      async ({ params, error, body, headers }) => {
        const { paystackRef } = body;

        const authHeader = headers.authorization;
        const tokenParts = authHeader.split(" ");
        const access_token = tokenParts[1];

        try {
          const user = await prisma.userVerification.findUnique({
            where: { accessToken: access_token },
            include: { user: true },
          });

          if (!user) {
            return error(404, { status: false, message: "User not found" });
          }

          const billMember = await prisma.billMember.findFirst({
            where: { userId: user.user.id, billId: params.billId },
          });

          if (!billMember) {
            return error(403, {
              status: false,
              message: "You are not part of this bill",
            });
          }

          if (billMember.paidAmount === billMember.assignedAmount) {
            return error(400, {
              status: false,
              message: "You have already sorted your part of the bill",
            });
          }

          const res = await fetch(
            `https://api.paystack.co/transaction/verify/${paystackRef}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${Environments.PAYSTACK_SECRET_KEY}`,
              },
            },
          );

          const paystackResponse = await res.json();
          console.log("verify pstackresp", paystackResponse);
          if (!paystackResponse.status) {
            return error(400, {
              status: false,
              message: paystackResponse.message,
            });
          }

          const payment = await prisma.payment.create({
            data: {
              amount: paystackResponse.data.amount / 100,
              status:
                paystackResponse.data.status === "success"
                  ? "SUCCESSFUL"
                  : "FAILED",
              paystackRef: paystackResponse.data.reference,
              userId: user.user.id,
              billId: params.billId,
              billMemberId: billMember.id,
              updatedAt: paystackResponse.data.paid_at,
            },
          });

          if (billMember) {
            await prisma.billMember.update({
              where: { id: billMember.id },
              data: { paidAmount: billMember.paidAmount + payment.amount },
            });

            const bill = await prisma.bill.findUnique({
              where: { id: billMember.billId },
            });

            if (bill) {
              const updatedBill = await prisma.bill.update({
                where: { id: bill.id },
                data: { currentAmount: bill.currentAmount + payment.amount },
                select: {
                  currentAmount: true,
                  totalAmount: true,
                  status: true,
                },
              });

              if (updatedBill.currentAmount >= updatedBill.totalAmount) {
                await prisma.bill.update({
                  where: { id: bill.id },
                  data: { status: "CLOSED" },
                });
              }
            }
          }

          return {
            status: true,
            message: "Payment verified",
            data: payment,
          };
        } catch (e) {
          if (e instanceof Error) {
            return error(500, { status: false, message: e.message });
          }
        }
      },
      {
        body: t.Object({
          paystackRef: t.String(),
        }),
        params: t.Object({
          billId: t.Number(),
        }),
        headers: t.Object({
          authorization: t.String(),
        }),
        detail: {
          tags: ["Payment"],
        },
      },
    )
    .patch(
      "/settle-bill/:billId",
      async ({ headers, params, error, body }) => {
        const authHeader = headers.authorization;
        const tokenParts = authHeader.split(" ");
        const access_token = tokenParts[1];

        try {
          const bill = await prisma.bill.findUnique({
            where: { id: params.billId },
            include: { owner: true },
          });

          if (!bill) {
            return error(404, { status: false, message: "Bill not found" });
          }

          const user = await prisma.userVerification.findUnique({
            where: { accessToken: access_token },
            include: { user: true },
          });

          if (bill.ownerId !== user?.user.id) {
            return error(401, {
              status: false,
              message:
                "Unauthorized. You are not the creator of this bill. Contact them to settle the bill",
            });
          }

          if (bill.currentAmount < bill.totalAmount) {
            return error(400, {
              status: false,
              message: "The bill is not fully paid yet",
            });
          }

          const res = await fetch(`https://api.paystack.co/transferrecipient`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Environments.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "nuban", // For Nigerian bank accounts
              name: body.recipient_name, // Recipient's name
              account_number: body.recipient_account_number, // Recipient's account number
              bank_code: body.recipient_bank_code, // Bank code (058 = GTBank for example)
              currency: "NGN", // Currency of the transfer
            }),
          });

          const transferRecipientsResponse = await res.json();

          if (transferRecipientsResponse.status === false) {
            return error(400, {
              status: false,
              message: transferRecipientsResponse.message,
            });
          }

          if (
            transferRecipientsResponse.status &&
            transferRecipientsResponse.data.recipient_code
          ) {
            const recipient_code =
              transferRecipientsResponse.data.recipient_code;

            const response = await fetch(`https://api.paystack.co/transfer`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Environments.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                source: "balance",
                reason: "Bill payment",
                amount: bill.totalAmount,
                recipient: recipient_code,
              }),
            });

            const transferResponse = await response.json();

            console.log({ transferResponse });

            if (!transferResponse.status) {
              return error(400, {
                status: false,
                message: transferResponse.message,
              });
            }

            await prisma.bill.update({
              where: { id: params.billId },
              data: { status: "SETTLED" },
            });
          }

          return {
            status: true,
            message: "Bill finalized and payment sent",
            data: transferRecipientsResponse,
          };
        } catch (e) {
          if (e instanceof Error) {
            return error(500, { status: false, message: e.message });
          }
        }
      },
      {
        params: t.Object({
          billId: t.Number(),
        }),
        headers: t.Object({
          authorization: t.String(),
        }),
        body: t.Object({
          recipient_name: t.String(),
          recipient_account_number: t.Number(),
          recipient_bank_code: t.String(),
        }),
        detail: {
          tags: ["Payment"],
        },
      },
    ),
);
