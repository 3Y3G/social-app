/*
  Warnings:

  - A unique constraint covering the columns `[userId,friendId]` on the table `Friendship` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" TEXT DEFAULT 'en',
ADD COLUMN     "messagePermissions" TEXT DEFAULT 'friends',
ADD COLUMN     "profileVisibility" TEXT DEFAULT 'public',
ADD COLUMN     "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showReadReceipts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT DEFAULT 'light';

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userId_friendId_key" ON "Friendship"("userId", "friendId");
