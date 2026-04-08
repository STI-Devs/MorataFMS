# Frontend Agent Guidelines

These guidelines apply to all work inside `frontend/`.

The goal is to keep this React frontend scalable, consistent with the Laravel backend, and well-structured without over-engineering.

## Skills Activation

- `vercel-react-best-practices` — Use this local skill for React performance, rerender, bundle size, route-splitting, hydration, and production-readiness work inside `frontend/`. Trigger whenever a task involves React component refactors, hooks, lazy routes, bundle warnings, rendering churn, or frontend audits.

## Package Manager

- Use `pnpm` for dependency management and script execution inside `frontend/`.
- Do not mix `npm` and `pnpm` in the same frontend workstream unless the user explicitly asks for it.

## Core Rule

Before creating, moving, or modifying any frontend file:

1. Inspect sibling files in the same feature or folder.
2. Reuse the existing naming, structure, and data flow patterns.
3. Check whether the same concern already has a shared utility, hook, type, route constant, or API helper.
4. Only then add or change code.

Do not invent a new pattern when the app already has one.

## Architecture Goals

- Keep the frontend feature-based, not layer-heavy.
- Prefer practical reuse over generic abstractions.
- Keep server-state logic close to React Query hooks.
- Keep route definitions centralized.
- Keep backend contracts explicit and typed.
- Let the backend remain the source of truth for permissions and business rules.

## Required Pre-Change Checklist

Before making any significant frontend change, check these first when relevant:

- `src/lib/appRoutes.ts` for route names, navigation, and guarded paths
- `src/lib/axios.ts` for HTTP client behavior
- sibling `api/`, `hooks/`, `types/`, and `components/` files in the same feature
- sibling `*.test.ts` or `*.test.tsx` files in the same feature when behavior is already covered
- `src/features/auth/utils/access.ts` for role and access behavior
- existing query key helpers before adding new React Query keys

If the change touches backend-connected data, verify the Laravel API response shape first and follow the existing TypeScript contract rather than guessing.

## Folder Structure

Use the existing structure:

- `src/features/*` for feature-owned UI, hooks, types, and API calls
- `src/components/*` for shared UI
- `src/pages/*` for route-level pages
- `src/lib/*` for shared app infrastructure
- `src/context/*` only for true app-wide client state

Do not create new top-level directories without approval.

Do not move feature logic into `src/components` just because it is reused once or twice.

## Routes And Navigation

All route paths must come from `src/lib/appRoutes.ts`.

Rules:

- Do not hardcode route strings in components, hooks, layouts, or redirects.
- Do not create sidebar items inline inside layout components if they belong in centralized navigation metadata.
- When adding a new page, update route constants and any relevant navigation metadata together.
- When removing a page, remove its route, guards, redirects, and navigation entry in the same change.

`appRoutes.ts` is the source of truth for:

- route path constants
- navigation items
- guarded route groups
- admin dashboard quick links

## Auth, Roles, And Permissions

The only frontend auth roles are:

- `encoder`
- `paralegal`
- `admin`

Rules:

- Do not reintroduce `lawyer`, `broker`, `supervisor`, or `manager` as auth roles.
- `job_title` is display/business metadata, not authorization.
- Frontend access decisions must use backend-provided `role`, `departments`, and `permissions`.
- Prefer `src/features/auth/utils/access.ts` helpers over ad hoc role checks scattered in components.
- Production note: the deployed app uses first-party Sanctum cookie-based SPA auth on the shared `fmmcbs.com` root domain. Do not reintroduce frontend token storage for the first-party web app.

If a new permission-sensitive feature is added:

1. Confirm the backend contract first.
2. Extend typed access models if needed.
3. Reuse centralized access helpers before adding new conditionals in UI components.

## API Conventions

All HTTP requests must go through `src/lib/axios.ts`.

Rules:

- Do not create ad hoc `fetch()` calls when the app already uses Axios.
- Keep feature-specific endpoints inside that feature's `api/` module.
- Unwrap backend resource payloads consistently in the API layer, not deep inside components.
- Do not normalize backend data differently in multiple places.

The backend is Laravel-based, so frontend code should expect:

- API resources may return `{ data: ... }`
- auth/session behavior is handled via Sanctum and the shared Axios client
- validation and authorization errors should be surfaced cleanly, not swallowed

## React Query Rules

Server state must use React Query.

Rules:

- One query key must map to one data shape.
- Reuse shared query key helpers before creating new query keys.
- Keep data fetching and mutation logic in hooks, not route components.
- Invalidate the narrowest correct cache keys after mutations.
- Do not mix transformed and raw payloads under the same query key.

