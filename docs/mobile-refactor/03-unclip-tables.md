# Phase 3 — Un-clip Tables (tracking + oversight + task pages)

**Goal:** give the genuinely-clipped grid-div lists real horizontal scroll (with a shared min-width floor so header/rows stay aligned), and pin the identity column (`max-md:sticky`) on the shadcn-Table task pages.

**Status:** ✅ complete (2026-08-28) — U3.1–U3.9 applied; tracking/processor/accounting/oversight suites + full gate green.
**Revert note (2026-08-28):** the U3.6–U3.8 sticky reference columns (`max-md:sticky`) were **reverted** per user preference — tables now scroll fully left-to-right with no pinned column. The scroll wrappers + min-width floors (U3.1–3.5) remain. The `group` classes added only for the sticky hover tint were also removed. Verified repo-wide: 0 horizontal-sticky columns, all tables horizontally scrollable.

## Tasks

- [x] **U3.1 — `TransactionListPage.tsx`** (the biggest real clip, 9/7-col inline grids)
  - Card wrapper (~line 157): `overflow-hidden rounded-xl …` → `overflow-x-auto rounded-xl …`
  - Props interface: add `minGridWidth?: string` (backward-compatible, only 2 callers).
  - Header (~164) + row (~200) grids: `style={{ gridTemplateColumns }}` → `style={{ gridTemplateColumns, minWidth: minGridWidth }}` — the SAME floor on header and rows or columns drift when scrolled.
- [x] **U3.2 — `lists/ImportList.tsx`**: add `minGridWidth="1100px"` to the flat-view `<TransactionListPage>` call.
- [x] **U3.3 — `lists/ExportList.tsx`**: add `minGridWidth="880px"`.
- [x] **U3.4 — `vessel-groups/VesselGroupedImportList.tsx`** (+`ImportTransactionRow.tsx`)
  - Inner wrapper `overflow-hidden bg-card` → `overflow-x-auto`.
  - Header grid + row grid: add `lg:min-w-[1080px]`.
- [x] **U3.5 — `vessel-groups/VesselGroupedExportList.tsx`** (+`ExportTransactionRow.tsx`)
  - Same pattern → `overflow-x-auto` + `lg:min-w-[1000px]`.
- [x] **U3.6 — `dashboard/TrackingDashboard.tsx` VesselListView** (Table already scrolls — VERIFY-ONLY + sticky)
  - First `TableHead` (~364): add `max-md:sticky max-md:left-0 max-md:z-20 max-md:bg-card`.
  - First `TableCell` (~426): add `max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-card max-md:group-hover:bg-muted/50` (TableRow already has `group`).
- [x] **U3.7 — `processor-dashboard/ProcessorTransactionPage.tsx`** (VERIFY-ONLY + sticky + narrow actions)
  - TableRow: add `group`.
  - Reference TableHead (~462): add `max-md:sticky max-md:left-0 max-md:z-20 max-md:bg-card`.
  - Reference TableCell (~508): add sticky + `max-md:group-hover:bg-muted/50`.
  - Actions TableHead: `w-[140px]` → `w-[140px] max-md:w-[96px]`. **NO kebab** (test locks `getByRole('button',{name:/^View$/i})` count=1).
- [x] **U3.8 — `accounting-dashboard/AccountingImpExpPage.tsx`** (same as U3.7)
  - QueueTableRow add `group`; reference TableHead/TableCell sticky; actions col stays button/text (test locks `Included in vessel upload`).
- [x] **U3.9 — `oversight/TransactionOversight.tsx` + `OversightTable(.Row)`** (already healthy — scrolls + hidden md cols) — OPTIONAL trims only
  - Vessel `min-w-[160px]`→`[140px]`, Client `min-w-[200px]`→`[170px]`. Do NOT sticky Vessel/Reference (sortable headers, fragile offsets).

## Test locks turned green

- [ ] T0.8 unclip locks: new `TransactionListPage.test.tsx` (wrapper `overflow-x-auto`; header+first-row share inline min-width); extend VesselGroupedLists, TrackingDashboard, ProcessorTransactionPage.test (View count=1), AccountingImpExpPage.test (`Included in vessel upload`).

## Risk notes

- Header and data-row grids MUST use the exact same min-width floor, or columns drift when scrolled.
- Sticky cells need opaque `bg-card` + `group`/`group-hover` tint or text bleeds through.
- `overflow-x-auto` also computes overflow-y auto — row heights auto-fit; pagination stays outside the scroll area (verified).
- Watch 1024–1280px band so no permanent scrollbar on common laptops.

## Gate

- [ ] `cd frontend && pnpm test` scoped to tracking + processor + accounting + oversight suites, then full suite; `pnpm lint`; `pnpm build`.
- [ ] Manual 390px / 1024px / 1440px: imports/exports flat+grouped scroll, identity column pinned, actions reachable; no page-level horizontal scrollbar at 1440px.