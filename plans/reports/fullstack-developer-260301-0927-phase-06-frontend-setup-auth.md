# Phase Implementation Report

## Executed Phase
- Phase: phase-06-frontend-setup-auth
- Plan: /Users/phuc/Code/02-web/web-price-mate-au/plans/260301-0852-full-mvp-implementation/
- Status: completed

## Files Modified
| File | Action | Notes |
|------|--------|-------|
| `frontend/app/globals.css` | modified | Tailwind v4 @theme block with full UI_SPEC design tokens |
| `frontend/app/layout.tsx` | modified | Providers wrapper, meta tags, viewport |
| `frontend/app/providers.tsx` | created | QueryClientProvider client wrapper |
| `frontend/proxy.ts` | created | JWT proxy (Next.js 16 uses `proxy.ts` + `export proxy()`) |
| `frontend/lib/query-client.ts` | created | QueryClient factory |
| `frontend/lib/api-client.ts` | created | fetch wrapper with 401 auto-refresh |
| `frontend/lib/constants.ts` | created | API_BASE_URL, COOKIE_NAMES, ROUTES, TOKEN_MAX_AGE |
| `frontend/hooks/use-auth.ts` | created | login/register/logout, user state |
| `frontend/_types/domain.ts` | created | User, Product, TrackedProduct, PriceHistory types |
| `frontend/_types/api.ts` | created | ApiResponse, PaginationMeta, ApiError, AuthTokens |
| `frontend/app/api/auth/login/route.ts` | created | proxy to backend, set httpOnly cookies |
| `frontend/app/api/auth/register/route.ts` | created | proxy to backend, set httpOnly cookies |
| `frontend/app/api/auth/refresh/route.ts` | created | refresh token proxy, rotate cookies |
| `frontend/app/api/auth/logout/route.ts` | created | clear cookies, best-effort backend notify |
| `frontend/app/(auth)/layout.tsx` | created | centered card layout for auth pages |
| `frontend/app/(auth)/login/page.tsx` | created | S-03 login page |
| `frontend/app/(auth)/register/page.tsx` | created | S-02 register page |
| `frontend/app/(auth)/reset-password/page.tsx` | created | S-04 reset password, reads token from searchParams |
| `frontend/app/(app)/layout.tsx` | created | protected layout with NavBar |
| `frontend/components/auth/login-form.tsx` | created | TanStack Form, email+password, inline validation |
| `frontend/components/auth/register-form.tsx` | created | TanStack Form, displayName+email+password+confirm |
| `frontend/components/auth/reset-password-form.tsx` | created | two-step: request email / set new password |
| `frontend/components/shared/nav-bar.tsx` | created | logo+search+auth, responsive hamburger menu |
| `frontend/components/shared/auth-guard.tsx` | created | client-side session check with spinner |

## Tasks Completed
- [x] Tailwind v4 design tokens via @theme CSS block (not tailwind.config.ts — v4 is CSS-based)
- [x] QueryClient + Providers (QueryClientProvider wrapping app)
- [x] Root layout updated with Providers, proper metadata, viewport
- [x] Auth proxy — Next.js 16 renamed middleware.ts to proxy.ts, export name is `proxy` not `middleware`
- [x] 4 API route handlers with httpOnly cookie management
- [x] Login, Register, Reset Password pages with TanStack Form validation
- [x] NavBar: logo left, search center, auth buttons right, mobile hamburger
- [x] AuthGuard component
- [x] useAuth hook (login/register/logout)
- [x] API client with auto-refresh on 401
- [x] TypeScript types for domain and API

## Tests Status
- Type check: pass (TypeScript compiled successfully)
- Build: pass (`npm run build` exits 0, 11 pages generated)
- Unit tests: n/a (not requested)

## Key Discoveries / Deviations
1. **Tailwind v4**: Uses CSS @theme block in globals.css, not tailwind.config.ts. Design tokens mapped as CSS custom properties.
2. **Next.js 16**: Renamed `middleware.ts` → `proxy.ts`, export `middleware()` → `proxy()`. Build fails with old convention.
3. **@tailwindcss/forms + @tailwindcss/typography**: Loaded via `@plugin` directive in CSS (v4 way), not in config.
4. **searchParams in Next.js 15+**: Must be awaited as `Promise<{...}>` in async server components.

## Issues Encountered
- None after fixing Next.js 16 proxy convention.

## Next Steps
- Phase 7 (dashboard/track pages) can now import NavBar, useAuth, apiClient
- Backend must return `{ data: { accessToken, refreshToken, user } }` shape for cookie routes to work
- Set `JWT_SECRET` and `API_BASE_URL` in `.env.local` before running dev
