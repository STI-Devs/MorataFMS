# Phase 4 — Archives Structural Fixes

**Goal:** fix the two worst structural mobile breakages (legacy folder browser tree, admin review split) + the archives inline-grid clipping + folder-view wrapping.

**Status:** ✅ complete (2026-08-28) — A4.1–A4.5 + ArchiveFilesView + ArchiveTaskPage applied; archives+documents suites (27 files / 159 tests) + full gate green.
**Revert note (2026-08-28):** the A4.3 sticky Year/BL reference columns were **reverted** per user preference — the ArchivesViews grids scroll fully. The `max-md:overflow-x-auto` + `min-w` scroll wrappers remain. A post-refactor table audit found one remaining clip (**ArchiveTaskPage** record grid) which was also wrapped (`overflow-x-auto` + `min-w-[38rem]`) and verified.

## Tasks

- [x] **A4.1 — `archives/legacy-upload/LegacyFolderBrowserPanel.tsx`** (worst breakage: fixed `w-64` tree leaves ~110px for files)
  - Desktop tree: `w-64 shrink-0 overflow-y-auto …` → add `hidden … lg:flex` (stays in DOM, same `aria-label="Folder tree"`).
  - Add `isTreeOpen` state + shared `renderFolderTree()` renderer.
  - Mobile off-canvas tree: manual overlay + panel (NOT Radix Sheet — its z-50 collides with the hosting drawer): backdrop `fixed inset-0 z-[60] bg-black/40 lg:hidden` + panel `fixed inset-y-0 left-0 z-[70] w-[85vw] max-w-[20rem] flex-col overflow-y-auto border-r bg-surface-secondary shadow-2xl lg:hidden`.
  - Toolbar: insert `lg:hidden` toggle button (`size-8`, `aria-label="Open folder tree"`, FolderIcon) before the Breadcrumb; toolbar root → `flex flex-wrap items-center gap-2 … sm:gap-3`.
  - Table escape: contents container `flex-1 overflow-y-auto` → `overflow-auto`; table `w-full table-fixed border-collapse` → add `min-w-[42rem]`. Search input `w-48` → `w-full … sm:w-48`.
  - Selecting a folder in mobile tree: `setSelectedPath(path)` + `setIsTreeOpen(false)`.
- [x] **A4.2 — `documents/admin-review/AdminDocumentReview.tsx`** (28/46rem ≈ 1184px floor unusable)
  - Drop the base split: grid → `grid-cols-1 min-h-0 flex-1 xl:grid-cols-[minmax(26rem,0.9fr)_minmax(36rem,1.1fr)] xl:overflow-hidden` + `data-testid="admin-review-split-grid"`.
  - Shell: `absolute inset-0 flex flex-col overflow-hidden` → `flex flex-col xl:absolute xl:inset-0 xl:overflow-hidden` (page scrolls naturally below xl). Related z-10 wrapper + main: gate the `h-full`/`min-h-0` pieces behind `xl:`.
  - `AdminReviewQueuePane.tsx` root: `border-r` → `border-b … xl:border-b-0 xl:border-r` (keeps asserted tokens `h-full/min-h-0/overflow-hidden/xl:min-w-[26rem]/xl:max-w-[38rem]`).
  - Detail pane already has a BackToQueueButton — stacked mode needs no new back control.
- [x] **A4.3 — `archives/workspace/ArchivesViews.tsx`** (inline `gridTemplateColumns` clipped by browser card)
  - `ArchivesDocumentView`: wrap header + skeleton + rows in `max-md:overflow-x-auto` > inner `<div className="min-w-[43rem]">`; Year header cell + Year row cell get `max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-*` (opaque).
  - `ArchivesBLView` / `BLFolderRow`: same wrapper `min-w-[44rem]`; BL Number (index 1) sticky at `max-md:left-[36px]` (20px icon col + 16px gap).
- [x] **A4.4 — `archives/workspace/ArchiveWorkspace.tsx`** — NO CHANGE (documented)
  - Browser card stays `overflow-hidden` + `openMenuKey ? overflow-visible : overflow-hidden` toggle (FolderRowMenu dropdowns depend on it). Once A4.3 adds inner scroll wrappers INSIDE the card, it rounds edges cleanly.
- [x] **A4.5 — `archives/workspace/ArchivesFolderView.tsx`**
  - YearRow outer: add `flex-wrap` + `gap-y-2` + `px-4 sm:px-5`.
  - YearRow right cluster: `ml-auto flex items-center gap-4` → `ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1`.
  - SubFolderRow meta line: add `md:hidden` pct+status summary (dot `size-1.5` colored by `folderPct >= 90/50`, `Needs documents` label, pct) BEFORE the existing counts — restores the completeness signal phones lose (progress bar `md:flex`, badge `md:inline-flex` are hidden below md).
  - SubFolderRow outer: `flex items-center gap-3` → `flex flex-wrap items-center gap-3` (⋯ menu wraps).
  - `ArchiveFilesView` (sibling, inline `28px minmax(0,1fr) minmax(180px,260px) 92px`): same `max-md:overflow-x-auto` + min-w treatment.

## Test locks turned green

- [ ] T0.8 archives locks: LegacyFolderBrowserPanel (tree hidden/lg:flex, toggle lg:hidden, min-w-[42rem]); AdminDocumentReview (split-grid testid `grid-cols-1` + `xl:grid-cols-[…]`; queue pane `xl:border-r`); ArchivesViews (scroll wrapper + min-w + sticky Year/BL); ArchivesFolderView (flex-wrap + md:hidden summary).
- [ ] Existing: `AdminDocumentReview.test.tsx` class-token lines 286–305 stay green (don't reword `overflow-hidden`/`max-w-none`/`xl:min-w-[26rem]`).

## Risk notes

- Never use Radix Sheet for the nested mobile tree (z-50 == hosting drawer → nondeterministic); manual `z-[60]/z-[70]` is deterministic.
- Desktop tree must stay in the DOM (display:none below lg) so `getByLabelText('Folder tree')` isn't ambiguous (mobile sheet unmounted unless open).
- Sticky ref columns need opaque backgrounds; below md the sticky-top page header sticks within its own scrollport (acceptable, desktop unaffected via `max-md:` gating).
- A4.2 xl floor 26+36rem = 992px may squeeze ~0–10px at 1280 vs 16rem sidebar → verify; if clipping, move split to 2xl.

## Gate

- [ ] `cd frontend && pnpm test` scoped to archives + documents suites, then full suite; `pnpm lint`; `pnpm build`.
- [ ] Manual 375px: batch drawer tree toggle opens sheet above drawer; admin review stacks queue→detail with Back; Records archive Document/BL views scroll with pinned Year/BL; FY rows wrap with md:hidden summary. ≥1024px: everything renders as today.