import { PrismaClient } from "@prisma/client";

class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateUserVerification(
    googleId: string,
    data: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      updatedAt: Date;
    },
  ) {
    return this.prisma.userVerification.update({
      where: { googleId },
      data,
    });
  }

  async createUser(
    googleUser: {
      id: string;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
      email: string;
    },
    tokenData: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      id_token: any;
    },
  ) {
    return this.prisma.user.create({
      data: {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        verification: {
          create: {
            googleId: googleUser.id,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
            idToken: String(tokenData.id_token),
          },
        },
      },
    });
  }

  async findUserVerificationByToken(accessToken: string) {
    return this.prisma.userVerification.findUnique({
      where: { accessToken },
    });
  }

  async updateAccessToken(userId: number, newAccessToken: string) {
    return this.prisma.userVerification.update({
      where: { userId },
      data: {
        accessToken: newAccessToken,
        updatedAt: new Date(),
      },
    });
  }
}

export const authService = new AuthService();
