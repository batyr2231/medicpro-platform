-- AlterTable
ALTER TABLE "Medic" ADD COLUMN     "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agreedToTermsAt" TIMESTAMP(3);
