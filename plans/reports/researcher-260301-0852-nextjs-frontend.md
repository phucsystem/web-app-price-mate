# Research Report: Next.js Frontend Tech Stack
**PriceMate AU Frontend Architecture**
**Date:** 2026-03-01
**Researcher:** claude-haiku-4-5

---

## Executive Summary

This report covers 5 critical technical topics for PriceMate AU frontend using Next.js App Router + Tamagui + TypeScript + Recharts. Research identifies concrete package names, setup patterns, gotchas, and best practices.

**Key Finding:** Use `@tamagui/next-plugin` with build-time compilation, SSR-safe Recharts via dynamic imports with `ssr: false`, httpOnly cookies for JWT storage, and feature-based folder structure with route groups.

---

## Topic 1: Next.js + Tamagui Integration

### Setup Overview

Tamagui with Next.js App Router requires:
- Build-time compilation via CLI (`@tamagui/cli`)
- Configuration files (tamagui.config.ts, tamagui.build.ts)
- TamaguiProvider + NextTamaguiProvider in root layout
- next.config.ts plugin integration

### Required Packages

| Package | Purpose |
|---------|---------|
| `@tamagui/cli` (dev) | Build-time CSS extraction & optimization |
| `@tamagui/config` (v5) | Default design tokens & themes |
| `@tamagui/next-plugin` | Next.js webpack integration |
| `@tamagui/next-theme` | SSR theme provider (light/dark) |
| `tamagui` | Core runtime library |
| `react-native` | Tamagui dependency (installs automatically) |
| `@tamagui/lucide-icons` (optional) | Icon library |

### Configuration Pattern

**Step 1: Create tamagui.config.ts**
```typescript
import { createTamagui, createTokens, createThemes } from 'tamagui'
import { config as tamaguiConfig } from '@tamagui/config/v5'

export const appConfig = createTamagui(tamaguiConfig)
```

**Step 2: Create tamagui.build.ts**
```typescript
import { createTamagui } from 'tamagui'
import { appConfig } from './tamagui.config'

const tamaguiBuild = createTamagui(appConfig)
export default tamaguiBuild
```

**Step 3: Update next.config.ts**
```typescript
import { withTamagui } from '@tamagui/next-plugin'

export default withTamagui({
  // transpile packages that use native modules
  transpilePackages: ['@tamagui/lucide-icons'],
  // Optional: configure bundle analyzer
  analyze: false,
})
```

### Root Layout Setup (app/layout.tsx)

```typescript
'use client'
import { TamaguiProvider } from 'tamagui'
import { NextTamaguiProvider } from '@tamagui/next-theme'
import { appConfig } from '../tamagui.config'
// Import generated CSS
import '../_generated/tamagui.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TamaguiProvider config={appConfig}>
          <NextTamaguiProvider>
            {children}
          </NextTamaguiProvider>
        </TamaguiProvider>
      </body>
    </html>
  )
}
```

### Build Process

Run: `tamagui build --target web ./src -- next build`

This:
- Optimizes Tamagui components before Next.js build
- Extracts CSS to `_generated/tamagui.css`
- Restores files after build

### Key Gotchas

1. **CSS Import Path:** CSS location depends on tamagui.build.ts output config. Verify path matches actual generated file.
2. **Transpile Array:** Must list packages using Tamagui's native modules or they won't compile properly.
3. **'use client' Directive:** Root layout must be client component to use TamaguiProvider.
4. **Dark Mode:** `@tamagui/next-theme` handles SSR theme state—don't use custom theme switching without it.

---

## Topic 2: Next.js App Router Project Structure

### Recommended Structure for PriceMate AU (10-screen app)

