/*
  Warnings:

  - You are about to drop the `RoutineMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoutineMember" DROP CONSTRAINT "RoutineMember_routineId_fkey";

-- DropForeignKey
ALTER TABLE "RoutineMember" DROP CONSTRAINT "RoutineMember_userId_fkey";

-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "cursor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "RoutineMember";

-- CreateIndex
CREATE INDEX "Routine_creatorId_idx" ON "Routine"("creatorId");
