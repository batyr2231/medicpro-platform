-- AlterTable
ALTER TABLE "Medic" ADD COLUMN     "availableProcedures" TEXT[];

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "procedures" TEXT[];
