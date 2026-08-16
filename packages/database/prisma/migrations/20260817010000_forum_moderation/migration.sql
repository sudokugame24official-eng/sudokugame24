-- P1-L: forum moderation + SEO slugs
ALTER TABLE "ForumPost" ADD COLUMN "slug" TEXT;
ALTER TABLE "ForumPost" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ForumPost" ADD COLUMN "isClosed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ForumPost" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ForumPost" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ForumPost" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;
-- Backfill unique slugs for existing rows (id-based, collision-free), then enforce uniqueness
UPDATE "ForumPost" SET "slug" = 'topic-' || substr("id", 1, 12) WHERE "slug" IS NULL;
CREATE UNIQUE INDEX "ForumPost_slug_key" ON "ForumPost"("slug");
ALTER TABLE "ForumPost" ALTER COLUMN "slug" SET NOT NULL;
CREATE INDEX "ForumPost_isDeleted_idx" ON "ForumPost"("isDeleted");
