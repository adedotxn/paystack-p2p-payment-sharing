/*
  Warnings:

  - Added the required column `assignedAmount` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "assignedAmount" INTEGER NOT NULL;
