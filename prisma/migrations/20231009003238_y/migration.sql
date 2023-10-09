/*
  Warnings:

  - A unique constraint covering the columns `[confluenceCommentId]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ConfluenceFiles_attachmentId_key";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "confluenceCommentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Comment_confluenceCommentId_key" ON "Comment"("confluenceCommentId");
