/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `entreprise` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resource,action,entrepriseId]` on the table `permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,entrepriseId]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entrepriseId` to the `permission` table without a default value. This is not possible if the table is not empty.
  - Made the column `action` on table `permission` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "permission_resource_action_key";

-- DropIndex
DROP INDEX "role_name_key";

-- AlterTable
ALTER TABLE "permission" ADD COLUMN     "entrepriseId" TEXT NOT NULL,
ALTER COLUMN "action" SET NOT NULL;

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "entrepriseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "entreprise_name_key" ON "entreprise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_resource_action_entrepriseId_key" ON "permission"("resource", "action", "entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_entrepriseId_key" ON "role"("name", "entrepriseId");

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "permission_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