```
web-price-mate-au/
├── app/                          # Routes & layouts
│   ├── layout.tsx                # Root layout + TamaguiProvider
│   ├── page.tsx                  # / (landing)
│   ├── (auth)/                   # Auth routes (no URL prefix)
│   │   ├── login/page.tsx        # /login
│   │   ├── register/page.tsx     # /register
│   │   ├── reset-password/page.tsx
│   │   └── layout.tsx            # Auth-specific layout
│   ├── (app)/                    # Protected routes
│   │   ├── layout.tsx            # Sidebar + nav layout
│   │   ├── dashboard/page.tsx    # /dashboard
│   │   ├── tracked-items/page.tsx # /tracked-items
│   │   ├── product-search/page.tsx
│   │   ├── product/[asin]/page.tsx # Dynamic product page
│   │   └── _components/          # Private: app-layout components
│   ├── deals/page.tsx            # /deals (public, SSR)
│   ├── api/                      # API routes
│   │   ├── auth/route.ts         # Auth endpoints
│   │   ├── products/route.ts     # Product search
│   │   └── tracked-items/route.ts
│   └── _components/              # Private: shared components
│
├── components/                   # UI components (reusable)
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── product/
│   │   ├── product-card.tsx
│   │   ├── price-chart.tsx      # Recharts wrapper
│   │   └── deal-badge.tsx
│   ├── dashboard/
│   │   └── tracked-items-grid.tsx
│   └── _shared/                 # Truly shared UI primitives
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
│
├── lib/                         # Utilities (non-UI)
│   ├── api-client.ts            # Fetch wrapper
│   ├── auth.ts                  # Auth logic
│   ├── tokens.ts                # JWT handling
│   ├── constants.ts
│   └── utils.ts
│
├── hooks/                       # Custom hooks
│   ├── use-auth.ts              # Auth state
│   ├── use-product.ts           # Product API calls
│   └── use-price-history.ts
│
├── services/                    # Business logic layer
│   ├── product-service.ts       # Product operations
│   ├── tracked-items-service.ts
│   └── auth-service.ts
│
├── _types/                      # TypeScript types
│   ├── api.ts                   # API response types
│   ├── domain.ts                # Domain models
│   └── index.ts
│
├── tamagui.config.ts            # Tamagui config
├── tamagui.build.ts             # Tamagui build config
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Folder Organization Principles

**Route Groups:** Use `(auth)`, `(app)` to group routes without affecting URLs
- `/app/(auth)/login` → `/login`
- `/app/(app)/dashboard` → `/dashboard`
- Allows different layouts per section

**Private Folders:** Prefix with `_` to prevent routing
- `_components/` for components colocated with routes
- `_lib/` for utilities specific to a feature
- Files stay in git but aren't routable

**Separation of Concerns:**
- `app/` → Routes & page layouts only
- `components/` → Reusable UI components
- `lib/` → Pure functions, API clients, helpers
- `services/` → Business logic (CRUD, data transformation)
- `hooks/` → React state & effects

### Benefits for PriceMate AU

1. **Scalability:** 10+ screens fit cleanly without nesting hell
2. **Co-location:** Auth screens + components live together under `(auth)`
3. **SEO:** Public deals page at `app/deals/page.tsx` is auto-SSR
4. **Protected Routes:** `(app)` group easily wrapped by auth middleware
5. **Clear Boundaries:** Easy to identify what's public vs protected

### Gotcha: Avoid Over-Nesting

Don't do: `app/a/b/c/d/e/page.tsx` — makes refactoring hard.
Route groups + private folders flatten structure.

---

## Topic 3: Tamagui Theming & Design Tokens

### Design Token Architecture

Tamagui separates **Tokens** (CSS variables) from **Themes** (variable assignments).

**Tokens** = base values (defined once):
- Colors: `#000000`, `#FFFFFF`, `#3B82F6`
- Spacing: 4, 8, 12, 16, 24, 32
- Typography: font families, weights, sizes
- Radius: 0, 2, 4, 8, 16

**Themes** = token assignments per color scheme:
- Light theme: assign color tokens to light values
- Dark theme: assign color tokens to dark values

### Implementation Pattern

**Step 1: Create Design Tokens (tamagui.config.ts)**

From UI_SPEC, map design tokens to Tamagui's `createTokens`:

```typescript
import { createTokens, createThemes } from 'tamagui'

const tokens = createTokens({
  color: {
    // Primary brand colors
    primary100: '#EFF6FF',  // Light blue
    primary500: '#3B82F6',  // Main blue
    primary900: '#1E3A8A',  // Dark blue

    // Semantic colors
    green500: '#10B981',    // Success/good deal
    red500: '#EF4444',      // Alert/price drop
    gray200: '#E5E7EB',
    gray700: '#374151',
    gray900: '#111827',

    // Neutral
    white: '#FFFFFF',
    black: '#000000',
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    2xl: 32,
    3xl: 48,
  },
  size: {
    sm: 32,
    md: 48,
    lg: 64,
  },
  radius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
})

export default tokens
```

