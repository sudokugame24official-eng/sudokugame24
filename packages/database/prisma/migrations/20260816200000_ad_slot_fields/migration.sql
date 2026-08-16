-- P1-F/G: extended AdSlotConfig for DB-driven ad management
ALTER TABLE "AdSlotConfig" ADD COLUMN "placement" TEXT;
ALTER TABLE "AdSlotConfig" ADD COLUMN "format" TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE "AdSlotConfig" ADD COLUMN "width" INTEGER;
ALTER TABLE "AdSlotConfig" ADD COLUMN "height" INTEGER;
ALTER TABLE "AdSlotConfig" ADD COLUMN "lazyLoad" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdSlotConfig" ADD COLUMN "consentRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdSlotConfig" ADD COLUMN "frequencyCap" INTEGER;
ALTER TABLE "AdSlotConfig" ADD COLUMN "experimentGroup" TEXT;
ALTER TABLE "AdSlotConfig" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdSlotConfig" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
