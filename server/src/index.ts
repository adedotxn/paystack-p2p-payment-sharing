import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { authPlugin } from "./modules/auth/auth.plugin";
import { billsPlugin } from "./modules/bills/bills.plugin";
import { userPlugin } from "./modules/user/user.plugin";
import { paymentsPlugin } from "./modules/payments/payments.plugin";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        tags: [
          { name: "Auth", description: "Authentication endpoints" },
          { name: "User", description: "User endpoints" },
          { name: "Bill", description: "Bill endpoints" },
          { name: "Payment", description: "Payment endpoints" },
        ],
      },
    }),
  )
  .use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  )
  .use(authPlugin)
  .use(userPlugin)
  .use(billsPlugin)
  .use(paymentsPlugin)
  .listen(5000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
