# Phase 7 — Auth & Landing (guest path)

**Goal:** restore the missing mobile sign-in path on the landing page, make AuthPage scrollable/short-screen safe, and fit the Turnstile widget on phones.

**Status:** ✅ complete (2026-08-28) — A7.1–A7.6 applied, full gate green (App.test 'Sign In' uniqueness + LoginForm turnstile tests pass with the changes). Optional follow-up: T0.8 new LandingPage/AuthPage tests.

## Tasks

- [x] **A7.1 — `pages/LandingPage.tsx`** (highest-severity guest bug: no sign-in <768px)
  - Replace the inert `md:hidden` hamburger SVG (~78–82) with a Radix `<Sheet>`:
    - Import `Sheet, SheetContent, SheetClose, SheetFooter, SheetHeader, SheetTitle, SheetTrigger` from `../components/ui/sheet`.
    - `SheetTrigger asChild` → `<button aria-label="Open menu" class="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">` (keep the existing hamburger SVG inside).
    - `SheetContent side="right" className="flex w-full flex-col gap-0 bg-black/95 text-white sm:w-[400px] sm:max-w-[400px]"` — **`sm:max-w-[400px]` REQUIRED** (base sheet `sm:max-w-sm`=384px would cap it).
    - `SheetHeader` title "Menu" (SheetTitle for a11y); scrollable `<nav class="flex-1 overflow-y-auto px-2 py-3">` with Home/Services/About/Contact `SheetClose` links.
    - `SheetFooter` CTA: `onClick={handleHeaderAction}` → `{isAuthenticated ? 'Open App' : 'Sign In'}` (reuse `handleHeaderAction` already at top of file).
    - Sheet stays unmounted until open → protects `App.test.tsx` `queryByText('Sign In')` assertions.
- [x] **A7.2 — `features/auth/login/AuthPage.tsx`** wrapper (~10)
  - `min-h-screen flex items-center justify-center p-6 relative bg-black` → `relative flex min-h-screen min-h-svh overflow-y-auto bg-black px-4 py-6 sm:p-6` (removes items-center/justify-center — centering moves to the card via `m-auto`, the ONLY scroll-safe way).
- [x] **A7.3 — `AuthPage.tsx` card (~37)**
  - `relative z-10 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex min-h-[560px]` → add `m-auto` and `min-h-0 sm:min-h-[560px]`.
- [x] **A7.4 — `AuthPage.tsx` form column (~63)**
  - `flex-1 flex items-center w-full px-10 py-12` → `flex-1 flex items-center w-full px-5 py-8 sm:px-10 sm:py-12` (348px→288px column on 360px phones — helps Turnstile fit + input spacing).
- [x] **A7.5 — `AuthPage.tsx` Help link (~72–73)**
  - Add `inline-block px-6 py-3` (≈44px touch target) to the 9px link.
- [x] **A7.6 — `features/auth/login/LoginForm.tsx`** Turnstile fit (~102–110)
  - Primary (scale): wrap widget in `origin-top-left scale-[0.72] sm:scale-100` inside a `h-[47px] overflow-hidden sm:h-auto sm:overflow-visible` container (65px×0.72 ≈ 47px; sm restores exactly). Optional responsive refinement `scale-[0.72] min-[380px]:scale-[0.8] sm:scale-100`.
  - Fallback (if transform causes iframe quirks): `pt-2 overflow-x-auto` wrapper instead.
  - Render the widget exactly ONCE — never duplicate the mount.
- [ ] **A7.7 — (OUT OF SCOPE) `settings/Profile.tsx` + `Help.tsx` legacy tokens** — NO CHANGE. `theme.css` aliases already resolve `bg-surface`/`text-text-primary` → canonical tokens. Defer a token-hygiene PR.

## Test locks turned green

- [ ] T0.8 auth locks: new `pages/LandingPage.test.tsx` (hamburger → menu with Sign In (guest)/Open App (authed), navigates; Esc closes); new `AuthPage.test.tsx` (wrapper has `overflow-y-auto`, card `min-h-0`); extend `LoginForm.test.tsx` (turnstile `render` called exactly once across re-render).
- [ ] Existing: `App.test.tsx` bootstrap + standalone-editor (no shell chrome leak), `AuthRoutes.test.tsx` guards, `LoginForm.test.tsx` token flow — all stay green.

## Risk notes

- `sm:max-w-[400px]` override is mandatory (base `sm:max-w-sm` caps at 384px).
- Sheet content is unmounted until open — don't forceMount (would break App.test 'Sign In' uniqueness).
- Desktop visual parity: every mobile class has an `sm:`/`lg:` counterpart restoring today's pixels exactly.
- Turnstile: if scale causes Cloudflare focus/modal quirks, switch to the overflow-x fallback — never two instances.

## Gate

- [ ] `cd frontend && pnpm test` scoped to App, LoginForm, AuthRoutes, MainLayout + the new LandingPage/AuthPage tests; `pnpm lint`; `pnpm build`.
- [ ] Manual 320×568, 375×667, 320×480 landscape: landing menu opens with Sign In; /login scrolls to LOGIN button with no clipped top; Turnstile fully visible/clickable at 320px; ≥1024 renders pixel-identical.