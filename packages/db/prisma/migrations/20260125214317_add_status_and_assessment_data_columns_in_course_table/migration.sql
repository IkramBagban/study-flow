-- AlterTable
ALTER TABLE "course" ADD COLUMN     "assessmentData" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';
