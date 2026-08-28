-- P1-I: CMS workflow fields + revision history
ALTER TABLE "ContentArticle" ADD COLUMN IF NOT EXISTS "ogTitle" TEXT;
ALTER TABLE "ContentArticle" ADD COLUMN IF NOT EXISTS "ogDescription" TEXT;
ALTER TABLE "ContentArticle" ADD COLUMN IF NOT EXISTS "schemaType" TEXT;
ALTER TABLE "ContentArticle" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
ALTER TABLE "ContentArticle" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);

-- Table "ContentRevision"
CREATE TABLE IF NOT EXISTS "ContentRevision" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "revisionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContentRevision_articleId_revisionNumber_key" ON "ContentRevision"("articleId", "revisionNumber");
CREATE INDEX IF NOT EXISTS "ContentRevision_articleId_idx" ON "ContentRevision"("articleId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ContentRevision_articleId_fkey'
    ) THEN
        ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "ContentArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
