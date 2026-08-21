# ANALYTICS ARCHITECTURE & EVENT PIPELINE

## 1. Overview
The platform includes an in-house, privacy-focused, real-time event analytics engine. It collects business and gameplay events without third-party tracking cookies or personal data leakage.

## 2. Event Collection Pipeline
- **Endpoint:** `POST /analytics/track` (Public, fire-and-forget, rate-limited).
- **Validation:** Strict whitelist of 24 event types (`page_view`, `registration`, `login`, `game_start`, `game_complete`, `daily_start`, `daily_complete`, `duel_start`, `duel_complete`, `forum_post`, `purchase`, etc.).
- **Privacy Protections:** IP addresses and sensitive query parameters are stripped; client props are truncated; `userId` is never accepted from untrusted public request bodies (derived strictly from authenticated server sessions).

## 3. Storage & Aggregation
- **Raw Events (`AnalyticsEvent`):** High-throughput insertion with indexes on `(eventType, createdAt)` and `(createdAt)`.
- **Daily Rollups (`AnalyticsDaily`):** Automated SQL `groupBy` and distinct user aggregations run nightly at 03:00 UTC (and on-demand). Computes DAU, WAU, MAU, totals, and averages.
- **Reporting:** Dashboards read aggregated daily rollups with zero-filling. Raw events are never scanned across yearly ranges, guaranteeing instant sub-50ms dashboard response times.

## 4. Plain-Language Insights Engine
- Generates natural language summaries based strictly on mathematical differentials between trailing 7-day and prior 7-day periods (e.g. *"Game completions increased 8% compared with last week"*).
- Fails silent (omits output) when sample sizes are below statistical thresholds (<20 events) or changes are statistically negligible (<3%).
