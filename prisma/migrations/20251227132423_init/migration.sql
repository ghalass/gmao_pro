/*
  Warnings:

  - Added the required column `entrepriseId` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LANG" AS ENUM ('ar', 'fr');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "entrepriseId" TEXT NOT NULL,
ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "entreprise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lang" "LANG" NOT NULL DEFAULT 'fr',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entreprise_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
