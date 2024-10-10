import { Elysia, t } from "elysia";
import { Environments } from "../../config/environment.config";
import { paymentService } from "./payments.service";

export const paymentsPlugin = new Elysia().group("/payment", (app) =>
  app
    .guard({
      headers: t.Object({
        authorization: t.String(),
      }),
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
    .patch(
      "/verify/:billId",
      async ({ params, error, body, headers }) => {
        const { paystackRef } = body;

        const authHeader = headers.authorization;

        try {
          const user = await paymentService.findUserByAccessToken(authHeader);

          if (!user) {
            return error(404, { status: false, message: "User not found" });
          }

          const billMember = await paymentService.findBillMember(
            user.user.id,
            params.billId,
          );

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
          if (!paystackResponse.status) {
            return error(400, {
              status: false,
              message: paystackResponse.message,
            });
          }

          const payment = await paymentService.createPayment({
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
          });

          if (billMember) {
            await paymentService.updateBillMember(
              billMember.id,
              billMember.paidAmount + payment.amount,
            );

            const bill = await paymentService.findBillById(billMember.billId);

            if (bill) {
              const updatedBill = await paymentService.updateBill(
                bill.id,
                bill.currentAmount + payment.amount,
              );

              if (updatedBill.currentAmount >= updatedBill.totalAmount) {
                await paymentService.closeBill(bill.id);
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
        detail: {
          tags: ["Payment"],
        },
      },
    )
    .patch(
      "/settle-bill/:billId",
      async ({ headers, params, error, body }) => {
        const authHeader = headers.authorization;

        try {
          const bill = await paymentService.findBillById(params.billId);

          if (!bill) {
            return error(404, { status: false, message: "Bill not found" });
          }

          const user = await paymentService.findUserByAccessToken(authHeader);

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
              bank_code: body.recipient_bank_code, // Bank code
              currency: "NGN", // Currency of the transfer
            }),
          });

          const transferRecipientsResponse = await res.json();

          console.log("TRF RCPTS:", transferRecipientsResponse);

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

            console.log("TRF:", transferResponse);

            if (!transferResponse.status) {
              return error(400, {
                status: false,
                message: transferResponse.message,
              });
            }

            await paymentService.settleBill(params.billId);
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
        body: t.Object({
          recipient_name: t.String(),
          recipient_account_number: t.Number(),
          recipient_bank_code: t.String(),
        }),
        detail: {
          tags: ["Payment"],
        },
      },
    )
    .get(
      "/banks",
      async ({ query, error }) => {
        const cursor = query.cursor || "";
        const perPage = 20;

        try {
          const response = await fetch(
            `https://api.paystack.co/bank?country=nigeria&use_cursor=true&perPage=${perPage}&next=${cursor}`,
          );

          const data = await response.json();

          if (!data.status) {
            return error(400, {
              status: false,
              message: data.message,
            });
          }

          console.log("data", data);
          return {
            data: data.data,
            meta: data.meta,
          };
        } catch (e) {
          if (e instanceof Error) {
            return error(500, { status: false, message: e.message });
          }
        }
      },
      {
        detail: {
          tags: ["Payment"],
        },
        query: t.Object({
          cursor: t.Optional(t.String()),
        }),
      },
    ),
);
