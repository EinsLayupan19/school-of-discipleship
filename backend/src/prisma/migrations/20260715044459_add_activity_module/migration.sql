/*
  Warnings:

  - Added the required column `classId` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `activities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('QUIZ', 'ASSIGNMENT', 'PERFORMANCE', 'RECITATION');

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_gradeCategoryId_fkey";

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "classId" TEXT NOT NULL,
ADD COLUMN     "type" "ActivityType" NOT NULL,
ALTER COLUMN "gradeCategoryId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "activities_classId_idx" ON "activities"("classId");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_gradeCategoryId_fkey" FOREIGN KEY ("gradeCategoryId") REFERENCES "grade_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
