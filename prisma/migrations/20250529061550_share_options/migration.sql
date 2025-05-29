/*
  Warnings:

  - The `visibility` column on the `Post` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "visibility",
ADD COLUMN     "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC';
