-- CreateEnum
CREATE TYPE "WeekStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "weeks" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "label" TEXT,
    "attendanceDone" BOOLEAN NOT NULL DEFAULT false,
    "quizDone" BOOLEAN NOT NULL DEFAULT false,
    "assignmentDone" BOOLEAN NOT NULL DEFAULT false,
    "recitationDone" BOOLEAN NOT NULL DEFAULT false,
    "performanceDone" BOOLEAN NOT NULL DEFAULT false,
    "paDone" BOOLEAN NOT NULL DEFAULT false,
    "groupChipsDone" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" "WeekStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weeks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weeks_batchId_idx" ON "weeks"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "weeks_batchId_weekNumber_key" ON "weeks"("batchId", "weekNumber");

-- AddForeignKey
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
