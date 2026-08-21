# ADMIN CAPABILITIES & OPERATOR MATRIX

| Capability Area | Route | Permitted Roles | Actions Supported | Safety Guardrails |
|---|---|---|---|---|
| **Dashboard** | `/admin` | All Staff | View real-time presence, game metrics, system health | Read-only |
| **Users** | `/admin/users` | ADMIN, SUPER_ADMIN | Search, filter, view details, ban, unban, grant/revoke coins | Mandatory ban reason, immutable audit log |
| **Moderation** | `/admin/moderation` | MODERATOR, ADMIN, SUPER_ADMIN | Review reports, resolve flags, mute users | Action logging |
| **Audit Logs** | `/admin/audit` | ADMIN, SUPER_ADMIN | Inspect admin action history and auth events | Append-only database tables |
| **Daily Challenge** | `/admin/daily` | CONTENT_MANAGER, ADMIN, SUPER_ADMIN | Schedule daily puzzles, set difficulty, publish | Published challenges locked once played |
| **Game Modes** | `/admin/modes` | ADMIN, SUPER_ADMIN | Enable/disable game modes, set descriptions | Disabled modes hidden from UI & API |
| **Articles (CMS)** | `/admin/content` | CONTENT_MANAGER, ADMIN, SUPER_ADMIN | Create, edit, draft, publish, view revision history | Safe HTML sanitization, version rollback |
| **Media Library** | `/admin/media` | CONTENT_MANAGER, ADMIN, SUPER_ADMIN | Upload assets, manage images, delete unused files | MIME sniffing, hash deduplication |
| **Shop & Economy** | `/admin/shop` | ADMIN, SUPER_ADMIN | Create products, set coin prices, configure stock | Server-enforced maxPerUser & active windows |
| **Monetization & Ads** | `/admin/monetization` | ADMIN, SUPER_ADMIN | Configure AdSense slots, reward caps, feature flags | Fail-closed ad renderer |
| **Analytics** | `/admin/analytics` | ANALYST, ADMIN, SUPER_ADMIN | Real-time presence, DAU/WAU/MAU, revenue charts | Read-only daily rollups |
| **Theme Studio** | `/admin/theme` | ADMIN, SUPER_ADMIN | Live color customization, CSS variables, logo URLs | Regex CSS sanitization, 1-click rollback |
| **Homepage Builder** | `/admin/homepage` | CONTENT_MANAGER, ADMIN, SUPER_ADMIN | Reorder sections, toggle visibility, edit CTAs | Plain-text sanitization, relative links only |
| **SEO Control** | `/admin/seo` | ADMIN, SUPER_ADMIN | SERP preview, meta descriptions, robots.txt, sitemaps | Character count validation |
