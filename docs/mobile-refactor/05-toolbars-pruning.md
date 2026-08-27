# Phase 5 — Toolbars, Filters, Pruning

**Goal:** density reduction for the crowded control bars and overflow-prone toolbars, following the reference conventions (flex-wrap, flex-col-reverse for primary actions, `hidden sm:` pruning, popper clamps).

**Status:** ✅ complete (2026-08-28) — T5.1–T5.7 applied; affected suites (30 files / 109 tests) + lint + build green.

## Tasks

- [ ] **T5.1 — `audit-logs/AuditLogs.tsx`** (7-control bar)
  - Search (~170): `relative w-full sm:w-[220px] lg:w-[260px]` → add `min-w-0`.
  - Actor pills (~181): `flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0` → `flex flex-wrap items-center gap-1.5` (root of the scroll-strip bug — the parent already wraps).
  - Date From/To (~227–247): fold BOTH date inputs into one `<DropdownMenu>` "Date Range" popover (trigger `Button` dashed `CalendarRange` icon; content `align="start" max-w-[calc(100vw-2rem)] p-2.5 space-y-2`, From/To inputs stay MOUNTED inside). 7 controls → 5 + Reset.
  - Add `shrink-0` to the trigger. State/handlers in `useAuditLogsWorkspace` reused as-is.
- [ ] **T5.2 — `components/data-table/DataTableFacetedFilter.tsx`** (~52) popper clamp
  - `className="w-44 p-1" align="start"` → `w-44 min-w-44 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto p-1` + `side="bottom"`. Option label span → `min-w-0 truncate`.
- [ ] **T5.3 — `components/data-table/DataTableColumnHeader.tsx`** (~59)
  - `align="start" className="w-28"` → `align="start" side="bottom" className="w-28 max-w-[calc(100vw-2rem)]"`.
- [ ] **T5.4 — 4 CRUD toolbars** (`clients/ClientManagement`, `countries/CountryManagement`, `users/UserManagement`, `locations-of-goods/LocationOfGoodsManagement`)
  - Root: `flex flex-col gap-3 sm:flex-row …` → `flex flex-col-reverse gap-3 sm:flex-row …` (primary Create climbs above filters on mobile).
  - Search: add `min-w-0` (keep `w-full sm:w-[240px] lg:w-[300px]`; User uses 220/280).
  - Pills: `overflow-x-auto pb-1 sm:pb-0` → `flex flex-wrap items-center gap-1.5`.
- [ ] **T5.5 — `tracking/dashboard/TrackingDashboard.tsx`** tabs bar (4 tabs ≈ 410px > 375px)
  - TabsList (~719): `className="h-9 p-1 bg-muted/60"` → `h-9 max-w-full justify-start gap-0.5 overflow-x-auto p-1 bg-muted/60` (**`max-w-full justify-start` required** — base is `w-fit`, else no-op).
  - TabsTriggers (~720–744): append `shrink-0`.
  - Count Badges: `hidden … sm:inline-flex` (prunes ~32px/tab; labels stay).
  - Search (~753): add `min-w-0`.
- [ ] **T5.6 — `archives/workspace/ArchiveWorkspaceFilters.tsx`**
  - Search: add `min-w-0`.
  - Type/status pill groups: `flex items-center gap-1` → `flex flex-wrap items-center gap-1`.
  - Right cluster (~136): `flex items-center gap-2 self-end xl:self-center` → `flex flex-wrap items-center justify-end gap-2 self-end xl:self-center`.
- [ ] **T5.7 — `tracking/vessel-groups/VesselListToolbar.tsx`**
  - Root: → `flex flex-col-reverse gap-3 sm:flex-row …` (Encode + view toggle above filters on mobile).
  - Search (~69): `relative flex-1 min-w-[220px] max-w-sm` → `relative min-w-0 max-w-sm flex-1 sm:min-w-[220px]`.
  - Right cluster (~136): add `flex-wrap justify-end`.
  - Select triggers `w-[135px]`/`w-[130px]`: KEEP (fixed chips wrap intentionally).

## Test locks turned green

- [ ] T0.8 toolbar locks: AuditLogs date popover (both inputs in content + `All Dates` flips to range); TrackingDashboard tab click + attention badge gating; VesselListToolbar Grouped/Flat + Encode handlers.
- [ ] Existing selector locks survive: AuditLogs placeholders/`System Events`/`All Activity`/`reset`; CRUD search placeholders + `/exporter|export destination|^active|^reset/`.

## Risk notes

- AuditLogs popover: date inputs must stay mounted (isFiltered/reset read `dateFrom`/`dateTo` directly). `DropdownMenu` is the only primitive (no popover/calendar exists) — do NOT add a new primitive.
- `flex-col-reverse` reorders DOM/tab order (Create above filters) — intended, but confirm with product.
- Tabs overflow is a silent no-op without `max-w-full justify-start` — verify at 320px too.
- T5.2/5.3 also affect the Oversight toolbar/table (same shared components) — re-QA alignment of right-aligned sort/action columns.

## Gate

- [ ] `cd frontend && pnpm test` scoped to audit-logs + 4 CRUD + tracking/dashboard + archives pages, then full suite; `pnpm lint`; `pnpm build`.
- [ ] Manual 320/375/640px sweep of AuditLogs, CRUD pages, Tracking dashboard, archive filters, vessel toolbar: pills wrap, no horizontal scroll strip, primary action on top, date popover reachable.