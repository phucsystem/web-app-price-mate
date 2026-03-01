# Phase 7: Frontend -- Core Screens

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 12h
- **Description:** Landing page (S-01), Search Results (S-05), Add Product URL (S-06), Product Detail (S-07), Dashboard (S-08). All data fetching via TanStack Query; styling via Tailwind CSS.

## Key Insights
- `useInfiniteQuery` for cursor-paginated lists (S-05 search, S-08 dashboard)
- `useSuspenseQuery` for product detail data (S-07) -- enables Suspense boundaries
- `TanStack Form` for alert form (S-07) and URL input (S-06)
- Recharts dynamically imported with `ssr: false` (browser-only D3)
- Product cards shared across S-05, S-08, S-10 -- build once as reusable component
- Dashboard: summary bar + sparklines (mini chart per card)
- Price chart on S-07: LineChart with time range selector (30d/90d/180d/1y/all)

## Related Code Files

### Pages
| File | Action |
|------|--------|
| `frontend/app/page.tsx` | modify -- S-01 Landing Page |
| `frontend/app/search/page.tsx` | create -- S-05 Search Results |
| `frontend/app/(app)/track/page.tsx` | create -- S-06 Add Product URL |
| `frontend/app/product/[asin]/page.tsx` | create -- S-07 Product Detail |
| `frontend/app/(app)/dashboard/page.tsx` | create -- S-08 Dashboard |

### Components
| File | Action |
|------|--------|
| `frontend/components/product/product-card.tsx` | create |
| `frontend/components/product/price-chart.tsx` | create |
| `frontend/components/product/deal-badge.tsx` | create |
| `frontend/components/product/sparkline-chart.tsx` | create |
| `frontend/components/product/alert-form.tsx` | create -- TanStack Form |
| `frontend/components/shared/search-bar.tsx` | create |
| `frontend/components/shared/infinite-scroll.tsx` | create |
| `frontend/components/landing/hero-section.tsx` | create |
| `frontend/components/landing/how-it-works.tsx` | create |
| `frontend/components/landing/deals-preview.tsx` | create |
| `frontend/components/dashboard/summary-bar.tsx` | create |
| `frontend/components/dashboard/tracked-item-card.tsx` | create |

### Hooks
| File | Action |
|------|--------|
| `frontend/hooks/use-product-search.ts` | create -- wraps useInfiniteQuery |
| `frontend/hooks/use-price-history.ts` | create -- wraps useSuspenseQuery |
| `frontend/hooks/use-dashboard.ts` | create -- wraps useInfiniteQuery |

### Services
| File | Action |
|------|--------|
| `frontend/services/product-service.ts` | create |
| `frontend/services/tracked-items-service.ts` | create |

## Implementation Steps

### 1. Shared Components (Tailwind)

**ProductCard**
```typescript
// Props: product, showTrackBtn?, showDealBadge?, showSparkline?, onTrack?
// Layout: Image left, info right (title, price, deal badge), optional sparkline bottom
export function ProductCard({ product, showTrackBtn, showDealBadge, onTrack }: ProductCardProps) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-white p-3 shadow-sm
                    hover:shadow-md transition-shadow">
      <img src={product.imageUrl} alt={product.title}
           className="h-24 w-24 rounded-sm object-contain" />
      <div className="flex flex-1 flex-col justify-between">
        <h3 className="text-sm font-semibold text-text line-clamp-2">{product.title}</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold text-text">${product.currentPrice}</span>
          {showDealBadge && product.dealScore && <DealBadge score={product.dealScore} />}
        </div>
        {showTrackBtn && <button onClick={onTrack} className="...">Track</button>}
      </div>
    </div>
  )
}
```

**DealBadge**
```typescript
// Colors: great -> bg-success, good -> bg-primary, average -> bg-warning
// Pill shape: rounded-full px-2 py-0.5 text-xs font-semibold text-white
```

**SearchBar** -- `flex items-center gap-2` with input + submit button; submits via `router.push`

**InfiniteScroll** -- IntersectionObserver on sentinel div; shows spinner or "No more results"

### 2. TanStack Query Hooks

**useProductSearch (useInfiniteQuery)**
```typescript
'use client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { searchProducts } from '@/services/product-service'

export function useProductSearch(query: string) {
  return useInfiniteQuery({
    queryKey: ['products', 'search', query],
    queryFn: ({ pageParam }) => searchProducts(query, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.hasMore ? lastPage.meta.cursor : undefined,
    enabled: !!query,
  })
}
```

**usePriceHistory (useSuspenseQuery)**
```typescript
import { useSuspenseQuery } from '@tanstack/react-query'

export function usePriceHistory(asin: string, range: string) {
  return useSuspenseQuery({
    queryKey: ['priceHistory', asin, range],
    queryFn: () => fetchPriceHistory(asin, range),
  })
}
```

**useDashboard (useInfiniteQuery)**
```typescript
export function useDashboard(sort: string) {
  return useInfiniteQuery({
    queryKey: ['dashboard', sort],
    queryFn: ({ pageParam }) => fetchTrackedItems(pageParam, sort),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.hasMore ? lastPage.meta.cursor : undefined,
  })
}
```

