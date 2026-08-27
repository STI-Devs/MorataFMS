# Phase 1 — Shared Primitives

**Goal:** one-line class additions on shared primitives that cascade to the whole app (436 usages across 41 files) and are inert on desktop/short dialogs. Lock tests from Phase 0 (T0.3–T0.5) turn green here.

**Status:** ✅ complete (2026-08-28) — edits applied, lock tests green, full gate green.
**Revert note (2026-08-28):** the table.tsx sticky-column snippet in the doc-comment was **removed** — the team prefers full horizontal scroll with no pinned columns.

## Tasks

- [x] **P1.1 — Dialog height guard** → `frontend/src/components/ui/dialog.tsx` (~line 61, DialogContent className)
  - Insert `max-h-[calc(100svh-2rem)]` after `grid `; add `overflow-y-auto overscroll-contain` after `gap-4 `.
  - Catches tall forms (EncodeModal, EditTransactionModal, StatusOverrideModal, country/location/user modals) that currently clip on short screens. Inert when content fits.

- [x] **P1.2 — AlertDialog height guard** → `frontend/src/components/ui/alert-dialog.tsx` (~line 54, AlertDialogContent className)
  - Same edit as P1.1.

- [x] **P1.3 — TabsList overflow** → `frontend/src/components/ui/tabs.tsx` (~line 26)
  - Append `max-w-full overflow-x-auto no-scrollbar` to `inline-flex h-9 w-fit …`.
  - ⚠️ Base list is `w-fit` — call sites with many tabs (Phase 5 TrackingDashboard) MUST also set `max-w-full justify-start` or the overflow is a silent no-op.

- [x] **P1.4 — Pagination non-compact wrap** → `frontend/src/components/Pagination.tsx` (~lines 49–53)
  - Non-compact branch ONLY: `'mt-6 border-t border-border px-2 pt-6'` → `'mt-6 flex-col gap-3 border-t border-border px-2 pt-6 sm:flex-row sm:items-center sm:justify-between'`.
  - Compact branch stays byte-identical.

- [x] **P1.5 — `ui/table.tsx` convention + sticky snippet** (~line 4 doc-comment; no class change)
  - Add doc-comment: wrapper `overflow-x-auto` is the mechanism; set a floor via `min-w-lg/xl` on wide `<Table>`s; document the sticky-first-column snippet:
    `sticky start-0 z-10 bg-background shadow-[8px_0_8px_-12px_rgba(0,0,0,0.45)]`.

- [x] **P1.6 — (verified) sheet.tsx / select.tsx** — NO CHANGE. Sheet already `w-3/4 sm:max-w-sm` + h-full; Select already `max-h-(--radix-select-content-available-height) overflow-y-auto`.

## Test locks turned green

- [ ] `ui/__tests__/table.test.tsx` (T0.2)
- [ ] `ui/__tests__/dialog.test.tsx` (T0.3)
- [ ] `ui/__tests__/tabs.test.tsx` + `select.test.tsx` (T0.4)
- [ ] `components/Pagination.test.tsx` (T0.5)

## Risk notes

- Radix focus trap stays on the now-scrollable DialogContent — fine. The dialog's close X scrolls out of view in tall dialogs (minor; footer Cancel still works).
- Tabs `justify-center` + overflow has a Chromium "unreachable start" edge → add `max-sm:justify-start` at the widest call sites.

## Gate

- [ ] `cd frontend && pnpm test` (full suite) + `pnpm lint` + `pnpm build`.
- [ ] Re-verify no snapshot files exist that capture primitive classNames (confirmed none).
- [ ] git diff should show ONLY the 4 one-line class changes + table.tsx comments.