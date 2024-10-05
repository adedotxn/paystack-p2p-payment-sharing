/*
  Warnings:

  - A unique constraint covering the columns `[accessToken]` on the table `UserVerification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserVerification_accessToken_key" ON "UserVerification"("accessToken");
