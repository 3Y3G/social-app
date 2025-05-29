CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'COMMENT', 'FRIEND_REQUEST', 'FRIEND_ACCEPT', 'NEW_MESSAGE', 'SHARE');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('POST', 'FRIEND_REQUEST', 'CONVERSATION');

/* ---------- step 1: add new polymorphic columns ---------- */
ALTER TABLE "Notification"
ADD COLUMN "targetId"  TEXT,
ADD COLUMN "targetType" "TargetType";

/* ---------- step 2: move existing IDs into the new fields ---------- */
UPDATE "Notification"
SET "targetId"   = "postId",
    "targetType" = 'POST'
WHERE "postId" IS NOT NULL;

UPDATE "Notification"
SET "targetId"   = "conversationId",
    "targetType" = 'CONVERSATION'
WHERE "conversationId" IS NOT NULL;

/* ---------- step 3: drop the old columns now that data is copied ---- */
ALTER TABLE "Notification"
DROP COLUMN "postId",
DROP COLUMN "conversationId";

/* ---------- step 4: convert `type` from text to enum safely ---------- */
ALTER TABLE "Notification"
ALTER COLUMN "type" TYPE "NotificationType"
USING "type"::text::"NotificationType";
