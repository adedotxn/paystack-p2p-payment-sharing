/*
  Warnings:

  - Added the required column `accessToken` to the `UserVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresIn` to the `UserVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToken` to the `UserVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshToken` to the `UserVerification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserVerification" ADD COLUMN     "accessToken" TEXT NOT NULL,
ADD COLUMN     "expiresIn" INTEGER NOT NULL,
ADD COLUMN     "idToken" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT NOT NULL;
