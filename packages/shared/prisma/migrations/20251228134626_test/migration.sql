-- CreateTable
CREATE TABLE "LinkState" (
    "state" TEXT NOT NULL PRIMARY KEY,
    "telegramUserId" TEXT NOT NULL,
    "expiresAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "PlankaToken" (
    "telegramUserId" TEXT NOT NULL PRIMARY KEY,
    "plankaBaseUrl" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "updatedAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "RastarToken" (
    "telegramUserId" TEXT NOT NULL PRIMARY KEY,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "expiresAt" BIGINT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "updatedAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "SystemMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterPack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "PackMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    CONSTRAINT "PackMessage_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CharacterPack" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPackAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramUserId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "assignedAt" BIGINT NOT NULL,
    "assignedBy" TEXT,
    CONSTRAINT "UserPackAssignment_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CharacterPack" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "photoUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "lastSeenAt" BIGINT,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "telegramUserId" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL DEFAULT 'fa',
    "updatedAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramUserId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCallId" TEXT,
    "toolName" TEXT,
    "toolArgs" TEXT,
    "createdAt" BIGINT NOT NULL,
    CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LinkState_expiresAt_idx" ON "LinkState"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE INDEX "SystemMessage_messageType_isActive_idx" ON "SystemMessage"("messageType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SystemMessage_language_messageType_key" ON "SystemMessage"("language", "messageType");

-- CreateIndex
CREATE INDEX "CharacterPack_isDefault_idx" ON "CharacterPack"("isDefault");

-- CreateIndex
CREATE INDEX "PackMessage_packId_messageType_idx" ON "PackMessage"("packId", "messageType");

-- CreateIndex
CREATE UNIQUE INDEX "PackMessage_packId_language_messageType_key" ON "PackMessage"("packId", "language", "messageType");

-- CreateIndex
CREATE INDEX "UserPackAssignment_packId_idx" ON "UserPackAssignment"("packId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPackAssignment_telegramUserId_key" ON "UserPackAssignment"("telegramUserId");

-- CreateIndex
CREATE INDEX "TelegramUser_role_idx" ON "TelegramUser"("role");

-- CreateIndex
CREATE INDEX "ChatSession_telegramUserId_idx" ON "ChatSession"("telegramUserId");

-- CreateIndex
CREATE INDEX "ChatSession_updatedAt_idx" ON "ChatSession"("updatedAt");

-- CreateIndex
CREATE INDEX "Message_sessionId_idx" ON "Message"("sessionId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
