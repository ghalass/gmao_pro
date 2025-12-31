/*
  Warnings:

  - You are about to drop the `_ParcToTypeOrgane` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ParcToTypeOrgane" DROP CONSTRAINT "_ParcToTypeOrgane_A_fkey";

-- DropForeignKey
ALTER TABLE "_ParcToTypeOrgane" DROP CONSTRAINT "_ParcToTypeOrgane_B_fkey";

-- AlterTable
ALTER TABLE "type_organe" ADD COLUMN     "parcId" TEXT;

-- DropTable
DROP TABLE "_ParcToTypeOrgane";

-- CreateTable
CREATE TABLE "type_organe_parc" (
    "parc_id" TEXT NOT NULL,
    "type_organe_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "type_organe_parc_pkey" PRIMARY KEY ("parc_id","type_organe_id")
);

-- AddForeignKey
ALTER TABLE "type_organe" ADD CONSTRAINT "type_organe_parcId_fkey" FOREIGN KEY ("parcId") REFERENCES "parc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_organe_parc" ADD CONSTRAINT "type_organe_parc_parc_id_fkey" FOREIGN KEY ("parc_id") REFERENCES "parc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_organe_parc" ADD CONSTRAINT "type_organe_parc_type_organe_id_fkey" FOREIGN KEY ("type_organe_id") REFERENCES "type_organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
