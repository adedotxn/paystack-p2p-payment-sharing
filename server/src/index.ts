import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { authPlugin } from "./modules/auth/auth.plugin";

const app = new Elysia()
  .use(swagger())
  .use(
    cors({
      credentials: true,
    }),
  )
  .use(authPlugin)
  .get("/", () => "Hello Elysia")
  .listen(5000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
