# MorataFMS - Project Context for Gemini

## 1. Project Overview
**MorataFMS (Freight Management System)** is a full-stack web application designed for F.M. Morata, a freight/customs brokerage company. It tracks import/export transactions, manages client records, and handles document storage.

## 2. Technology Stack

### Backend
*   **Framework:** Laravel 12 (PHP 8.2+)
*   **Database:** MySQL (configured in `.env`), with SQLite default in example.
*   **Authentication:** Laravel Sanctum (SPA Cookie-based).
*   **Scaffolding:** Laravel Breeze (API).
*   **Key Libraries:** `laravel/sanctum`, `laravel/framework`.

### Frontend
*   **Framework:** React 19 (Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`)
*   **State/Networking:** Axios, React Context (Auth), TanStack Query v5 (server state/caching).
*   **Routing:** React Router DOM v7.

## 3. Architecture & Conventions

### Directory Structure
*   **`backend/`**: Standard Laravel application.
    *   `app/Models`: Contains Eloquent models (Client, User, ImportTransaction, etc.).
    *   `app/Policies`: Authorization policies for each model with CRUD routes.
    *   `app/Http/Requests`: Form Requests for input validation on every endpoint.
    *   `app/Http/Resources`: API Resources for consistent JSON output.
    *   `database/migrations`: Defines the schema including polymorphic `documents` table.
    *   `routes/api.php`: API endpoints. Auth routes prefixed with `/auth`.
*   **`frontend/`**: Feature-based React application.
    *   `src/features/`: functionality grouped by domain (e.g., `auth`, `tracking`).
        *   Each feature contains: `api/`, `components/`, `context/`, `hooks/`, `types/`.
    *   `src/components/`: Shared/reusable components (layout, pagination, etc.).
    *   `src/lib/axios.ts`: Centralized Axios instance with CSRF handling.
    *   `src/routes/`: Route definitions.

### Development Conventions
*   **Authentication:** The frontend uses **cookie-based authentication**. It must first request `/sanctum/csrf-cookie` before attempting login.
*   **API Pattern:** RESTful API with `apiResource` routes.
*   **Styling:** Utility-first CSS using Tailwind with dark mode support.
*   **Frontend State:** Context API for global state (Auth), TanStack Query for server state (data fetching/caching).

## 4. Setup and Execution

### Backend
```bash
cd backend
composer install
cp .env.example .env # Configure DB_DATABASE=morata_fms and DB_CONNECTION=mysql
php artisan key:generate
php artisan migrate --seed # Seeds countries and admin user
php artisan serve
```
*   **Base URL:** `http://localhost:8000`
*   **Default Admin:** `admin@morata.com` / `password`

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```
*   **Base URL:** `http://localhost:3000`

## 5. Key Domain Concepts

### Transactions
*   **Import:** Tracks incoming shipments. Has 6 stages (BOC, PPA, DO, Port Charges, Releasing, Billing).
*   **Export:** Tracks outgoing shipments. Has 4 stages (Docs Prep, CO, CIL, BL).
*   **Stages:** Each stage tracks status, completion time, and the user who completed it.

### Documents
*   **Polymorphic:** The `documents` table relates to both `import_transactions` and `export_transactions`.

### Roles
*   **Hierarchy:** `encoder` < `broker` < `supervisor` < `manager` < `admin`.
*   Use `User->hasRoleAtLeast('supervisor')` for role checks in Policies.
*   Helper methods: `isAdmin()`, `isManagerOrAbove()`, `isSupervisorOrAbove()`.

## 6. Current Status (as of Feb 2026)
*   **Completed:** Auth flow (Login/Logout), Database Schema & Migrations, Basic Dashboard UI, Seeders, API Security Hardening.
*   **Pending:** CRUD for Transactions/Clients/Documents, Role-based access control, Search/Filter.

## 7. Important Files
*   `PROJECT_CONTEXT.md`: Detailed technical reference (DB schema, ERD, API routes, frontend structure).
*   `backend/routes/api.php`: API Route definitions.
*   `frontend/src/lib/axios.ts`: Networking configuration.
*   `frontend/src/features/auth/context/AuthContext.tsx`: Authentication logic.

## 8. Security Conventions (MANDATORY)

> **CRITICAL:** These rules MUST be followed when implementing ANY new backend feature.

### Mass Assignment Protection
*   **NEVER** put server-managed fields in `$fillable` (e.g., `status`, `assigned_user_id`, `role`, `uploaded_by`).
*   Server-managed fields must be set explicitly in controllers: `$model->status = 'pending'; $model->save();` or via spread syntax.
*   When in doubt, prefer `$guarded` over `$fillable`.

### Authorization (Policies)
*   **Every model with CRUD routes MUST have a Policy** in `app/Policies/`.
*   Controllers MUST call `$this->authorize()` before any data-modifying operation.
*   Role hierarchy: `encoder < broker < supervisor < manager < admin`.
*   Use `User::hasRoleAtLeast('supervisor')` for role checks.

### Input Validation (Form Requests)
*   **Every store/update endpoint MUST use a Form Request** — never `$request->all()`.
*   Only use `$request->validated()` to extract data.
*   Always validate foreign key IDs with `exists:table,id`.

### Rate Limiting
*   All authenticated API routes use `throttle:60,1` middleware.
*   Login already has its own rate limiter (5 attempts).

### Security Testing
*   When adding a new endpoint, always add tests for:
    1. **Unauthenticated access** → should return 401
    2. **Mass assignment protection** → server-managed fields should be ignored
    3. **Authorization** → users without proper role should get 403

## 9. Backend Patterns (Follow When Adding Features)

When implementing a new model/feature in the backend, always follow this checklist:

1.  **Migration** — Create the table with proper columns, foreign keys, and indexes.
2.  **Model** — Only put user-editable fields in `$fillable`. Exclude server-managed fields.
3.  **Policy** — Create `app/Policies/{Model}Policy.php` with `viewAny`, `create`, `update`, `delete` methods.
4.  **Form Request** — Create `app/Http/Requests/Store{Model}Request.php` and `Update{Model}Request.php` with validation rules and `exists:` checks for foreign keys.
5.  **API Resource** — Create `app/Http/Resources/{Model}Resource.php` for consistent JSON output.
6.  **Controller** — Use `$this->authorize()`, `$request->validated()`, and explicit assignment for server fields.
7.  **Routes** — Register via `Route::apiResource()` inside the `auth:sanctum` + `throttle:60,1` group.
8.  **Tests** — Add auth guard, validation, mass assignment, and authorization tests.

### Controller Pattern Example
```php
public function store(StoreModelRequest $request)
{
    $this->authorize('create', Model::class);

    $model = new Model($request->validated());
    $model->created_by = $request->user()->id; // Server-managed
    $model->status = 'pending';                 // Server-managed
    $model->save();

    return new ModelResource($model);
}
```

## 10. Agent Skills & Workflows Reference

> When implementing a feature, always check `.agent/` for relevant skills and workflows before starting.

### Skill Map (When to Use)

| Task | Skill to Load | Path |
|------|---------------|------|
| Adding/modifying API endpoints | `api-patterns` | `.agent/skills/api-patterns/SKILL.md` |
| Database schema changes | `database-design` | `.agent/skills/database-design/SKILL.md` |
| Security audit or hardening | `vulnerability-scanner` | `.agent/skills/vulnerability-scanner/SKILL.md` |
| Writing tests | `testing-patterns` | `.agent/skills/testing-patterns/SKILL.md` |
| Frontend UI/UX work | `frontend-design` | `.agent/skills/frontend-design/SKILL.md` |
| Tailwind CSS patterns | `tailwind-patterns` | `.agent/skills/tailwind-patterns/SKILL.md` |
| Code quality review | `clean-code` | `.agent/skills/clean-code/SKILL.md` |
| Debugging issues | `systematic-debugging` | `.agent/skills/systematic-debugging/SKILL.md` |

### Workflow Map (Slash Commands)

| Command | When to Use |
|---------|-------------|
| `/create` | Building a new feature from scratch |
| `/enhance` | Adding to or improving existing features |
| `/debug` | Finding and fixing bugs |
| `/test` | Writing or running tests |
| `/plan` | Planning a complex multi-file change |

### How to Use
1.  Before implementing, identify the relevant skill(s) from the table above.
2.  Read the `SKILL.md` file to understand the principles and patterns.
3.  Apply the skill's guidelines alongside this project's conventions (Sections 8-9).

## 11. Frontend Patterns (Follow When Adding Features)

When implementing a new feature in the frontend, always follow this structure:

1.  **Create feature folder** — `src/features/{feature-name}/`
2.  **Types** — `types/` — TypeScript interfaces for the domain.
3.  **API** — `api/` — Axios calls using the shared `src/lib/axios.ts` instance.
4.  **Components** — `components/` — React components for the feature.
5.  **Hooks** — `hooks/` — Custom hooks for data fetching and state logic.
6.  **Context** — `context/` — Only if the feature needs global state.

### API Call Pattern
```typescript
import api from '@/lib/axios';

export const getItems = async () => {
    const { data } = await api.get('/items');
    return data;
};
```

## 12. Data Fetching & Caching Patterns

> **IMPORTANT:** All data fetching MUST use TanStack Query hooks. Do NOT use `useEffect` + `useState` for API calls.

### Frontend (TanStack Query v5)
*   `QueryClientProvider` is set up in `src/main.tsx` with `staleTime: 5min`, `retry: 1`.
*   **Custom hooks** live in `src/features/{feature}/hooks/` (e.g., `useImports.ts`, `useClients.ts`).
*   **Queries** (`useQuery`) — for reading data. Use descriptive query keys: `['imports', params]`.
*   **Mutations** (`useMutation`) — for creating/updating. Always `invalidateQueries` on success.
*   **Static data** (clients, countries) — use `staleTime: Infinity` (fetched once per session).
*   **Dynamic data** (transactions) — use default `staleTime: 5min`.

### Hook Pattern Example
```typescript
// Query hook (src/features/tracking/hooks/useImports.ts)
import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';

export const useImports = (params?: Params) => {
    return useQuery({
        queryKey: ['imports', params],
        queryFn: () => trackingApi.getImports(params),
    });
};

// Mutation hook (src/features/tracking/hooks/useCreateImport.ts)
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateImport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trackingApi.createImport,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['imports'] }),
    });
};
```

### Lazy Query Pattern (`enabled` flag)
Use `enabled` to defer a query until a condition is met (e.g., a modal is open). Always add an `enabled` param with a default of `true` for backward compatibility.
```typescript
// Hook: gate the query behind an enabled flag
export const useClients = (type?: 'importer' | 'exporter', enabled = true) => {
    return useQuery<ApiClient[]>({
        queryKey: ['clients', type],
        queryFn: () => trackingApi.getClients(type),
        staleTime: Infinity,
        enabled, // query only fires when enabled = true
    });
};

// Consumer: only fetch when modal is open
const { data: clients } = useClients('importer', isOpen);
```

### Background Prefetch Pattern (`prefetchQuery`)
Use `prefetchQuery` in a parent page component to warm the cache **before** the user opens a modal or navigates to a sub-page. This gives instant dropdown population with zero wasted calls if the action is never triggered.

> **Rule:** Use this for static/lookup data (`staleTime: Infinity`) that is needed in a modal or child component. The query keys MUST match the hooks used in the modal exactly.

```typescript
// In the parent page component (e.g., ImportList.tsx)
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

useEffect(() => {
    // Fires once on mount, non-blocking. Cache hit on subsequent renders.
    queryClient.prefetchQuery({
        queryKey: ['clients', 'importer'], // must match useClients('importer') key
        queryFn: () => trackingApi.getClients('importer'),
        staleTime: Infinity,
    });
}, [queryClient]);
```

**When to use each approach:**

| Data Type | Approach |
|---|---|
| Static lookup (clients, countries) | `prefetchQuery` on parent mount + `enabled: isOpen` on hook |
| Frequently changing data | Fetch on open (`enabled: isOpen`) — no prefetch |
| Data needed immediately on page | Plain `useQuery` with no `enabled` flag |

### Backend (Rate Limiting)
*   All authenticated routes use `throttle:60,1` (60 requests/minute per user).
*   Login has its own rate limiter (5 attempts).
*   For static endpoints (e.g., `/api/countries`), consider using Laravel's `Cache::remember()` to avoid repeated DB queries.
