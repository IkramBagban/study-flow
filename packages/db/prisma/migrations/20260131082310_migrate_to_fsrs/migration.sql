/*
  Warnings:

  - You are about to drop the column `box` on the `flashcard` table. All the data in the column will be lost.
  - You are about to drop the column `easeFactor` on the `flashcard` table. All the data in the column will be lost.
  - You are about to drop the column `interval` on the `flashcard` table. All the data in the column will be lost.
  - You are about to drop the column `nextReview` on the `flashcard` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "flashcard_courseId_nextReview_idx";

-- AlterTable
ALTER TABLE "flashcard" DROP COLUMN "box",
DROP COLUMN "easeFactor",
DROP COLUMN "interval",
DROP COLUMN "nextReview",
ADD COLUMN     "conceptId" TEXT,
ADD COLUMN     "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "due" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "elapsedDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReview" TIMESTAMP(3),
ADD COLUMN     "reps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "state" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "flashcard_courseId_due_idx" ON "flashcard"("courseId", "due");

-- AddForeignKey
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
