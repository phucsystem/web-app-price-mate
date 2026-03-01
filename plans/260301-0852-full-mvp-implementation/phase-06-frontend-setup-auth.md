# Phase 6: Frontend -- Setup, Auth & Layout

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 8h
- **Description:** Tailwind CSS config with design tokens, TanStack Query/Form setup, auth pages (register, login, password reset), NavBar, JWT middleware, httpOnly cookie auth flow

## Key Insights
- Tailwind `theme.extend` maps UI_SPEC design tokens (colors, spacing, radius, shadows, fonts)
- `@tanstack/react-query` provides `QueryClientProvider` at root; all data fetching uses query hooks
- `@tanstack/react-form` handles auth forms with built-in validation (no extra form lib)
- `jose` library for JWT verification in Next.js middleware (Edge Runtime compatible)
- Auth flow: Next.js API routes proxy to .NET backend, set httpOnly cookies
- Route groups: `(auth)` for login/register, `(app)` for protected routes

## Related Code Files

| File | Action |
|------|--------|
| `frontend/tailwind.config.ts` | modify -- custom theme with UI_SPEC tokens |
| `frontend/app/globals.css` | modify -- Tailwind directives + custom CSS vars |
| `frontend/app/layout.tsx` | modify -- QueryClientProvider + fonts |
| `frontend/app/providers.tsx` | create -- client wrapper (QueryClientProvider) |
| `frontend/app/(auth)/layout.tsx` | create |
| `frontend/app/(auth)/login/page.tsx` | create -- S-03 |
| `frontend/app/(auth)/register/page.tsx` | create -- S-02 |
| `frontend/app/(auth)/reset-password/page.tsx` | create -- S-04 |
| `frontend/app/(app)/layout.tsx` | create -- protected layout with NavBar |
| `frontend/app/api/auth/login/route.ts` | create -- proxy + set cookies |
| `frontend/app/api/auth/register/route.ts` | create -- proxy + set cookies |
| `frontend/app/api/auth/refresh/route.ts` | create -- refresh proxy |
| `frontend/app/api/auth/logout/route.ts` | create -- clear cookies |
| `frontend/middleware.ts` | create -- JWT verification |
| `frontend/components/shared/nav-bar.tsx` | create |
| `frontend/components/auth/login-form.tsx` | create -- TanStack Form |
| `frontend/components/auth/register-form.tsx` | create -- TanStack Form |
| `frontend/components/auth/reset-password-form.tsx` | create -- TanStack Form |
| `frontend/components/shared/auth-guard.tsx` | create |
| `frontend/lib/api-client.ts` | create -- fetch wrapper |
| `frontend/lib/query-client.ts` | create -- TanStack Query config |
| `frontend/lib/constants.ts` | create |
| `frontend/hooks/use-auth.ts` | create |
| `frontend/_types/api.ts` | create |
| `frontend/_types/domain.ts` | create |

## Implementation Steps

### 1. Install Packages
```bash
cd frontend
npm install @tanstack/react-query @tanstack/react-form jose recharts
npm install -D @tailwindcss/forms @tailwindcss/typography
```

### 2. Tailwind Config with UI_SPEC Design Tokens
```typescript
// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { blue: '#1976D2', navy: '#1B365D', green: '#4CAF50', success: '#388E3C', orange: '#F9A825' },
        primary: { DEFAULT: '#1976D2', light: '#42A5F5', dark: '#1565C0', bg: '#E3F2FD' },
        success: '#388E3C', warning: '#F9A825', error: '#D32F2F', info: '#0288D1',
        surface: { DEFAULT: '#FFFFFF', soft: '#F5F5F5' },
        border: '#E0E0E0',
        text: { DEFAULT: '#212121', soft: '#757575' },
        gray: {
          1: '#FAFAFA', 2: '#F5F5F5', 3: '#EEEEEE', 4: '#E0E0E0', 5: '#BDBDBD',
          6: '#9E9E9E', 7: '#757575', 8: '#616161', 9: '#424242', 10: '#212121',
        },
      },
      fontFamily: {
        heading: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Roboto', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Roboto Mono', 'monospace'],
      },
      spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px' },
      borderRadius: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.12)', md: '0 4px 12px rgba(0,0,0,0.12)',
        lg: '0 8px 24px rgba(0,0,0,0.12)', xl: '0 16px 48px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
export default config
```

