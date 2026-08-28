# Frontend Mobile / Responsive Refactor — Tracker

> Max-safety refactor of `frontend/` to make the app mobile-friendly. Plan derived from an ultracode planning pass (11 sub-agents, 2026-08-28) that re-verified every finding against current code on `staging`.
> Reference playbook: `C:\Users\User\Desktop\shadcn-admin` + `C:\Users\User\Desktop\shadcn-templates\shadcn-dashboard-landing-template\nextjs-version` (patterns distilled in memory, not vendored).

## Golden rules (the "nothing breaks" contract)

1. **Test-lock FIRST.** Each phase writes behavioral-lock tests that FAIL on current code, then applies the change, then flips them green.
2. **Order matters.** Primitives → shell → pages, because shared changes cascade. Overlay migration is last (highest blast radius).
3. **Gate every phase:** `cd frontend && pnpm lint && pnpm test && pnpm build`.
4. **Final gate:** add `pnpm smoke`.
5. Don't restyle unrelated screens. Don't introduce new patterns the app doesn't already have (AGENTS.md).

## Verified context (supersedes any older line numbers)

- `components/ui/table.tsx` wraps every `<Table>` in `overflow-x-auto` → shadcn-Table pages already scroll; `overflow-hidden` Cards only clip corners.
- **Truly clipped (no scroll) — the real fixes:** `TransactionListPage` (9/7-col inline grid), `VesselGroupedImport/ExportList`, `ArchivesViews` inline grids, `LegacyFolderBrowserPanel` (table-fixed), `AdminDocumentReview` 1184px split.
- Test setup stubs `matchMedia` to **desktop** → mobile behavior is untested today; Phase 0 makes it toggleable.
- Landing page has NO sign-in path below 768px (inert hamburger; button `hidden md:block`).

## Phase status

| # | Phase | File | Files touched | Tests | Status |
|---|-------|------|---------------|-------|--------|
| 0 | Safety foundation (test locks + matchMedia) | [00-safety-foundation.md](00-safety-foundation.md) | setup.ts + ~10 new test files | red→green | ✅ |
| 1 | Shared primitives | [01-shared-primitives.md](01-shared-primitives.md) | dialog, alert-dialog, tabs, Pagination, table | existing + 4 new | ✅ |
| 2 | Shell infrastructure | [02-shell-infrastructure.md](02-shell-infrastructure.md) | MainLayout, sidebar, index.css | MainLayout + new shell tests | ✅ |
| 3 | Un-clip tables | [03-unclip-tables.md](03-unclip-tables.md) | tracking, processor, accounting, oversight | feature suites | ✅ |
| 4 | Archives structural | [04-archives-structural.md](04-archives-structural.md) | legacy browser, admin review, ArchivesViews/FolderView | archives + documents suites | ✅ |
| 5 | Toolbars & pruning | [05-toolbars-pruning.md](05-toolbars-pruning.md) | audit-logs, CRUD ×4, tracking, archive filters | feature suites | ✅ |
| 6 | Grids collapse + charts | [06-grids-charts.md](06-grids-charts.md) | dashboards, reports, law-firm, modals | dashboard suites + new | ✅ |
| 7 | Auth & landing | [07-auth-landing.md](07-auth-landing.md) | LandingPage, AuthPage, LoginForm | App, LoginForm, + new | ✅ (optional new tests noted) |
| 8 | Overlay migration → Radix | [08-overlay-migration.md](08-overlay-migration.md) | 4 custom overlays + dialog/alert-dialog | 5 new + 6 mock-double | ⬜ |

**Legend:** ⬜ pending · 🟡 in progress · ✅ done

## Commands

```bash
cd C:/Users/User/Desktop/MorataFMS/frontend
pnpm lint        # eslint
pnpm test        # vitest run (89 files + smoke separately)
pnpm build       # tsc -b && vite build
pnpm smoke       # build + node --test ./smoke.test.mjs
```

## Notes

- `Profile.tsx` / `Help.tsx` legacy tokens (`bg-surface`, `text-text-primary`): OUT OF SCOPE — `theme.css` aliases already resolve them (documented, zero behavior change). Defer to a token-hygiene PR.
- Dead code discovered (leave alone, don't revive): `archives/workspace/ArchiveYearCard.tsx` + `ui/{ColHeader,StageCount,CircularProgress,FolderSVG}`, `admin-dashboard/{DashboardCharts,OperationalHealth,DashboardSkeleton,OperationWorkspace}` (unreferenced), `tracking/dashboard/{CalendarCard,StatusChart,TransactionCard,DateTimeCard,PageHeader}`.