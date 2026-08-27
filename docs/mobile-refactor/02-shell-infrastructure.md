# Phase 2 — Shell Infrastructure

**Goal:** the app-shell foundation every page sits in: a content-width container-query anchor, the root overflow fix (min-w-0), header gutter alignment, and a visible close button on the mobile sidebar Sheet.

**Status:** ✅ complete (2026-08-28) — edits applied, mobile-shell lock tests green (Sheet open + Close + nav reachable), full gate green.

## Tasks

- [x] **S2.1 — `@container/content` on main** → `frontend/src/components/layout/MainLayout.tsx` (~line 56)
  - Append `@container/content` to main's className:
    `relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-background px-4 py-4 sm:px-6 sm:py-5 @container/content`
  - Enables `@sm/content..@7xl/content` tiers for all pages (Tailwind v4 default `--container-*` scale already registered — no theme.css change).

- [x] **S2.2 — `min-w-0` on the inner flex wrapper** → `MainLayout.tsx` (~line 58)
  - `<div className="flex min-h-0 w-full flex-1 flex-col">` → add `min-w-0`.
  - **The root overflow fix**: a wide child (inline grids, fixed-min-width tables) forces this column wider than main; `min-w-0` lets it shrink so inner `overflow-x-auto` containers become the real horizontal scrollport.

- [x] **S2.3 — Header gutter alignment** → `MainLayout.tsx` (~line 48)
  - `flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4` → add `sm:px-6`.

- [x] **S2.4 — Reveal mobile Sheet close X** → `frontend/src/components/ui/sidebar.tsx` (~line 187, mobile SheetContent className)
  - Remove `[&>button]:hidden` from `w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden`.
  - All AppSidebar nav buttons are wrapped inside a `<div>` so they're not direct children — safe. 18rem width stays.

- [x] **S2.5 — (keep as-is, documented)** 
  - `html { @apply overflow-x-hidden }` stays (Radix-portal overflow guard; `main` keeps both overflow classes — MainLayout.test asserts them).
  - `hooks/use-mobile.ts` stays at 768 (aligned with Tailwind `md` + the 767px CSS guard).

## Test locks turned green

- [ ] MainLayout existing 13 tests (esp. "main content area as vertical scroll container").
- [ ] T0.7 mobile-shell tests: `@container/content` on `#main-content`, Sheet nav reachable on mobile, Close button present.

## Risk notes

- `@container/content` sets `contain: layout style inline-size` on main — anything that currently escapes main's clip gets contained; sticky/fixed elements are unaffected (main is already the y-scrollport).
- `min-w-0` changes intrinsic width for content that relied on min-width:auto to stretch — page-side overflow wrappers (Phase 3/4) are therefore REQUIRED for the wide inline grids.
- Mobile Sheet close: `data-[state=open]:bg-secondary` hover on the X is light-theme against dark mix sidebar — cosmetic only.

## Gate

- [ ] `cd frontend && pnpm test` (MainLayout + App + shell suites) + `pnpm lint` + `pnpm build`.
- [ ] Manual: ≥768 header/trigger align; <768 Sheet opens with visible X; `@container/content` provable (temporary `@7xl/content:text-2xl` tracks main width).