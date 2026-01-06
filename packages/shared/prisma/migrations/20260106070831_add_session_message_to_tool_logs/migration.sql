-- AlterTable
ALTER TABLE "McpToolLog" ADD COLUMN "messageId" TEXT;
ALTER TABLE "McpToolLog" ADD COLUMN "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "McpToolLog_sessionId_idx" ON "McpToolLog"("sessionId");

-- CreateIndex
CREATE INDEX "McpToolLog_messageId_idx" ON "McpToolLog"("messageId");

-- CreateIndex
CREATE INDEX "McpToolLog_telegramUserId_createdAt_idx" ON "McpToolLog"("telegramUserId", "createdAt");

-- CreateIndex
CREATE INDEX "McpToolLog_sessionId_createdAt_idx" ON "McpToolLog"("sessionId", "createdAt");