**Step 2: Create Themes (tamagui.config.ts continued)**

```typescript
const themes = createThemes({
  light: {
    // Map token refs to semantic names
    bg: tokens.color.white,
    text: tokens.color.gray900,
    border: tokens.color.gray200,
    primary: tokens.color.primary500,
    success: tokens.color.green500,
    error: tokens.color.red500,
  },
  dark: {
    bg: tokens.color.gray900,
    text: tokens.color.white,
    border: tokens.color.gray700,
    primary: tokens.color.primary500,
    success: tokens.color.green500,
    error: tokens.color.red500,
  },
})
```

**Step 3: Register with createTamagui**

```typescript
export const appConfig = createTamagui({
  tokens,
  themes,
  shorthands: {
    px: 'paddingHorizontal',
    py: 'paddingVertical',
  },
  settings: {
    allowedStyleValues: 'somewhat-strict',
    autocompleteSpecificTokens: 'only-when-asked',
  },
})
```

### Access Tokens in Components

```typescript
import { getTokens, XStack, Text } from 'tamagui'

export function ProductCard() {
  const tokens = getTokens()

  return (
    <XStack
      bg={tokens.bg}
      borderColor={tokens.border}
      borderWidth={1}
      p={tokens.space.md}
      borderRadius={tokens.radius.md}
    >
      <Text color={tokens.text}>Product Name</Text>
    </XStack>
  )
}
```

### Mapping UI_SPEC to Tokens

From UI_SPEC Design System:

| UI_SPEC Token | Tamagui Token | Value |
|---------------|---------------|-------|
| Primary | primary500 | #3B82F6 |
| Success/Deal Score Good | green500 | #10B981 |
| Alert/Price Drop | red500 | #EF4444 |
| Neutral Text | gray900 (light) / white (dark) | - |
| Card Background | bg (white/gray900) | - |
| Spacing Unit | space.md | 12px |

### Gotchas

1. **Token Nesting:** Tokens can't reference other tokens—use explicit values only.
2. **Theme Inheritance:** Dark theme doesn't auto-invert light theme—define both explicitly.
3. **Selector Specificity:** Use `getTokens()` in components, not CSS custom props directly.
4. **HEX Format:** Use lowercase `#abc123` for consistency with Tamagui tooling.

---

## Topic 4: Recharts Integration with Next.js

### SSR Problem & Solution

**Issue:** Recharts uses D3.js which requires browser DOM. Server-side rendering fails.

**Solution:** Dynamic import with `ssr: false` directive + `'use client'`

### Implementation Pattern

**Step 1: Create Client-Side Chart Component**

`components/product/price-chart.tsx`:
```typescript
'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PriceChartProps {
  data: Array<{ date: string; price: number }>
}

export function PriceChart({ data }: PriceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#3B82F6"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Step 2: Dynamic Import in Server Component**

`app/(app)/product/[asin]/page.tsx`:
```typescript
import dynamic from 'next/dynamic'

const PriceChart = dynamic(
  () => import('@/components/product/price-chart').then(mod => ({ default: mod.PriceChart })),
  {
    ssr: false,
    loading: () => <div>Loading chart...</div>
  }
)

export default async function ProductPage({ params }) {
  const priceHistory = await fetchPriceHistory(params.asin)

  return (
    <div>
      <h1>Product Details</h1>
      <PriceChart data={priceHistory} />
    </div>
  )
}
```

### Responsive Configuration

`ResponsiveContainer` auto-scales chart to parent width/height.

For manual control:

```typescript
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
    {/* ... */}
  </LineChart>
</ResponsiveContainer>
```

**Mobile Optimization:**
```typescript
'use client'
import { useMediaQuery } from 'tamagui'

export function PriceChart({ data }) {
  const isMobile = useMediaQuery('max-width: 768px')

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
      {/* ... */}
    </ResponsiveContainer>
  )
}
```

### Data Format for Price History

```typescript
interface PriceData {
  date: string          // ISO 8601 or "MMM DD"
  price: number         // AUD
}

