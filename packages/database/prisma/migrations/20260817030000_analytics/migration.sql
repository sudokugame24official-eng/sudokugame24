-- P1-V: analytics engine
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "locale" TEXT,
    "country" TEXT,
    "device" TEXT,
    "page" TEXT,
    "referrer" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

CREATE TABLE "AnalyticsDaily" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "dimension" TEXT,
    "value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AnalyticsDaily_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AnalyticsDaily_day_metric_dimension_key" ON "AnalyticsDaily"("day", "metric", "dimension");
CREATE INDEX "AnalyticsDaily_metric_day_idx" ON "AnalyticsDaily"("metric", "day");