If a feature already has a query-key helper, extend it instead of creating inline array keys in multiple files.

## Types And Contracts

TypeScript types should mirror backend responses closely.

Rules:

- Put feature-owned types inside that feature's `types/` folder when possible.
- Use shared app-wide types only when multiple features truly depend on them.
- Do not widen types to `any` to get around contract mismatches.
- If the backend contract changes, update the TypeScript types and the consuming API/hook layers in the same change.

Prefer adapting API data in one place instead of pushing shape-fixing logic into many components.

## Components And Hooks

Use the existing division of responsibilities:

- `api/` files talk to the backend
- `hooks/` files own server-state integration and cache behavior
- `components/` files render UI and handle local presentation state
- `pages/` files assemble route-level screens

Rules:

- Do not place API calls directly inside presentational components unless the feature already follows that pattern and there is a strong reason.
- Do not create giant components that mix fetching, routing, authorization, and rendering.
- Extract a hook or utility only when there is a real repeated pattern, not speculative reuse.

## Styling And UI

Preserve the app's established visual language.

Rules:

- Reuse the current Tailwind utility patterns and existing surface/text/border tokens.
- Prefer matching nearby components before introducing a new visual pattern.
- Do not restyle unrelated screens during functional changes.
- Avoid one-off design systems inside a single feature.

Frontend improvements should feel intentional, not generic or template-driven.

## Naming Rules

Follow existing naming patterns:

- components: `PascalCase.tsx`
- hooks: `useSomething.ts`
- utilities: `camelCase.ts`
- feature types: `*.types.ts` where that pattern already exists
- colocated tests: `*.test.ts` or `*.test.tsx`

Names should describe business intent clearly. Prefer `useTransactionDetail` over vague names like `useData`.

When creating a new file, copy the naming pattern from sibling files first.

## Backend Alignment Rules

This frontend must stay aligned with the backend contract.

When a change affects both sides:

1. Update backend resource/request/policy behavior first or together.
2. Update frontend types, API helpers, hooks, and UI in the same workstream.
3. Remove backward-compatibility hacks once the backend contract is finalized.

Do not leave the frontend carrying dead role names, old status values, or outdated payload assumptions after a backend refactor.

## Allowed And Disallowed Abstractions

Prefer:

- shared route constants
- shared query key helpers
- feature-local API modules
- feature-local hooks
- typed access helpers

Avoid unless clearly justified:

- new global state libraries
- generic repository-style frontend layers
- duplicate route registries
- duplicate auth logic
- speculative component frameworks

This app should remain straightforward to onboard into.

## Verification Scripts

- Do not create ad hoc verification scripts when a Vitest test can prove the behavior.
- Prefer the smallest command that proves the change.
- Use `pnpm vitest run path/to/file.test.tsx` for targeted frontend tests.
- Use `pnpm test` for the full frontend unit/component suite.
- Use `pnpm run test:coverage` when you need a coverage report to inspect gaps.
- Use `pnpm smoke` for build-level assertions that are awkward to express as component tests.

## Test Enforcement

- Every meaningful frontend behavior change should be programmatically tested. Add a new test or update an existing one, then run the affected tests.
- Prefer colocated Vitest tests beside the feature they cover.
- Use React Testing Library and `@testing-library/jest-dom` for DOM-facing component and route behavior.
- Use the configured Vitest DOM environment from `vite.config.ts`; do not invent a second frontend test runner without approval.
- Mock feature API modules at the feature boundary unless the test is specifically about shared infrastructure.
- Do not delete tests without approval.
- Do not treat blanket 100% coverage as the default goal. The expectation is strong regression coverage for changed and high-risk flows, then expand coverage deliberately over time.

## Verification

After frontend changes, always run:

1. `pnpm lint`
2. `pnpm test`
3. `pnpm build`

If the change affects backend-connected flows, also sanity-check that the frontend types and API unwrapping still match the backend resources.

If the change targets production-readiness, bundle behavior, or build regressions, also run `pnpm smoke`.

## Documentation Discipline

Do not create extra documentation files unless explicitly requested.

If this file needs updates, change it only when the actual frontend architecture or conventions have changed.

## Agent Workflow

When asked to create or modify frontend code, follow this order:

1. Read the relevant sibling files first.
2. Identify the existing convention for naming, routes, types, hooks, and API usage.
3. Reuse shared helpers and constants.
4. Make the smallest clean change that fits the current architecture.
5. Add or update tests for the changed behavior.
6. Run `pnpm lint`, the affected `pnpm` test command, and `pnpm build`.

If a requested change would break these conventions, pause and realign before implementing it.
