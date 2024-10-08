import { Elysia, t } from "elysia";
import { Environments } from "../../config/environment.config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authPlugin = new Elysia().group("/auth", (app) =>
  app
    .get(
      "/google",
      ({ redirect }) => {
        console.log(Environments.GOOGLE_REDIRECT_URI);
        const authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${Environments.GOOGLE_CLIENT_ID}` +
          `&redirect_uri=${Environments.GOOGLE_REDIRECT_URI}` +
          `&response_type=code` +
          `&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email` +
          `&access_type=offline` +
          `&prompt=consent`;
        return { redirect: authUrl };
      },
      {
        detail: {
          tags: ["Auth"],
        },
      },
    )
    .get(
      "/google/callback",
      async ({ query, error, cookie }) => {
        const { code } = query;

        const body = {
          client_id: Environments.GOOGLE_CLIENT_ID!,
          client_secret: Environments.GOOGLE_CLIENT_SECRET!,
          redirect_uri: Environments.GOOGLE_REDIRECT_URI!,
          grant_type: "authorization_code",
          code: code!,
        };

        try {
          const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams(body),
            },
          );

          const tokenData = await tokenResponse.json();

          if (!tokenResponse.ok) {
            console.error(
              `Error exchanging code for tokens: ${tokenData.error}`,
            );
            return error(500, { status: false, message: tokenData.error });
          }

          console.log("TokenData", tokenData);

          const { access_token, refresh_token, expires_in, id_token } =
            tokenData;

          if (!access_token || !refresh_token) {
            return error(500, {
              status: false,
              message: "Problem during auth flow. Try ahaon",
            });
          }
          const userInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            },
          );

          const google_user = (await userInfoResponse.json()) as {
            id: string;
            name: string;
            given_name: string;
            family_name: string;
            picture: string;
            email: string;
          };

          console.log("Userinfo", google_user);
          if (!google_user) {
            return error(400, {
              status: false,
              message: "Issue with Google User Info",
            });
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: google_user.email },
          });

          if (existingUser) {
            await prisma.userVerification.update({
              where: { googleId: google_user.id },
              data: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresIn: expires_in,
                updatedAt: new Date(),
              },
            });
          }

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: google_user.email,
                name: google_user.name,
                picture: google_user.picture,

                verification: {
                  create: {
                    googleId: google_user.id,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresIn: expires_in,
                    idToken: String(id_token),
                  },
                },
              },
            });
          }

          console.log("User Info:", google_user);

          cookie.access_token.value = access_token;
          cookie.refresh_token.value = refresh_token;

          cookie.access_token.httpOnly = true;
          cookie.refresh_token.httpOnly = true;

          cookie.access_token.maxAge = expires_in;
          cookie.refresh_token.maxAge = 60 * 60 * 24 * 30; // 30 days

          cookie.access_token.secure = true;
          cookie.refresh_token.secure = true;

          cookie.access_token.path = "/";
          cookie.refresh_token.path = "/";

          cookie.access_token.domain = Environments.DOMAIN;
          cookie.refresh_token.domain = Environments.DOMAIN;

          cookie.access_token.sameSite = "none";
          cookie.refresh_token.sameSite = "none";

          return { user: { name: google_user.name, email: google_user.email } };
        } catch (e) {
          console.error("Error:", e);
          if (e instanceof Error) {
            error(500, e.message);
          }
        }
      },
      {
        detail: {
          tags: ["Auth"],
        },
      },
    )
    .post(
      "/refresh-token",
      async ({ cookie, error }) => {
        const refresh_token = cookie.refresh_token.value;
        const expired_access_token = cookie.access_token.value;

        if (!refresh_token) {
          return error(401, "Refresh token not found");
        }

        try {
          const user = await prisma.userVerification.findUnique({
            where: { accessToken: expired_access_token }, // Adjust if needed to find by refresh token
            select: {
              userId: true,
            },
          });

          if (!user || !user.userId) {
            error(401, "User not found");
          }

          const body = {
            client_id: Environments.GOOGLE_CLIENT_ID!,
            client_secret: Environments.GOOGLE_CLIENT_SECRET!,
            refresh_token: refresh_token!,
            grant_type: "refresh_token",
          };

          const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams(body),
            },
          );

          const tokenData = await tokenResponse.json();

          if (!tokenResponse.ok) {
            console.error(`Error refreshing tokens: ${tokenData.error}`);
            return error(500, tokenData.error);
          }

          const { access_token, expires_in } = tokenData;

          await prisma.userVerification.update({
            where: { userId: user?.userId },
            data: {
              accessToken: access_token,
              updatedAt: new Date(),
            },
          });

          // Update the access token cookie
          cookie.access_token.value = access_token;
          cookie.access_token.httpOnly = true;
          cookie.access_token.maxAge = expires_in;
          cookie.access_token.secure = true;
          cookie.access_token.path = "/";

          return { success: true, message: "Token refreshed" };
        } catch (e) {
          console.error("Error:", e);
          if (e instanceof Error) {
            return error(500, e.message);
          }
        }
      },
      {
        detail: {
          tags: ["Auth"],
        },
      },
    ),
);
