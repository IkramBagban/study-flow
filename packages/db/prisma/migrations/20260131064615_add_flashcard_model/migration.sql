-- CreateTable
CREATE TABLE "flashcard" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "chapterId" TEXT,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "explanation" TEXT,
    "type" TEXT NOT NULL DEFAULT 'basic',
    "box" INTEGER NOT NULL DEFAULT 0,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "nextReview" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flashcard_courseId_nextReview_idx" ON "flashcard"("courseId", "nextReview");

-- AddForeignKey
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
