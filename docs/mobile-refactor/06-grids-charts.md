# Phase 6 — Grids Collapse + Dashboard Charts

**Goal:** collapse the 13 bare `grid-cols-2` strips to 1 column on phones (keep the 6 intentional ones), and give the 12-month bar charts horizontal scroll with a phone-only min-width so bars stay readable.

**Status:** ✅ complete (2026-08-28) — 13 grid swaps + 4 chart wraps applied; dashboard/reports suites + full gate green.

## Tasks — grids (change base `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` [+`lg:grid-cols-4` where present])

- [x] `accounting-dashboard/AccountingDashboard.tsx` (~135): `grid gap-3 grid-cols-2 lg:grid-cols-4` → `grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [x] `accounting-dashboard/AccountingImpExpPage.tsx` (~195): same
- [x] `processor-dashboard/ProcessorTransactionPage.tsx` (~117): same
- [x] `processor-dashboard/ProcessorDashboard.tsx` (~156): same
- [x] `tracking/dashboard/TrackingDashboard.tsx` (~638 KPI strip): same
- [x] `tracking/details/TransactionInfoCard.tsx` (~63): `grid gap-3 grid-cols-2 lg:grid-cols-4` → 1/2/4
- [x] `tracking/details/TrackingDetailsSkeleton.tsx` (~40): `grid grid-cols-2 sm:grid-cols-4 divide-x …` → `grid grid-cols-1 gap-3 sm:grid-cols-2 sm:divide-x …`
- [x] `documents/document-list/DocumentsStats.tsx` (~31): `grid grid-cols-2 gap-2.5 lg:grid-cols-4` → `grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4`
- [x] `law-firm/records/NotarialGeneratedDocumentsPage.tsx` (~156): `grid grid-cols-2 gap-3 sm:grid-cols-4` → `grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4`
- [x] `law-firm/notarial/NotarialTemplateUploadPage.tsx` (~253): same
- [x] `oversight/modals/StatusOverrideModal.tsx` (~99): `grid grid-cols-2 gap-2` → `grid grid-cols-1 sm:grid-cols-2 gap-2`
- [x] `archives/documents/AddArchiveDocumentModal.tsx` (~139): same
- [x] `admin-dashboard/OperationalHealth.tsx` (~148): `grid grid-cols-2 gap-2.5` → `grid grid-cols-1 sm:grid-cols-2 gap-2.5` (orphaned, parity)

## Tasks — charts (12-month hand-rolled bars)

- [x] `admin-dashboard/AdminDashboard.tsx` (~378) — wrap `flex h-44 items-end …` in `overflow-x-auto` + inner `min-w-[520px] sm:min-w-0`; add `pt-9`(ish) top padding so `-top-8` hover tooltips aren't clipped by the scroll container.
- [x] `encoder-dashboard/EncoderDashboard.tsx` (~247): same treatment.
- [x] `reports/ReportsAnalytics.tsx` (~170, MonthlyBars): same.
- [x] `encoder-dashboard/EncoderReportsAnalytics.tsx` (~18–42 h-52 rows): same.
- [ ] Donuts stay px-fixed (`size-32`/`size-36`). Status legend pills stay `grid-cols-2` (KEEP).

## KEEP (do NOT change) — intentional 2-col

- `admin-dashboard/AdminDashboard.tsx` (~482 status legend, ~677 Ready/Missing pair) · `encoder-dashboard/EncoderDashboard.tsx` (~358 legend) · `admin-dashboard/DashboardCharts.tsx` (~92, orphaned) · `forms/DocumentPreview.tsx` (~77 notarization block) · `archives/pages/LegacyBatchesPage.tsx` (~206 Files/Size chips).

## Test locks turned green

- [ ] T0.8 grid-lock: per touched KPI strip `toHaveClass('grid-cols-1','sm:grid-cols-2')`; bar-chart wrappers `overflow-x-auto` + inner `min-w-[520px] sm:min-w-0`.
- [ ] Existing dashboard tests: AdminDashboard `[data-chart]===2` + `[data-slot="skeleton"]`, EncoderDashboard `toHaveClass('inline-flex','w-fit','rounded-md','uppercase')` — unchanged.

## Risk notes

- `overflow-x-auto` on the chart wrapper forces implicit `overflow-y:auto` — the top padding (pt-9/pt-10) matching the `-top-8` tooltip overlap is REQUIRED or tooltips silently clip.
- The `sm:min-w-0` reset is REQUIRED or desktop 3-col/lg rows start horizontal-scrolling.
- recharts (`components/ui/chart.tsx`) is dead code — only orphaned `DashboardCharts.tsx` imports it. If ever revived: `ResponsiveContainer` needs an explicit height class or it collapses.

## Gate

- [ ] `cd frontend && pnpm test` scoped to the dashboard/report/law-firm/modal suites; `pnpm lint`; `pnpm build`.
- [ ] Manual 360/390/640/1024px: exactly 1 column on phones; bar charts scroll (no <30px bars, no 10px label overlap); page itself doesn't scroll horizontally; hover tooltip renders fully above each bar.