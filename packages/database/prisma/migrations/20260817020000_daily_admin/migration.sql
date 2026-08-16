-- P1-O: daily challenge admin configurability
ALTER TABLE "DailyChallenge" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DailyChallenge" ADD COLUMN "announcement" TEXT;
