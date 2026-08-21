# MONETIZATION ARCHITECTURE (STRIPE & GOOGLE ADSENSE)

## 1. Stripe Payment Processing
- **Server-Authoritative:** Checkout sessions are created directly via the Stripe SDK on the backend (`POST /shop/checkout`).
- **Webhook Verification:** Webhook endpoints (`POST /stripe/webhook`) strictly require valid cryptographic signatures (`Stripe-Signature`). Client-side webhook forging is impossible.
- **Status Catch-up:** In the event of network delays, `GET /shop/purchase/status` provides a backup verification path directly querying Stripe's API for the authenticated user's session.
- **Fail-Closed:** Missing Stripe credentials prevent purchases cleanly without throwing unhandled exceptions or corrupting user balances.

## 2. Google AdSense & Rewarded Ads
- **Database-Driven Ad Slots:** Ad placements are managed via `AdSlotConfig` in the database, allowing the owner to enable, disable, resize, or reposition banners across Desktop, Tablet, and Mobile without redeploying code.
- **Daily Cap on Rewarded Ads:** Prevents ad-farming exploits by enforcing a daily cap (default 5 rewards per user per 24 hours).
- **Graceful Fallback:** When AdSense is unconfigured or blocked by user extensions, layout dimensions collapse gracefully without breaking the game board.
