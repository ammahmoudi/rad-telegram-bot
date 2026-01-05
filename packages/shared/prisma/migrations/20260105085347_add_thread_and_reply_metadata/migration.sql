-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN "threadId" BIGINT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "replyToMessageId" BIGINT;
ALTER TABLE "Message" ADD COLUMN "telegramMessageId" BIGINT;
ALTER TABLE "Message" ADD COLUMN "threadId" BIGINT;

-- CreateIndex
CREATE INDEX "ChatSession_telegramUserId_threadId_idx" ON "ChatSession"("telegramUserId", "threadId");

-- CreateIndex
CREATE INDEX "Message_sessionId_threadId_idx" ON "Message"("sessionId", "threadId");
