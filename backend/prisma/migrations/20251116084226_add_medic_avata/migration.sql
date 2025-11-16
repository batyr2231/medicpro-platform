/*
  Warnings:

  - You are about to drop the column `portfolio` on the `Medic` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Medic" DROP COLUMN "portfolio",
ADD COLUMN     "avatar" TEXT;