// Example from API
const priceHistory = [
  { date: '2026-01-01', price: 299.99 },
  { date: '2026-01-08', price: 289.99 },
  { date: '2026-01-15', price: 279.99 },
]
```

### Recharts + Tamagui Integration

Use Tamagui tokens for colors:

```typescript
'use client'
import { getTokens } from 'tamagui'

export function PriceChart({ data }) {
  const tokens = getTokens()

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        {/* Use Tamagui color tokens */}
        <Line stroke={tokens.color.primary500} strokeWidth={2} />
        <Tooltip contentStyle={{
          backgroundColor: tokens.bg,
          color: tokens.text,
          borderColor: tokens.border
        }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Packages Required

```json
{
  "recharts": "^2.10.0",
  "react": "^19.0.0"
}
```

### Gotchas

1. **'use client' Required:** Recharts components must be in client components.
2. **Dynamic Import Syntax:** Use `.then(mod => ({ default: mod.ExportedFunction }))` not just the default export.
3. **Tooltip Props:** Pass CSS-in-JS objects to `contentStyle`, not className.
4. **Window/Document Access:** Safe in dynamic-imported components only.
5. **Legends:** Manually control legend positioning on mobile with conditional props.

---

## Topic 5: JWT Authentication in Next.js App Router

### Token Storage Strategy: httpOnly Cookies

**Why httpOnly over localStorage?**

| Method | XSS Safe | CSRF Safe | Notes |
|--------|----------|-----------|-------|
| httpOnly cookie | ✅ Yes | ⚠️ Needs SameSite | Inaccessible to JS; best practice |
| localStorage | ❌ No | ✅ Yes | Vulnerable to XSS attacks |
| sessionStorage | ❌ No | ✅ Yes | Cleared on tab close |

**Recommendation:** Use httpOnly cookies for JWT, SameSite=Lax for CSRF protection.

### Implementation Pattern

**Step 1: Backend Sets httpOnly Cookie**

After login (backend .NET API):
```
Set-Cookie: authToken=<JWT>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
Set-Cookie: refreshToken=<REFRESH>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

**Step 2: Create Auth Middleware (middleware.ts)**

For App Router middleware, use `jose` (not `jsonwebtoken` which fails on Edge Runtime):

```typescript
import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value

  if (!token) {
    return null
  }

  try {
    const verified = await jwtVerify(token, secret)
    return verified.payload as any
  } catch (err) {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Routes that don't need auth
  const publicRoutes = ['/', '/login', '/register', '/deals']
  const isPublic = publicRoutes.includes(pathname)

  if (isPublic) {
    return NextResponse.next()
  }

  // Protected routes
  const payload = await verifyAuth(request)

  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Attach user to request for server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.sub)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next|favicon).*)'],
}
```

**Step 3: Login API Route (app/api/auth/login/route.ts)**

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  // Validate credentials against backend
  const response = await fetch(`${process.env.API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }

  const { accessToken, refreshToken } = await response.json()

  // Create response
  const res = NextResponse.json(
    { success: true },
    { status: 200 }
  )

  // Set httpOnly cookies
  res.cookies.set('authToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600, // 1 hour
    path: '/',
  })

  res.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 604800, // 7 days
    path: '/',
  })

  return res
}
```

**Step 4: Refresh Token Endpoint (app/api/auth/refresh/route.ts)**

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'No refresh token' },
      { status: 401 }
    )
  }

  try {
    // Call backend refresh endpoint
    const response = await fetch(`${process.env.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Refresh failed')
    }

    const { accessToken } = await response.json()

    const res = NextResponse.json({ success: true })
    res.cookies.set('authToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    })

    return res
  } catch (err) {
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 401 }
    )
  }
}
```

**Step 5: Use Auth in Components**

Client hook (`hooks/use-auth.ts`):
```typescript
'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function useAuth() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if authToken cookie exists
    // Note: can't read httpOnly cookies from client; rely on middleware
    // This is just for UI state
    setIsAuthenticated(true) // Set via server action or initial render
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return { isAuthenticated, logout }
}
```

Server-side check (in layout or page):
```typescript
export default async function DashboardLayout({ children }) {
  const userId = headers().get('x-user-id')

  if (!userId) {
    redirect('/login')
  }

  return <>{children}</>
}
```

### Logout Implementation

```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })

  res.cookies.delete('authToken')
  res.cookies.delete('refreshToken')

  return res
}
```

### Environment Variables Required

```bash
JWT_SECRET=your-secret-key-min-32-chars
API_BASE_URL=https://api.pricemate.com.au
```

### Gotchas

1. **jose vs jsonwebtoken:** Use `jose` in Edge/middleware, not `jsonwebtoken` (causes runtime errors).
2. **Cookie Domain:** Don't set domain in middleware—let browser infer from request.
3. **Secure Flag:** Only `secure: true` in production HTTPS.
4. **SameSite=Strict:** Too strict; use Lax for third-party embeds.
5. **CORS:** httpOnly cookies require explicit CORS headers if backend ≠ frontend domain.
6. **Token Expiry:** Short access token (1h) + long refresh token (7d) pattern.
7. **Middleware Path:** Exclude `/api` routes to avoid infinite refresh loops.

---

## Cross-Topic Integrations

### 1. Recharts + Tamagui Theming

Use Tamagui color tokens in Recharts:

```typescript
const tokens = getTokens()

