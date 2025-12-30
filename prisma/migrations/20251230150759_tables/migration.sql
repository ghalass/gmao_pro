/*
  Warnings:

  - A unique constraint covering the columns `[name,entrepriseId]` on the table `engin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,entrepriseId]` on the table `panne` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,entrepriseId]` on the table `parc` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,entrepriseId]` on the table `site` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,entrepriseId]` on the table `typeconsommation_lub` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,entrepriseId]` on the table `typepanne` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,entrepriseId]` on the table `typeparc` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entrepriseId` to the `engin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `panne` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `parc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `typeconsommation_lub` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `typepanne` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entrepriseId` to the `typeparc` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "engin_name_key";

-- DropIndex
DROP INDEX "panne_name_key";

-- DropIndex
DROP INDEX "parc_name_key";

-- DropIndex
DROP INDEX "site_name_key";

-- DropIndex
DROP INDEX "typeconsommation_lub_name_key";

-- DropIndex
DROP INDEX "typepanne_name_key";

-- DropIndex
DROP INDEX "typeparc_name_key";

-- AlterTable
ALTER TABLE "engin" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "panne" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "parc" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "site" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "typeconsommation_lub" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "typepanne" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "typeparc" ADD COLUMN     "entrepriseId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "engin_name_entrepriseId_key" ON "engin"("name", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "panne_name_entrepriseId_key" ON "panne"("name", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "parc_name_entrepriseId_key" ON "parc"("name", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "site_name_entrepriseId_key" ON "site"("name", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "typeconsommation_lub_name_entrepriseId_key" ON "typeconsommation_lub"("name", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "typepanne_name_entrepriseId_key" ON "typepanne"("name", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "typeparc_name_entrepriseId_key" ON "typeparc"("name", "entrepriseId");

-- AddForeignKey
ALTER TABLE "site" ADD CONSTRAINT "site_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typeparc" ADD CONSTRAINT "typeparc_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parc" ADD CONSTRAINT "parc_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typeconsommation_lub" ADD CONSTRAINT "typeconsommation_lub_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engin" ADD CONSTRAINT "engin_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typepanne" ADD CONSTRAINT "typepanne_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panne" ADD CONSTRAINT "panne_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
