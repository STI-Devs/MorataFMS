# Auth Architecture Note

This document describes the current first-party web authentication model for MorataFMS.

If this document ever conflicts with the live code, trust the code first.

## Current State

MorataFMS now uses Sanctum cookie-based SPA authentication for the deployed split frontend/backend setup.

Production deployment shape:
- frontend: `https://app.fmmcbs.com`
- backend: `https://api.fmmcbs.com`
- shared root domain: `fmmcbs.com`

Current behavior:
- `POST /api/auth/login` authenticates with the Laravel session guard and returns the authenticated user payload.
- `POST /api/auth/logout` destroys the web session and regenerates the CSRF token.
- `GET /api/user` remains the identity/bootstrap endpoint for authenticated clients.
- protected API routes continue using `auth:sanctum`
- the frontend uses `withCredentials` and `withXSRFToken`
- the frontend fetches `/sanctum/csrf-cookie` before login
- no frontend token storage is used
- no bearer token injection is used for the first-party SPA

## Deployment / Env Expectations

Production cookie-auth env shape:
- `APP_URL=https://api.fmmcbs.com`
- `FRONTEND_URL=https://app.fmmcbs.com`
- `SANCTUM_STATEFUL_DOMAINS=app.fmmcbs.com`
- `SESSION_DOMAIN=.fmmcbs.com`
- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=lax` by default

Adjust only if browser behavior proves a different same-site value is required.

## Invariants For Future Work

As long as this cookie mode remains active:
- keep login at `POST /api/auth/login`
- keep logout at `POST /api/auth/logout`
- keep current user bootstrap at `GET /api/user`
- do not reintroduce `sessionStorage` or `localStorage` token persistence for the first-party SPA
- do not fork a second first-party browser auth system in parallel

When adding new protected API endpoints:
- continue using `auth:sanctum`
- assume the deployed first-party frontend authenticates through session cookies

When adjusting CORS in cookie mode:
- keep `supports_credentials=true`
- keep `allowed_origins` locked to the frontend origin
- keep `X-XSRF-TOKEN` accepted in preflight responses

## How To Rediscover The Current Auth Mode

Do not rely on file paths staying the same. Search for these behaviors and signatures instead:

Backend discovery cues:
- `/api/auth/login`
- `/api/auth/logout`
- `statefulApi()`
- `auth:sanctum`
- `session()->regenerate()`
- `session()->invalidate()`

Frontend discovery cues:
- `/sanctum/csrf-cookie`
- `withCredentials`
- `withXSRFToken`
- `auth:unauthorized`
- `/api/user`

What to expect while cookie mode is active:
- frontend auth bootstrap calls `/api/user` without checking for a stored token first
- the frontend HTTP client does not inject `Authorization: Bearer ...`
- login bootstraps CSRF before posting credentials
- logout clears local auth state even if the API request fails

## Historical Note

The app previously used a temporary bearer-token workaround while the project was deployed on Railway `*.up.railway.app` domains. That workaround is no longer the active first-party SPA model now that the project has a shared custom root domain.
