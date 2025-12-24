-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."ChatSession" (
    "id" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LinkState" (
    "state" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "expiresAt" BIGINT NOT NULL,

    CONSTRAINT "LinkState_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCallId" TEXT,
    "toolName" TEXT,
    "toolArgs" TEXT,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlankaToken" (
    "telegramUserId" TEXT NOT NULL,
    "plankaBaseUrl" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "updatedAt" BIGINT NOT NULL,

    CONSTRAINT "PlankaToken_pkey" PRIMARY KEY ("telegramUserId")
);

-- CreateTable
CREATE TABLE "public"."RastarToken" (
    "telegramUserId" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "expiresAt" BIGINT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "updatedAt" BIGINT NOT NULL,

    CONSTRAINT "RastarToken_pkey" PRIMARY KEY ("telegramUserId")
);

-- CreateTable
CREATE TABLE "public"."SystemConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."UserPreferences" (
    "telegramUserId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fa',
    "updatedAt" BIGINT NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("telegramUserId")
);

-- CreateIndex
CREATE INDEX "ChatSession_telegramUserId_idx" ON "public"."ChatSession"("telegramUserId" ASC);

-- CreateIndex
CREATE INDEX "ChatSession_updatedAt_idx" ON "public"."ChatSession"("updatedAt" ASC);

-- CreateIndex
CREATE INDEX "LinkState_expiresAt_idx" ON "public"."LinkState"("expiresAt" ASC);

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "public"."Message"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Message_sessionId_idx" ON "public"."Message"("sessionId" ASC);

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

