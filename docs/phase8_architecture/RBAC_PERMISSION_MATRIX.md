# RBAC PERMISSION & ROLE HIERARCHY MATRIX

## 1. Roles Definition
The platform defines 9 system roles:
- `GUEST`: Unauthenticated visitor (can browse SEO pages, play casual games, view public leaderboard and Academy).
- `MEMBER`: Registered authenticated player (can play ranked games, solve Daily Challenges, post in forums, ask Q&A, chat).
- `PREMIUM_MEMBER`: Subscriber / VIP (access to premium cosmetics, ad-free experience, priority duels).
- `SUPPORT_AGENT`: Staff assisting with tickets and user inquiries.
- `MODERATOR`: Community manager with post moderation, report handling, and user mute capabilities.
- `ANALYST`: Business operator with read-only access to analytics, metrics, and leaderboards.
- `CONTENT_MANAGER`: Editor managing Academy lessons, blog articles, media assets, and homepage copy.
- `ADMIN`: Platform administrator managing store products, game modes, theme, SEO, and user permissions.
- `SUPER_ADMIN`: Root platform owner with full system configuration, emergency maintenance, and secret management access.

## 2. Granular Permissions Map

| Permission Key | Description | Roles Possessing Permission |
|---|---|---|
| `users.view` | View user list & profiles | SUPPORT_AGENT, MODERATOR, ADMIN, SUPER_ADMIN |
| `users.ban` | Ban/unban users | MODERATOR, ADMIN, SUPER_ADMIN |
| `users.grant_coins` | Adjust user coin balance | ADMIN, SUPER_ADMIN |
| `moderation.reports` | Review flagged content | MODERATOR, ADMIN, SUPER_ADMIN |
| `moderation.delete` | Delete forum posts/comments | MODERATOR, ADMIN, SUPER_ADMIN |
| `cms.view` | View drafts and revisions | CONTENT_MANAGER, ADMIN, SUPER_ADMIN |
| `cms.edit` | Create and edit content | CONTENT_MANAGER, ADMIN, SUPER_ADMIN |
| `cms.publish` | Publish content live | CONTENT_MANAGER, ADMIN, SUPER_ADMIN |
| `shop.view` | View shop catalog | ANALYST, ADMIN, SUPER_ADMIN |
| `shop.edit` | Create & modify shop products | ADMIN, SUPER_ADMIN |
| `analytics.view` | View dashboards & insights | ANALYST, ADMIN, SUPER_ADMIN |
| `theme.edit` | Edit brand & theme variables | ADMIN, SUPER_ADMIN |
| `theme.publish` | Publish theme & rollback | ADMIN, SUPER_ADMIN |
| `system.maintenance` | Trigger emergency maintenance | SUPER_ADMIN |
