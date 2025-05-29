-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "groupDescription" TEXT,
ADD COLUMN     "groupImage" TEXT,
ADD COLUMN     "groupName" TEXT,
ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false;
