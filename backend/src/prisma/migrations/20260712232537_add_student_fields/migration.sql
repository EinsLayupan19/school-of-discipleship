/*
  Warnings:

  - Added the required column `category` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "StudentCategory" AS ENUM ('YOUTH', 'ADULT', 'SENIOR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ARCHIVE';
ALTER TYPE "AuditAction" ADD VALUE 'UNARCHIVE';
ALTER TYPE "AuditAction" ADD VALUE 'IMPORT';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "category" "StudentCategory" NOT NULL,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sex" "Sex" NOT NULL;
