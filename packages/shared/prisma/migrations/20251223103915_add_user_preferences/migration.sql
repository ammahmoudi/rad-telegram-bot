-- CreateTable
CREATE TABLE "UserPreferences" (
    "telegramUserId" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL DEFAULT 'fa',
    "updatedAt" BIGINT NOT NULL
);
