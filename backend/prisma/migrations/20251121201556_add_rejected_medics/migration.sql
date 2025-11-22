-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "rejectedMedicIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
