

## Codely Structured Memories

### User

### Feedback
- [2026-07-21 18:51:09] User confirmed: when auto-hide UI is active and user single-taps the video, show UI only (no play/pause toggle). Mirrors real social apps like Instagram/TikTok. Play/pause via visible button only.

### Project
- [2026-07-21 18:51:09] Social Review Studio completed (2026-07-21). Sprint "SOCIAL PREVIEW POLISH" delivered 16 UX features: premium phone frame, auto-hide UI, swipe nav, double-tap heart, hold-to-speed, status bar, animated captions, music marquee, translucent safe zones, screenshot mode, presentation mode, micro animations, loading skeletons, empty state illustrations. All UI-only — no backend changes. All checks pass (tsc, eslint, build, 677 tests).
- [2026-07-23 20:43:59] Public Client Portal completed (2026-07-23). Built premium mobile-first portal at /p/[token] replacing basic PublicGallery. Home page with project info/progress/timeline + project viewer with phone frame (IG/TikTok/Shorts/FB switcher, safe zones, comments bottom sheet, approve/revision flows). 14 new files, 1 modified. All checks pass (tsc, eslint, build, 677 tests).
- [2026-07-23 21:16:59] V1 Production Polish sprint completed (2026-07-23). Delivered: Share Client Portal dialog (URL/copy/token-regen/password/expiry/toggles), QR code (download PNG + print), WhatsApp share (Arabic template), Email share (branded HTML email with preview), Brand Settings (JSON file store, no DB changes), Project Analytics (7 metrics + 7-day chart), Activity Feed (replaced stub with real data), Version History (derived from video createdAt), Version Compare (side-by-side synced playback), Watermark Settings (opacity/position/scale/animation + live preview), Empty illustrations (7 SVGs), Branded error pages (404/error/global-error), Unified settings page (5 tabs: Brand/Portal/Delivery/Review/Watermark). 23 new files, 7 modified. All checks pass (tsc, eslint, build, 677 tests).
- [2026-07-23 21:32:29] Production audit (2026-07-23): Identified root cause of Vercel "An error occurred in the Server Components render" — root layout (src/app/layout.tsx) calls getCurrentUser() which calls supabase.auth.getUser() with no try/catch. If Supabase env vars missing/unreachable, every page crashes. Proxy (src/proxy.ts) has same issue. Also found: R2 credentials fallback to empty strings (storage/config.ts), Prisma client created at module load (prisma/client.ts), site-settings.ts uses fs on Vercel read-only FS (writeFile/mkdir caught but non-persistent), get-public-file-url.ts uses fake UUID violating FK constraint, CSP connect-src 'self' may block client-side Supabase calls.

### Reference

