-- DropIndex
DROP INDEX "Bill_slug_key";

-- AlterTable
ALTER TABLE "Bill" ALTER COLUMN "slug" DROP NOT NULL;
