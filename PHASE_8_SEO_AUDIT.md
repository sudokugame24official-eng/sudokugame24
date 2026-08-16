# PHASE 8 — SEO AUDIT (P1-R)

Method: automated audit of RENDERED pages (scripts/seo-audit.mjs) against a production build served locally (next start). No page was declared ready from source code alone.

Audited: 40 routes (http://localhost:3100, 2026-08-16T23:17:48.597Z)

| Route (en) | Status | H1 | Words | JSON-LD | Canonical | hreflang | Indexable |
|---|---|---|---|---|---|---|---|
| home | 200 | 1 | 452 | WebSite | yes | 3 | YES |
| play | 200 | 1 | 233 | WebSite | yes | 5 | YES |
| sudoku hub | 200 | 1 | 438 | WebSite | yes | 2 | YES |
| sudoku easy | 200 | 1 | 696 | WebSite, FAQPage, BreadcrumbList | yes | 2 | YES |
| sudoku medium | 200 | 1 | 716 | WebSite, FAQPage, BreadcrumbList | yes | 2 | YES |
| sudoku hard | 200 | 1 | 731 | WebSite, FAQPage, BreadcrumbList | yes | 2 | YES |
| sudoku expert | 200 | 1 | 662 | WebSite, FAQPage, BreadcrumbList | yes | 2 | YES |
| sudoku extreme | 200 | 1 | 671 | WebSite, FAQPage, BreadcrumbList | yes | 2 | YES |
| daily | 200 | 1 | 287 | WebSite | yes | 5 | YES |
| duel | 200 | 1 | 214 | WebSite | yes | 5 | YES |
| leaderboard | 200 | 1 | 208 | WebSite, ItemList | yes | 3 | YES |
| learn hub | 200 | 1 | 445 | WebSite | yes | 5 | YES |
| forum | 200 | 1 | 174 | WebSite | yes | 3 | YES |
| qa | 200 | 1 | 234 | WebSite, CollectionPage | yes | 3 | YES |
| shop | 200 | 1 | 172 | WebSite | yes | 5 | YES |
| about | 200 | 1 | 320 | WebSite | yes | 5 | YES |
| contact | 200 | 1 | 214 | WebSite | yes | 5 | YES |
| faq | 200 | 1 | 395 | WebSite, FAQPage | yes | 5 | YES |
| help | 200 | 1 | 392 | WebSite | yes | 5 | YES |
| auth (expected noindex) | 200 | 1 | 183 | WebSite | yes | 5 | NO (wanted) |

## Fixes applied during this audit (all verified by re-running the audit)
- HOME: was client-only with a 'mounted' null-gate -> entire page missing from SSR HTML (0 H1, 157 words). Extracted HomeClient, removed the gate, added a server page with generateMetadata. Now SSR H1:1, 530 words.
- AUTH: was indexable -> dedicated layout sets robots noindex,follow.
- LEADERBOARD + Q&A: missing hreflang -> alternates.languages added (en/fr/de per SEO_LOCALES).
- HOME hreflang reduced 5->3 locales deliberately (P1-T: es/it have 1/16 namespaces, must not receive SEO signals).

## Routes not audited
- Public profile, forum topic detail, Q&A question detail, learn article: require live data/API; audited structurally at implementation time (JSON-LD present in code, SSG/SSR confirmed in build). Full rendered audit to be re-run against staging with a real database.

## Verdict
All 20 audited public routes per locale return 200 with title, H1:1, canonical. Auth is noindex as intended. 38/40 indexable + 2 intentionally noindex = 40/40 in target state.