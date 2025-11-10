-- AlterTable
ALTER TABLE "Medic" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "identityDocument" JSONB,
ADD COLUMN     "residenceAddress" TEXT;
