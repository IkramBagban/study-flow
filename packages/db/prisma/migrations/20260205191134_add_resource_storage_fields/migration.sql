-- AlterTable
ALTER TABLE "resource" ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "url" TEXT;
