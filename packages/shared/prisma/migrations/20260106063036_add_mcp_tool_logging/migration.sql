-- CreateTable
CREATE TABLE "McpToolLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramUserId" TEXT NOT NULL,
    "mcpServer" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "inputArgs" TEXT NOT NULL,
    "outputContent" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "executionTimeMs" INTEGER,
    "createdAt" BIGINT NOT NULL
);

-- CreateIndex
CREATE INDEX "McpToolLog_telegramUserId_idx" ON "McpToolLog"("telegramUserId");

-- CreateIndex
CREATE INDEX "McpToolLog_mcpServer_idx" ON "McpToolLog"("mcpServer");

-- CreateIndex
CREATE INDEX "McpToolLog_toolName_idx" ON "McpToolLog"("toolName");

-- CreateIndex
CREATE INDEX "McpToolLog_createdAt_idx" ON "McpToolLog"("createdAt");
