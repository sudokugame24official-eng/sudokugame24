# SEO ARCHITECTURE & SEARCH VISIBILITY STRATEGY

## 1. Overview & SEO Philosophy
The platform employs a **Server-Side Rendered (SSR)** and **Static Site Generation (SSG)** first architecture to ensure optimal search engine crawling, indexation, and ranking across Google and Bing.

## 2. Core SEO Pillars
1. **Programmatic Difficulty Hubs:** Dedicated landing pages for 5 difficulty tiers (`/sudoku/easy`, `/sudoku/medium`, `/sudoku/hard`, `/sudoku/expert`, `/sudoku/extreme`) with unique, substantial, localized content (500+ words per page) covering rules, strategies, FAQs, and step-by-step guides.
2. **Dynamic XML Sitemap:** Automatically generated at `/sitemap.xml` referencing indexable routes and localized alternates (en, fr, de).
3. **Structured Data (JSON-LD):**
   - `WebSite` & `Organization` on root layout
   - `FAQPage` & `BreadcrumbList` on Sudoku landing pages
   - `QAPage` on Q&A discussions
   - `DiscussionForumPosting` on Community Forum threads
4. **Contextual Semantic Mesh (`lib/related-links.ts`):** Automatically detects technique mentions (X-Wing, Swordfish, Naked Pairs, etc.) in UGC and creates internal links to Academy lessons, difficulty pages, and duels without keyword stuffing.
5. **Locale Gating (P1-T):** `SEO_LOCALES` (en, fr, de) receive full metadata, canonicals, and hreflang tags, while incomplete language namespaces are prevented from generating duplicate/thin content penalties.
6. **SSR Header & Title Hierarchy:** Strict single `<h1>` tag per page, valid `<meta name="description">`, OpenGraph social cards, and canonical tags.
