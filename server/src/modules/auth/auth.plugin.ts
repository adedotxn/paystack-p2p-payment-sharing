import { Elysia, t } from "elysia";
import { Environments } from "../../config/environment.config";
import { PrismaClient } from "@prisma/client";
import { authService } from "./auth.service";

const prisma = new PrismaClient();

export const authPlugin = new Elysia().group("/auth", (app) =>
  app
    .get(
      "/google",
      ({ redirect }) => {
        const authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${Environments.GOOGLE_CLIENT_ID}` +
          `&redirect_uri=${Environments.GOOGLE_REDIRECT_URI}` +
          `&response_type=code` +
          `&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email` +
          `&access_type=offline`;
        // +
        // `&prompt=consent`;
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

          const { access_token, refresh_token, expires_in, id_token } =
            tokenData;

          if (!access_token || !refresh_token) {
            console.error("Error with access/refresh token");
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

          if (!google_user) {
            console.error("Error with google info retrieval");

            return error(400, {
              status: false,
              message: "Issue with Google User Info",
            });
          }

          const existingUser = await authService.findUserByEmail(
            google_user.email,
          );

          if (existingUser) {
            await authService.updateUserVerification(google_user.id, {
              accessToken: access_token,
              refreshToken: refresh_token,
              expiresIn: expires_in,
              updatedAt: new Date(),
            });
          }

          if (!existingUser) {
            await authService.createUser(google_user, tokenData);
          }

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
      "/google/refresh-token",
      async ({ error, headers }) => {
        const authHeader = headers.authorization;

        if (!authHeader) {
          return error(401, {
            status: false,
            message: "Authorization header is missing",
          });
        }

        const tokenParts = authHeader.split(" ");
        if (tokenParts[0] !== "Bearer" || !tokenParts[1]) {
          return error(401, {
            status: false,
            message: "Invalid authorization format",
          });
        }

        const expired_access_token = tokenParts[1];

        try {
          const user =
            await authService.findUserVerificationByToken(expired_access_token);

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
            refresh_token: refresh_token,
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

          await authService.updateAccessToken(user.userId, access_token);

          return { success: true, message: "Token refreshed", access_token };
        } catch (e) {
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
