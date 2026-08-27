# Phase 0 — Safety Foundation (test locks + toggleable matchMedia)

**Goal:** make the test harness able to exercise mobile-width behavior and lock the current behavior of the primitives/overlays we're about to change. All tests in this phase FAIL before the corresponding Phase 1–8 change and are the red→green proof.

**Status:** ✅ complete (2026-08-28) — T0.1–T0.7 written, gates run green (99 files / 432 tests + lint + build + smoke 9/9). Per-phase P2 lock tests deferred as an optional follow-up (documented below, not part of Phase 0).

## Tasks

- [x] **T0.1 — Toggleable matchMedia** in `frontend/src/test/setup.ts`
  - Current stub always returns `matches: false` (desktop). Add a controllable helper, e.g. export a `setMatchMedia(width)`/mock-object that flips `(max-width: 767px)` matches. Keep desktop as the default so all existing 89 test files still behave as today.
  - Why: `useIsMobile` (768px) drives the mobile Sheet sidebar and any `isMobile` branch — without this, mobile-layout code is unobservable by tests.

- [x] **T0.2 — P1 lock: `ui/table` contract** → new `frontend/src/components/ui/__tests__/table.test.tsx`
  - Render `<Table>`; assert `data-slot="table-container"` wrapper has `overflow-x-auto`; the inner `table` keeps its width; `role=table/row/columnheader` present on a `<TableHeader><TableRow><TableHead>`.
  - Locks: the entire Phase 3 (un-clip) + Phase 5 (toolbar) table work.

- [x] **T0.3 — P1 lock: `ui/dialog` + `ui/sheet`** → new `frontend/src/components/ui/__tests__/dialog.test.tsx`
  - Open on trigger; close on `Esc`; close on overlay/backdrop click; focus returns to trigger after close.
  - Locks: Phase 1 dialog changes, Phase 8 overlay migrations, and the mobile Sidebar/Sheet from Phase 2.

- [x] **T0.4 — P1 lock: `ui/tabs` + `ui/select`** → new `frontend/src/components/ui/__tests__/tabs.test.tsx`, `select.test.tsx`
  - Tabs: arrow-key navigation, `role=tablist/tab/tabpanel`. Select: `role=combobox` opens options, selection fires `onValueChange`.
  - Protects the `getByRole('combobox')/('option')` assertions in AuditLogs/Reports/OversightPagination.

- [x] **T0.5 — P1 lock: shared `Pagination.tsx`** → new `frontend/src/components/Pagination.test.tsx`
  - `compact` mode renders its `flex-col … sm:flex-row` classes; ellipsis windowing; disabled prev/next; page-number callbacks.

- [x] **T0.6 — P1 lock: overlay prop contracts** → new tests for
  - `components/modals/UploadModal` (isOpen/onUpload/contextContent/submitLabel + `Confirm Upload`; does NOT close on backdrop pointer-down; Esc closes; max-files/oversize).
  - `components/ConfirmationModal` (confirm awaits `onConfirm` THEN closes — catches the AlertDialog auto-close regression; destructive; hideCancel; Esc).
  - `components/modals/FilePreviewModal` (Esc; close on backdrop; onDownload; unsupported preview).
  - `components/ActionMenu` (open/close, item click, hidden items, Esc).
  - `hooks/useConfirmationModal` (openModal sets props; closeModal clears; handleConfirm fires onConfirm).
  - Locks the props the 6 mock-double tests depend on (AccountingUploadModal, AccountingImpExpPage, ProcessorUploadModal, DocumentDetailPane, TrackingDetails, TransactionDetailDrawer).

- [x] **T0.7 — P1 lock: MainLayout mobile shell** (extend `frontend/src/components/layout/MainLayout.test.tsx`)
  - Use T0.1 to set mobile width; header trigger opens a Sheet whose nav renders grouped items; backdrop + Esc close; module switcher + brand still reachable in the Sheet; `data-active` highlighting still present.
  - Proves the current desktop-only stub isn't hiding regressions.

**Deferred follow-up (optional, NOT part of Phase 0):** the per-phase P2 lock tests below were scoped but not written — they're documented here so they can be added later. The P1 locks above (T0.2–T0.7) cover primitives/overlays/shell, and the existing feature suites already cover the changed pages.

- Phase 3: `TransactionListPage.test.tsx` (new — wrapper `overflow-x-auto`, header+row grids share the SAME inline min-width) + extend `VesselGroupedLists.test.tsx` (inner scroll container not `overflow-hidden`; `lg:min-w-[1080px]`), `TrackingDashboard.test.tsx` (first th `max-md:sticky`; table-container `overflow-x-auto`).
- Phase 4: `AdminDocumentReview` responsive (queue pane stacked on mobile, still loads detail), `LegacyFolderBrowserPanel` (tree `hidden … lg:flex`, toggle `lg:hidden`, `min-w-[42rem]` table), `ArchivesViews` (scroll wrapper testid + `min-w`), `ArchivesFolderView` (root/cluster `flex-wrap`; `md:hidden` pct+status summary).
- Phase 6: KPI grid stacking (`grid-cols-1 sm:grid-cols-2`); bar-chart wrapper `overflow-x-auto` + inner `min-w-[520px] sm:min-w-0`.
- Phase 5: AuditLogs date-range popover; TrackingDashboard tab click content mount + attention badge gating; VesselListToolbar Grouped/Flat + Encode handlers.
- Phase 7: `LandingPage.test.tsx` (hamburger opens menu with Sign In (guest) / Open App (authed)); `AuthPage.test.tsx` (wrapper `overflow-y-auto`, card `min-h-0`); `LoginForm` turnstile render-once (`toHaveBeenCalledTimes(1)`).

## Gates

- [x] Run `cd frontend && pnpm test` → lock tests written; class-locks were red before Phase 1/2 applied and flipped green after (verified 2026-08-28).
- [x] After Phase 1–8 changes land, re-run these to prove green → full suite **99 files / 432 tests green** (2026-08-28), plus `pnpm lint` + `pnpm build` + `pnpm smoke` (9/9).