-- CreateTable
CREATE TABLE "confluenceCredentials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "googleId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "expiryDate" BIGINT NOT NULL,
    "webhookChannelId" TEXT,
    "webhookChannelExpiration" DATETIME,
    "webhookResourceId" TEXT,
    "changesPageToken" TEXT,
    "handle" TEXT,
    "dbCreatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dbUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "confluenceCredentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "confluenceCredentials_userId_key" ON "confluenceCredentials"("userId");
