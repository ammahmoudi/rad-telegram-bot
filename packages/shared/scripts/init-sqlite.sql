-- Initialize SQLite database with required tables
-- This is used for local development when DATABASE_URL points to a SQLite file

CREATE TABLE IF NOT EXISTS "LinkState" (
    "state" TEXT NOT NULL PRIMARY KEY,
    "telegramUserId" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "LinkState_expiresAt_idx" ON "LinkState"("expiresAt");

CREATE TABLE IF NOT EXISTS "PlankaToken" (
    "telegramUserId" TEXT NOT NULL PRIMARY KEY,
    "plankaBaseUrl" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "updatedAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "RastarToken" (
    "telegramUserId" TEXT NOT NULL PRIMARY KEY,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "updatedAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "SystemConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "UserPreferences" (
    "telegramUserId" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL DEFAULT 'fa',
    "updatedAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramUserId" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "ChatSession_telegramUserId_idx" ON "ChatSession"("telegramUserId");
CREATE INDEX IF NOT EXISTS "ChatSession_updatedAt_idx" ON "ChatSession"("updatedAt");

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCallId" TEXT,
    "toolName" TEXT,
    "toolArgs" TEXT,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Message_sessionId_idx" ON "Message"("sessionId");
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");
