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

-- CreateIndex
CREATE INDEX "LinkState_expiresAt_idx" ON "LinkState"("expiresAt");
