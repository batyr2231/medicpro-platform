-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "complaintResolvedAt" TIMESTAMP(3),
ADD COLUMN     "complaintResolvedBy" TEXT,
ADD COLUMN     "complaintStatus" "ComplaintStatus" NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "Review_complaintStatus_idx" ON "Review"("complaintStatus");
