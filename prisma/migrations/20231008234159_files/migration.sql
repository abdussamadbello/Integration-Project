-- CreateTable
CREATE TABLE "ConfluenceFiles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileId" INTEGER NOT NULL,
    "attachmentId" TEXT,
    "mediaType" TEXT,
    "title" TEXT,
    "url" TEXT,
    CONSTRAINT "ConfluenceFiles_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfluenceFiles_fileId_key" ON "ConfluenceFiles"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfluenceFiles_attachmentId_key" ON "ConfluenceFiles"("attachmentId");
