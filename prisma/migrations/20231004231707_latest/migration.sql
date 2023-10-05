/*
  Warnings:

  - You are about to drop the column `googleId` on the `confluenceCredentials` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_confluenceCredentials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
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
INSERT INTO "new_confluenceCredentials" ("accessToken", "changesPageToken", "dbCreatedAt", "dbUpdatedAt", "expiryDate", "handle", "id", "refreshToken", "scope", "tokenType", "userId", "webhookChannelExpiration", "webhookChannelId", "webhookResourceId") SELECT "accessToken", "changesPageToken", "dbCreatedAt", "dbUpdatedAt", "expiryDate", "handle", "id", "refreshToken", "scope", "tokenType", "userId", "webhookChannelExpiration", "webhookChannelId", "webhookResourceId" FROM "confluenceCredentials";
DROP TABLE "confluenceCredentials";
ALTER TABLE "new_confluenceCredentials" RENAME TO "confluenceCredentials";
CREATE UNIQUE INDEX "confluenceCredentials_userId_key" ON "confluenceCredentials"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
