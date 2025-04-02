/*
  Warnings:

  - You are about to drop the column `content` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Story` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Story` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Story" DROP COLUMN "content",
DROP COLUMN "expiresAt",
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Story_authorId_idx" ON "Story"("authorId");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");
