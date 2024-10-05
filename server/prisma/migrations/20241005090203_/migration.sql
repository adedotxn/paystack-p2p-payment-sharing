/*
  Warnings:

  - You are about to drop the column `paystackRef` on the `Bill` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Bill_paystackRef_key";

-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "paystackRef";
