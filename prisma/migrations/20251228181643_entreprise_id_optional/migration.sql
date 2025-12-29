-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_entrepriseId_fkey";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "entrepriseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