### 3. PriceChart (Recharts, client-only)
```typescript
'use client'
import dynamic from 'next/dynamic'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function PriceChart({ data, height = 300 }: PriceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Line type="monotone" dataKey="price" stroke="#1976D2" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Dynamic import in product page:**
```typescript
const PriceChart = dynamic(
  () => import('@/components/product/price-chart').then(mod => ({ default: mod.PriceChart })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-gray-2 rounded-md" /> }
)
```

**SparklineChart** -- mini version (50px height, no axes/tooltip) for dashboard cards

### 4. S-01 Landing Page
- **Hero**: headline, subtitle, SearchBar CTA; Tailwind `text-4xl font-bold text-brand-navy`
- **How It Works**: 3-step cards (Search, Track, Save) with Lucide icons; `grid grid-cols-1 md:grid-cols-3 gap-6`
- **Deals Preview**: server-side fetch top 4 deals, render as ProductCards
- Server component for SEO; deals preview via server-side fetch

### 5. S-05 Search Results
- `useProductSearch(query)` hook with `useInfiniteQuery`
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Each result: ProductCard with showTrackBtn + showDealBadge
- `fetchNextPage` triggered by InfiniteScroll sentinel
- "Track" click: logged in -> POST track -> toast; guest -> redirect login
- Empty state: "No products found" with suggestions

### 6. S-06 Add Product URL (TanStack Form)
```typescript
'use client'
import { useForm } from '@tanstack/react-form'

export default function TrackPage() {
  const form = useForm({
    defaultValues: { url: '', targetPrice: '' },
    onSubmit: async ({ value }) => {
      await apiClient('/api/products/track-url', {
        method: 'POST', body: JSON.stringify({ url: value.url, targetPrice: Number(value.targetPrice) || null }),
      })
      router.push(`/product/${extractedAsin}`)
    },
  })
  // URL input -> "Fetch Product" -> preview card -> target price input -> "Start Tracking"
}
```

### 7. S-07 Product Detail
- `/product/[asin]` -- public route, server component for SSR
- Server fetch product data; client `usePriceHistory` with Suspense boundary
- Layout: image + title + price (large `font-mono text-2xl font-bold`) + DealBadge
- "View on Amazon AU" affiliate link with disclosure
- PriceChart with time range tabs (`flex gap-2` tab buttons)
- Stats row: 3 cards (Lowest, Highest, Average) in `grid grid-cols-3 gap-4`
- Alert section: logged in -> AlertForm (TanStack Form); guest -> "Sign in to set alerts"
- Price history table (collapsible, last 10 entries)

### 8. AlertForm (TanStack Form)
```typescript
'use client'
import { useForm } from '@tanstack/react-form'

export function AlertForm({ currentPrice, trackedItem, onSave }: AlertFormProps) {
  const form = useForm({
    defaultValues: { targetPrice: trackedItem?.targetPrice?.toString() ?? '' },
    onSubmit: async ({ value }) => {
      await onSave(Number(value.targetPrice))
    },
  })
  // Number input with "$" prefix; validates > 0 and < currentPrice
}
```

### 9. S-08 Dashboard
- `useDashboard(sort)` with `useInfiniteQuery`
- SummaryBar: 3 stat cards (`grid grid-cols-3 gap-4`)
- Sort/Filter: dropdown with Tailwind select styling
- Grid: TrackedItemCards with sparklines; infinite scroll
- Empty state: "No tracked items yet" + links
- Floating "+" button -> `/track`
- "Remove" action -> confirmation -> DELETE -> invalidate query

## Todo List
- [x] ProductCard shared component (Tailwind)
- [x] DealBadge component
- [x] SearchBar component
- [x] InfiniteScroll component (IntersectionObserver)
- [x] useProductSearch hook (useInfiniteQuery)
- [x] usePriceHistory hook (useSuspenseQuery)
- [x] useDashboard hook (useInfiniteQuery)
- [x] PriceChart (Recharts, dynamic import)
- [x] SparklineChart (mini version)
- [x] AlertForm component (TanStack Form)
- [x] S-01 Landing Page (hero, how-it-works, deals preview)
- [x] S-05 Search Results (grid, infinite scroll, track)
- [x] S-06 Add Product URL (TanStack Form, preview, track)
- [x] S-07 Product Detail (chart, stats, alert, history)
- [x] S-08 Dashboard (summary, grid, sparklines, remove)
- [x] Product service + tracked items service
- [x] Responsive layouts (mobile/tablet/desktop)

## Success Criteria
- Landing page renders hero + deals preview server-side
- Search returns results; infinite scroll loads next pages via TanStack Query
- Product detail shows price chart with correct data
- Time range selector re-fetches chart data via query key change
- Dashboard shows tracked items with accurate summary counts
- Alert form saves/updates target price with validation
- Track button works for logged-in users
- All pages responsive across breakpoints
- Recharts renders without SSR errors (dynamic import)
- TanStack Query caches prevent redundant API calls

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Recharts SSR crash | High | Dynamic import with `ssr: false`; fallback skeleton |
| useInfiniteQuery page deduplication | Medium | Correct `getNextPageParam`; cursor-based pagination |
| Suspense boundary hydration | Medium | Use `useSuspenseQuery` only in client components with Suspense wrapper |
| Large product image payloads | Low | Next.js Image component with sizes + priority props |
