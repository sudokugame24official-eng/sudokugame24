-- P1-I: CMS workflow fields + revision history
ALTER TABLE "ContentArticle" ADD COLUMN "ogTitle" TEXT;
ALTER TABLE "ContentArticle" ADD COLUMN "ogDescription" TEXT;
ALTER TABLE "ContentArticle" ADD COLUMN "schemaType" TEXT;
ALTER TABLE "ContentArticle" ADD COLUMN "coverImage" TEXT;
ALTER TABLE "ContentArticle" ADD COLUMN "scheduledAt" TIMESTAMP(3);

-- Table "ContentRevision"
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "revisionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "ContentRevision_articleId_key" UNIQUE ("articleId", "revisionNumber");
CREATE INDEX "ContentRevision_articleId_idx" ON "ContentRevision"("articleId");
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "ContentArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
