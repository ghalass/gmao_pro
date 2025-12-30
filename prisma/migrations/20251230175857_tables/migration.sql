/*
  Warnings:

  - A unique constraint covering the columns `[name,entrepriseId]` on the table `lubrifiant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,typeOrganeId,entrepriseId]` on the table `organe` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,entrepriseId]` on the table `type_lubrifiant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,entrepriseId]` on the table `type_organe` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entrepriseId` to the `lubrifiant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `organe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `saisie_hrm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `type_lubrifiant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `type_organe` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "lubrifiant_name_key";

-- DropIndex
DROP INDEX "organe_name_typeOrganeId_key";

-- DropIndex
DROP INDEX "type_lubrifiant_name_key";

-- DropIndex
DROP INDEX "type_organe_name_key";

-- AlterTable
ALTER TABLE "lubrifiant" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "organe" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "saisie_hrm" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "type_lubrifiant" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "type_organe" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "lubrifiant_name_entrepriseId_key" ON "lubrifiant"("name", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "organe_name_typeOrganeId_entrepriseId_key" ON "organe"("name", "typeOrganeId", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "type_lubrifiant_name_entrepriseId_key" ON "type_lubrifiant"("name", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "type_organe_name_entrepriseId_key" ON "type_organe"("name", "entrepriseId");

-- AddForeignKey
ALTER TABLE "saisie_hrm" ADD CONSTRAINT "saisie_hrm_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organe" ADD CONSTRAINT "organe_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_organe" ADD CONSTRAINT "type_organe_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_lubrifiant" ADD CONSTRAINT "type_lubrifiant_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lubrifiant" ADD CONSTRAINT "lubrifiant_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
