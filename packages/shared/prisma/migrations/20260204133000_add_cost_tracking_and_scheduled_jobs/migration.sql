-- CreateTable
CREATE TABLE "LlmCall" (
    "id" TEXT NOT NULL,
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
    "cost" DOUBLE PRECISION NOT NULL,
    "upstreamCost" DOUBLE PRECISION,
    "finishReason" TEXT,
    "hasToolCalls" BOOLEAN NOT NULL DEFAULT false,
    "toolCallCount" INTEGER NOT NULL DEFAULT 0,
    "requestDurationMs" INTEGER,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "LlmCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJob" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobKey" TEXT NOT NULL DEFAULT '',
    "jobType" TEXT NOT NULL DEFAULT 'coded',
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "schedule" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" TEXT,
    "lastRunAt" BIGINT,
    "nextRunAt" BIGINT,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,

    CONSTRAINT "ScheduledJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJobTargetUser" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "ScheduledJobTargetUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJobTargetPack" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'include',
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "ScheduledJobTargetPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" BIGINT NOT NULL,
    "completedAt" BIGINT,
    "durationMs" INTEGER,
    "result" TEXT,
    "error" TEXT,
    "usersAffected" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJob_name_key" ON "ScheduledJob"("name");

-- CreateIndex
CREATE INDEX "ScheduledJob_enabled_idx" ON "ScheduledJob"("enabled");

-- CreateIndex
CREATE INDEX "ScheduledJob_nextRunAt_idx" ON "ScheduledJob"("nextRunAt");

-- CreateIndex
CREATE INDEX "ScheduledJob_jobType_idx" ON "ScheduledJob"("jobType");

-- CreateIndex
CREATE INDEX "ScheduledJobTargetUser_jobId_mode_idx" ON "ScheduledJobTargetUser"("jobId", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJobTargetUser_jobId_telegramUserId_key" ON "ScheduledJobTargetUser"("jobId", "telegramUserId");

-- CreateIndex
CREATE INDEX "ScheduledJobTargetPack_jobId_mode_idx" ON "ScheduledJobTargetPack"("jobId", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJobTargetPack_jobId_packId_key" ON "ScheduledJobTargetPack"("jobId", "packId");

-- CreateIndex
CREATE INDEX "JobExecution_jobId_idx" ON "JobExecution"("jobId");

-- CreateIndex
CREATE INDEX "JobExecution_status_idx" ON "JobExecution"("status");

-- CreateIndex
CREATE INDEX "JobExecution_startedAt_idx" ON "JobExecution"("startedAt");

-- CreateIndex
CREATE INDEX "JobExecution_jobId_startedAt_idx" ON "JobExecution"("jobId", "startedAt");

-- AddForeignKey
ALTER TABLE "ScheduledJobTargetUser" ADD CONSTRAINT "ScheduledJobTargetUser_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScheduledJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledJobTargetPack" ADD CONSTRAINT "ScheduledJobTargetPack_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScheduledJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledJobTargetPack" ADD CONSTRAINT "ScheduledJobTargetPack_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CharacterPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobExecution" ADD CONSTRAINT "JobExecution_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScheduledJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
