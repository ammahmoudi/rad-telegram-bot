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
