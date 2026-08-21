# CMS & MEDIA ARCHITECTURE

## 1. Content Article Workflow
- **States:** `DRAFT` → `REVIEW` → `PUBLISHED` (plus `ARCHIVED`).
- **Access Control:** Public users can only read `PUBLISHED` articles. Authors and Editors can view `DRAFT` and `REVIEW` states through authenticated CMS endpoints.
- **Revision History:** Every save in `ContentService` creates an immutable `ArticleRevision` snapshot (recording editor ID, content, metadata, and sequential revision number). Rollback creates a new revision pointing to the historical snapshot.
- **Sanitization:** Content is sanitized against script injection and cross-site scripting vulnerabilities.

## 2. Media Library (`MediaService`)
- **Storage Strategy:** Dual-mode storage abstraction (`LocalStorageDriver` for local dev/testing; `S3StorageDriver` for production AWS S3 / Cloudflare R2).
- **Validation:** Strict MIME-type checking (images, webp, svg, png, jpeg), payload size caps (max 10MB), and SVG script-tag stripping.
- **Deduplication:** Assets are SHA-256 hashed upon ingestion to avoid storing redundant duplicate files.