<LineChart data={data} style={{ backgroundColor: tokens.bg }}>
  <Line stroke={tokens.color.primary500} />
  <Tooltip contentStyle={{ backgroundColor: tokens.bg, color: tokens.text }} />
</LineChart>
```

### 2. Protected Routes with Tamagui Layout

Middleware protects `/app/*` routes, which share `(app)/layout.tsx`:

```typescript
// app/(app)/layout.tsx
'use client'
import { TamaguiProvider } from 'tamagui'
import { SideBar, Header } from '@/components'

export default function AppLayout({ children }) {
  return (
    <TamaguiProvider>
      <XStack flex={1}>
        <SideBar />
        <YStack flex={1}>
          <Header />
          {children}
        </YStack>
      </XStack>
    </TamaguiProvider>
  )
}
```

### 3. API Calls with Auth

Client components using `fetch` automatically include cookies:

```typescript
'use client'
export async function getTrackedItems() {
  const response = await fetch('/api/tracked-items', {
    method: 'GET',
    credentials: 'include', // Auto-send httpOnly cookies
  })
  return response.json()
}
```

---

## Summary Table

| Topic | Key Package | Key Pattern | Gotcha |
|-------|-------------|------------|--------|
| **Tamagui + Next.js** | `@tamagui/next-plugin` | Build-time CLI + TamaguiProvider in layout | CSS path must match build output |
| **Folder Structure** | — | Route groups + private folders | Avoid deep nesting; use route groups |
| **Theming** | `createTokens`, `createThemes` | Define once, assign per theme | Tokens can't reference other tokens |
| **Recharts** | `dynamic()` with `ssr: false` | Client component + dynamic import | Must use 'use client' directive |
| **JWT Auth** | `jose` (not jsonwebtoken) | httpOnly cookies + middleware | Don't use jsonwebtoken in Edge Runtime |

---

## Unresolved Questions

1. **SEO Meta Tags:** How to set dynamic meta tags (product title, price) for product detail pages? (Likely via `generateMetadata()` in App Router).
2. **Infinite Scroll:** Tamagui + IntersectionObserver pattern for cursor-based pagination? (Search/deals pages per SRD).
3. **Email Alert Notifications:** Will alerts be real-time via WebSocket or polling? (Affects client state management choice).
4. **Image Optimization:** Next.js `<Image>` component with Amazon product images? (CORS, CDN strategy).
5. **State Management:** Redux/Zustand/TanStack Query choice for dashboard + tracked items state not covered in this research.

---

## Sources

- [Tamagui Next.js Guide](https://tamagui.dev/docs/guides/next-js)
- [Tamagui Installation](https://tamagui.dev/docs/intro/installation)
- [Tamagui Tokens Documentation](https://tamagui.dev/docs/core/tokens)
- [Tamagui Themes Documentation](https://tamagui.dev/docs/intro/themes)
- [Next.js App Router Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Recharts + Next.js Integration Guide](https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html)
- [Next.js JWT Authentication with httpOnly Cookies](https://maxschmitt.me/posts/next-js-http-only-cookie-auth-tokens)
- [Next.js Middleware & JWT Verification](https://dev.to/leapcell/implementing-jwt-middleware-in-nextjs-a-complete-guide-to-auth-1b2d)
- [Complete Authentication Guide for Next.js App Router 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)
