/*
  Warnings:

  - Added the required column `assignedAmount` to the `BillMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paidAmount` to the `BillMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `billMemberId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BillMember" ADD COLUMN     "assignedAmount" INTEGER NOT NULL,
ADD COLUMN     "paidAmount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "billMemberId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billMemberId_fkey" FOREIGN KEY ("billMemberId") REFERENCES "BillMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
