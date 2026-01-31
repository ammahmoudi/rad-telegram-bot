-- CreateTable
CREATE TABLE "LlmCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramUserId" TEXT NOT NULL,
    "sessionId" TEXT,
    "messageId" TEXT,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "reasoningTokens" INTEGER NOT NULL DEFAULT 0,
    "audioTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL,
    "upstreamCost" REAL,
    "finishReason" TEXT,
    "hasToolCalls" BOOLEAN NOT NULL DEFAULT false,
    "toolCallCount" INTEGER NOT NULL DEFAULT 0,
    "requestDurationMs" INTEGER,
    "createdAt" BIGINT NOT NULL
);

-- CreateIndex
CREATE INDEX "LlmCall_telegramUserId_idx" ON "LlmCall"("telegramUserId");

-- CreateIndex
CREATE INDEX "LlmCall_sessionId_idx" ON "LlmCall"("sessionId");

-- CreateIndex
CREATE INDEX "LlmCall_model_idx" ON "LlmCall"("model");

-- CreateIndex
CREATE INDEX "LlmCall_createdAt_idx" ON "LlmCall"("createdAt");

-- CreateIndex
CREATE INDEX "LlmCall_telegramUserId_createdAt_idx" ON "LlmCall"("telegramUserId", "createdAt");

-- CreateIndex
CREATE INDEX "LlmCall_sessionId_createdAt_idx" ON "LlmCall"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "LlmCall_model_createdAt_idx" ON "LlmCall"("model", "createdAt");
