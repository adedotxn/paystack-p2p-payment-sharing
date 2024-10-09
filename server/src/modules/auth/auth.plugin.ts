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
          `&access_type=offline`;
        +`&prompt=consent`;
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
      async ({ query, error }) => {
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

          return { access_token, user: google_user };
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
      async ({ error, headers }) => {
        const authHeader = headers.authorization;
        const tokenParts = authHeader.split(" ");
        const expired_access_token = tokenParts[1];

        try {
          const user = await prisma.userVerification.findUnique({
            where: { accessToken: expired_access_token },
          });

          if (!user) {
            return error(401, {
              status: false,
              message: "Invalid or expired access token",
            });
          }

          const refresh_token = user.refreshToken; // Get the stored refresh token

          if (!refresh_token) {
            return error(401, {
              status: false,
              message: "Refresh token not found",
            });
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

          return { success: true, message: "Token refreshed" };
        } catch (e) {
          console.error("Error:", e);
          if (e instanceof Error) {
            return error(500, e.message);
          }
        }
      },
      {
        headers: t.Object({
          authorization: t.String(),
        }),
        detail: {
          tags: ["Auth"],
        },
      },
    ),
);
