/*
  Warnings:

  - Added the required column `currency` to the `Bill` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "currency" TEXT NOT NULL;
