/*
  Warnings:

  - You are about to drop the column `maxScore` on the `pa_activities` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `pa_activities` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `pa_scores` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `pa_scores` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paActivityId,groupId]` on the table `pa_scores` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionDate` to the `pa_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cleanliness` to the `pa_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creativity` to the `pa_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `execution` to the `pa_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `pa_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamwork` to the `pa_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeManagement` to the `pa_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalScore` to the `pa_scores` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pa_scores" DROP CONSTRAINT "pa_scores_studentId_fkey";

-- DropIndex
DROP INDEX "pa_scores_paActivityId_studentId_key";

-- DropIndex
DROP INDEX "pa_scores_studentId_idx";

-- AlterTable
ALTER TABLE "pa_activities" DROP COLUMN "maxScore",
DROP COLUMN "title",
ADD COLUMN     "sessionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "topic" TEXT;

-- AlterTable
ALTER TABLE "pa_scores" DROP COLUMN "score",
DROP COLUMN "studentId",
ADD COLUMN     "cleanliness" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "creativity" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "execution" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "teamwork" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "timeManagement" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "totalScore" DECIMAL(5,2) NOT NULL;

-- CreateIndex
CREATE INDEX "pa_scores_groupId_idx" ON "pa_scores"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "pa_scores_paActivityId_groupId_key" ON "pa_scores"("paActivityId", "groupId");

-- AddForeignKey
ALTER TABLE "pa_scores" ADD CONSTRAINT "pa_scores_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
