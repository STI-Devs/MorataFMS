# Auth Architecture Note

This document explains the current temporary auth mode, why it exists, and how to safely revert to first-party Sanctum cookie auth later.

If this document ever conflicts with the live code, trust the code first. This note is intentionally behavior-driven so it stays useful even if files move.

## Current State

MorataFMS currently uses a temporary bearer-token auth flow for the deployed frontend/backend split.

Why:
- Railway-provided `*.up.railway.app` domains sit behind a public-suffix boundary that breaks the intended Sanctum cookie SPA flow for separate frontend and backend services.
- Because of that, the frontend cannot rely on cross-origin session cookies consistently in production.

What the app does now:
- `POST /api/auth/login` validates credentials and returns a bearer token plus the authenticated user payload.
- `POST /api/auth/logout` revokes only the current bearer token.
- `GET /api/user` remains the identity/bootstrap endpoint for authenticated clients.
- Protected API routes still use `auth:sanctum`.
- The frontend stores the token in `sessionStorage`, not `localStorage`.
- The frontend sends `Authorization: Bearer <token>` on API requests.
- No refresh token flow exists.
- No persistent “remember me” behavior exists.
- Roles, permissions, policies, gates, and route protection still come from the backend as before.

## Why This Is Temporary

This bearer-token mode is a deployment workaround, not the preferred long-term architecture for the first-party web app.

Preferred long-term state:
- frontend on a purchased subdomain such as `app.example.com`
- backend on a purchased subdomain such as `api.example.com`
- shared root domain
- Sanctum cookie-based SPA auth restored

Cookie auth is the intended future mode because it fits a first-party SPA better and gives the app the standard Sanctum CSRF + `HttpOnly` cookie model.

## Invariants For Future Work

As long as this temporary mode remains active:
- Keep login at `POST /api/auth/login`.
- Keep logout at `POST /api/auth/logout`.
- Keep current user bootstrap at `GET /api/user`.
- Keep auth tokens session-only in the browser.
- Do not introduce `localStorage` token persistence unless that is an explicit product decision.
- Do not add refresh tokens unless there is a separate design decision for them.
- Do not fork a second auth system in parallel.

When adding new protected API endpoints:
- Continue using `auth:sanctum`.
- Assume the active deployed frontend will authenticate with bearer tokens until cookie auth is intentionally restored.

When adjusting CORS in bearer mode:
- The backend must allow the `Authorization` header in preflight responses.

## How To Rediscover The Current Auth Mode

Do not rely on file paths staying the same. Instead, search for these behaviors and signatures:

Backend discovery cues:
- `/api/auth/login`
- `/api/auth/logout`
- `createToken(`
- `currentAccessToken()`
- `EnsureFrontendRequestsAreStateful`
- `auth:sanctum`

Frontend discovery cues:
- `sessionStorage`
- `Authorization`
- `Bearer `
- `auth:unauthorized`
- `/api/user`
- `/sanctum/csrf-cookie`
- `withCredentials`
- `withXSRFToken`

What to expect while bearer mode is active:
- frontend auth bootstrap should check for a stored token before calling `/api/user`
- the frontend HTTP client should inject an `Authorization` header
- login should not require `/sanctum/csrf-cookie`
- logout should clear the stored token even if the API call fails

## Rollback Plan To Cookie Auth

Only do this after a purchased shared-root domain is available.

### Preconditions

You should have something like:
- frontend: `https://app.example.com`
- backend: `https://api.example.com`

And you should confirm the browser will treat them as same-site subdomains under a real shared root domain.

### Deployment / Env Expectations

Expected cookie-mode env shape:
- `APP_URL=https://api.example.com`
- `FRONTEND_URL=https://app.example.com`
- `SANCTUM_STATEFUL_DOMAINS=app.example.com`
- `SESSION_DOMAIN=.example.com`
- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=none` if required by the deployment shape

Adjust exact values to the real domain and HTTPS setup.

### Backend Rollback Checklist

Revert auth behavior, not just env values:
- restore login to Laravel session auth instead of token issuance
- restore session regeneration on login
- restore session invalidation and CSRF token regeneration on logout
- re-add Sanctum’s stateful frontend middleware to the API middleware stack
- keep `auth:sanctum` on protected routes so Sanctum can authenticate stateful SPA requests
- update any auth docs/OpenAPI notes that currently describe bearer mode as active

Questions to answer before merging the rollback:
- Is `/api/auth/logout` intended to log out the web session only?
- Are any non-browser clients still depending on bearer login?
- Should CORS still allow `Authorization` for other consumers after the SPA rollback?

### Frontend Rollback Checklist

Restore first-party Sanctum SPA behavior:
- remove the session token storage helper
- stop injecting `Authorization: Bearer ...` from the frontend HTTP client
- restore `withCredentials` / `withXSRFToken` if the app uses Axios-based Sanctum flow
- restore the `/sanctum/csrf-cookie` bootstrap before login
- restore auth bootstrap so it does not depend on a stored token gate
- keep `/api/user` as the post-login identity source

### Test Rollback Checklist

Update both stacks together:
- backend tests should assert session/cookie login again instead of token issuance
- frontend tests should assert CSRF bootstrap + cookie session behavior again
- CORS tests may need to change depending on whether browser clients still send `Authorization`
- smoke/build assertions should stop assuming `sessionStorage` token auth

## Acceptance Checklist For Current Bearer Mode

Use this while bearer mode is active:
- a clean browser session lands on login, not an authenticated app view
- successful login returns a token and lets the user access protected pages
- hard refresh in the same browser session keeps the user signed in
- closing the browser clears the temporary session and requires login again
- logout makes `/api/user` return `401`
- local dev CORS preflight accepts the `Authorization` header from the frontend origin

## Acceptance Checklist For Future Cookie Rollback

Use this after reverting to cookie auth:
- login succeeds after fetching `/sanctum/csrf-cookie`
- no frontend token storage is needed
- `/api/user` authenticates from the session cookie after refresh
- logout invalidates the session and `/api/user` returns `401`
- browser devtools show cookie-based auth behavior instead of `Authorization: Bearer ...`

## Important Note For Future Agents

Do not assume bearer auth is the final intended design.

The correct long-term target for the first-party web app is still Sanctum cookie-based SPA auth once the project has a purchased shared-root domain that makes same-site session cookies viable.