### 3. QueryClient + Providers
```typescript
// frontend/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, retry: 1 },
    },
  })
}

// frontend/app/providers.tsx
'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

### 4. Root Layout
```typescript
// frontend/app/layout.tsx -- wraps app with Providers
// Includes font loading (Inter/system), viewport meta, Providers wrapper
```

### 5. Auth Middleware (middleware.ts)
```typescript
import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const protectedRoutes = ['/dashboard', '/track']
const authRoutes = ['/login', '/register', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('authToken')?.value

  if (authRoutes.some(route => pathname.startsWith(route)) && token) {
    try {
      await jwtVerify(token, secret)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch { /* token invalid, let them stay */ }
  }

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    try {
      const { payload } = await jwtVerify(token, secret)
      const headers = new Headers(request.headers)
      headers.set('x-user-id', payload.sub as string)
      return NextResponse.next({ request: { headers } })
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!api|_next|favicon|.*\\..*).*)'] }
```

### 6. API Route Proxies (set httpOnly cookies)
```typescript
// frontend/app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const response = await fetch(`${process.env.API_BASE_URL}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) return NextResponse.json(await response.json(), { status: response.status })
  const { data } = await response.json()
  const res = NextResponse.json({ data: { user: data.user } })
  res.cookies.set('authToken', data.accessToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 900, path: '/',
  })
  res.cookies.set('refreshToken', data.refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 604800, path: '/',
  })
  return res
}
```

### 7. API Client (fetch wrapper)
```typescript
// frontend/lib/api-client.ts
export async function apiClient<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, credentials: 'include' })
  if (response.status === 401) {
    const refreshResult = await fetch('/api/auth/refresh', { method: 'POST' })
    if (refreshResult.ok) {
      const retryResponse = await fetch(url, { ...options, credentials: 'include' })
      if (retryResponse.ok) return retryResponse.json()
    }
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}
```

### 8. Auth Forms with TanStack Form
```typescript
// frontend/components/auth/login-form.tsx
'use client'
import { useForm } from '@tanstack/react-form'

export function LoginForm() {
  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      })
      if (!res.ok) { /* set error state */ return }
      window.location.href = '/dashboard'
    },
  })

  return (
    <form onSubmit={(event) => { event.preventDefault(); form.handleSubmit() }}
          className="space-y-4 w-full max-w-sm">
      <form.Field name="email"
        validators={{ onChange: ({ value }) => !value.includes('@') ? 'Valid email required' : undefined }}
        children={(field) => (
          <div>
            <label className="block text-sm font-medium text-text">Email</label>
            <input type="email" value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              className="mt-1 block w-full rounded-sm border-border px-3 py-2 text-text
                         focus:border-primary focus:ring-primary" />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-sm text-error">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      />
      {/* Password field follows same pattern */}
      <button type="submit" className="w-full rounded-sm bg-primary px-4 py-2 text-white
                                        font-medium hover:bg-primary-dark transition-colors">
        Sign In
      </button>
    </form>
  )
}
```

Register form adds `displayName` + `confirmPassword` fields. Reset password form uses two-step flow (email input then new password via URL token).

### 9. NavBar Component
- Logo (left), SearchBar (center, S-01/S-05), Auth buttons or user menu (right)
- Responsive: hamburger menu on mobile (`md:hidden` / `hidden md:flex`)
- Tailwind classes for layout: `flex items-center justify-between h-14 px-4`
- Search bar submits to `/search?q=`

### 10. useAuth Hook
```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const login = async (email: string, password: string) => { ... }
  const register = async (data: RegisterData) => { ... }
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); redirect('/') }
  return { user, loading, login, register, logout }
}
```

### 11. TypeScript Types
```typescript
// frontend/_types/domain.ts
export interface User { id: string; email: string; displayName: string }
export interface Product { asin: string; title: string; imageUrl: string; currentPrice: number; /* ... */ }

// frontend/_types/api.ts
export interface ApiResponse<T> { data: T; meta?: PaginationMeta }
export interface PaginationMeta { cursor: string | null; hasMore: boolean }
```

## Todo List
- [x] Install Tailwind plugins + TanStack Query/Form + jose + recharts
- [x] Tailwind config with full UI_SPEC design tokens (via globals.css @theme block — Tailwind v4)
- [x] QueryClient config + Providers component
- [x] Root layout with Providers + font loading
- [x] Auth proxy (jose JWT verification) — proxy.ts (Next.js 16 convention)
- [x] 4 API route proxies (login, register, refresh, logout)
- [x] Login page (S-03) with TanStack Form + validation
- [x] Register page (S-02) with TanStack Form + validation
- [x] Reset Password page (S-04) two-step flow
- [x] NavBar shared component (responsive, Tailwind)
- [x] AuthGuard component for protected layouts
- [x] useAuth hook
- [x] API client with auto-refresh
- [x] TypeScript types for domain + API

## Success Criteria
- Tailwind renders correct brand colors from UI_SPEC design tokens
- Register flow: form -> API -> set cookies -> redirect to dashboard
- Login flow: form -> API -> set cookies -> redirect to dashboard
- Logout clears cookies, redirects to landing
- Protected routes redirect to login when unauthenticated
- Auth routes redirect to dashboard when already logged in
- NavBar displays correctly on mobile + desktop
- API client auto-refreshes expired tokens
- TanStack Form validation shows inline errors

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Tailwind class conflicts with third-party | Low | Use `tw-` prefix if needed; Tailwind v4 layers |
| TanStack Form learning curve | Low | Simple forms; follow official examples |
| jose edge runtime issues | Low | jose is designed for Edge; well-tested |
| Cookie not sent cross-origin | High | Same origin in dev; configure CORS + SameSite for prod |
