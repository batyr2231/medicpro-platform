-- AlterTable
ALTER TABLE "Medic" ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Алматы';

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "city" SET DEFAULT 'Алматы';
