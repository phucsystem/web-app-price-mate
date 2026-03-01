# Phase 8: Frontend -- Discovery & SEO

## Overview
- **Priority:** P2
- **Status:** completed
- **Effort:** 6h
- **Description:** Browse Categories (S-09), Public Deals (S-10), SEO metadata, JSON-LD structured data. TanStack Query for data fetching; Tailwind CSS styling; SSR for SEO pages.

## Key Insights
- Deals page (S-10) must be SSR for SEO -- first page server-rendered, subsequent client-loaded
- `useInfiniteQuery` for deals page infinite scroll (client portion)
- `generateMetadata` for dynamic product + category pages (title, description, OG image)
- Category page reuses ProductCard grid from Phase 7
- S-10 is primary organic traffic driver -- good meta tags critical
- ISR (Incremental Static Regeneration) via `next: { revalidate }` for public pages

## Related Code Files

### Pages
| File | Action |
|------|--------|
| `frontend/app/categories/page.tsx` | create -- S-09 |
| `frontend/app/categories/[slug]/page.tsx` | create -- category products |
| `frontend/app/deals/page.tsx` | create -- S-10 SSR + client hydration |
| `frontend/app/product/[asin]/page.tsx` | modify -- add generateMetadata |

### Components
| File | Action |
|------|--------|
| `frontend/components/categories/category-card.tsx` | create |
| `frontend/components/deals/deals-grid.tsx` | create -- client, useInfiniteQuery |
| `frontend/components/deals/deal-filters.tsx` | create |

### Hooks
| File | Action |
|------|--------|
| `frontend/hooks/use-deals.ts` | create -- wraps useInfiniteQuery |

### Services
| File | Action |
|------|--------|
| `frontend/services/category-service.ts` | create |
| `frontend/services/deal-service.ts` | create |

## Implementation Steps

### 1. S-09 Browse Categories
- **Route:** `/categories` (public, server component)
- Server fetch `GET /api/categories` with `{ next: { revalidate: 3600 } }`
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

**CategoryCard:**
```typescript
export function CategoryCard({ name, slug, productCount }: CategoryCardProps) {
  return (
    <Link href={`/categories/${slug}`}
          className="flex flex-col items-center gap-2 rounded-md border border-border
                     bg-white p-6 shadow-sm hover:shadow-md transition-shadow text-center">
      <h3 className="text-lg font-semibold text-text">{name}</h3>
      <span className="text-sm text-text-soft">{productCount} products</span>
    </Link>
  )
}
```

### 2. Category Products Page
- **Route:** `/categories/[slug]` (server component + client infinite scroll)
- Server fetches category info + first page; passes to client grid component
- Reuses ProductCard from Phase 7
- Sort dropdown: price_drop, price_asc, price_desc
- Breadcrumb: `Categories > {name}`

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await fetchCategory(params.slug)
  return {
    title: `${category.name} Deals | PriceMate AU`,
    description: `Track prices for ${category.productCount} ${category.name} products on Amazon AU`,
  }
}
```

### 3. S-10 Public Deals Page (SSR + Client Hydration)

**Server component (SSR first page):**
```typescript
// frontend/app/deals/page.tsx
export default async function DealsPage({ searchParams }: Props) {
  const initialDeals = await fetchDeals({ limit: 20, sort: searchParams.sort || 'drop_pct' })
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-brand-navy mb-6">Today's Best Amazon AU Deals</h1>
      <DealFilters />
      <DealsGrid initialData={initialDeals} sort={searchParams.sort || 'drop_pct'} />
      <JsonLd deals={initialDeals.data} />
    </main>
  )
}

export const metadata: Metadata = {
  title: "Today's Best Amazon AU Deals | PriceMate AU",
  description: 'Discover the biggest price drops on Amazon Australia. Updated every 5 hours.',
  openGraph: { title: "Today's Best Amazon AU Deals", description: '...', type: 'website' },
}
```

**Client grid with useInfiniteQuery:**
```typescript
// frontend/components/deals/deals-grid.tsx
'use client'
import { useInfiniteQuery } from '@tanstack/react-query'

export function DealsGrid({ initialData, sort }: DealsGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['deals', sort],
    queryFn: ({ pageParam }) => fetchDeals({ cursor: pageParam, sort, limit: 20 }),
    initialPageParam: initialData.meta.cursor as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.hasMore ? lastPage.meta.cursor : undefined,
    initialData: { pages: [initialData], pageParams: [undefined] },
  })

  const allDeals = data.pages.flatMap(page => page.data)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allDeals.map(deal => (
          <ProductCard key={deal.asin} product={deal} showDealBadge
            extraContent={
              <div className="flex items-center gap-2 text-sm">
                <span className="line-through text-text-soft">${deal.previousPrice}</span>
                <span className="font-semibold text-success">-{deal.dropPercent}%</span>
              </div>
            } />
        ))}
      </div>
      <InfiniteScroll onLoadMore={fetchNextPage}
                      hasMore={!!hasNextPage} loading={isFetchingNextPage} />
    </>
  )
}
```

### 4. DealFilters Component
```typescript
// frontend/components/deals/deal-filters.tsx
'use client'
// Sort dropdown (drop_pct, price_asc, category) + optional category filter
// Uses router.push with searchParams to trigger server re-render for SEO
// Tailwind: flex gap-3 items-center mb-4
```

### 5. SEO Metadata for Product Pages
```typescript
// frontend/app/product/[asin]/page.tsx -- add generateMetadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProduct(params.asin)
  return {
    title: `${product.title} Price History | PriceMate AU`,
    description: `Track ${product.title} price on Amazon AU. Current: $${product.currentPrice}. ` +
                 `Lowest: $${product.lowestPrice}.`,
    openGraph: {
      title: product.title,
      description: `Currently $${product.currentPrice} on Amazon AU`,
      images: [product.imageUrl], type: 'website',
    },
  }
}
```

### 6. JSON-LD Structured Data
```typescript
// Inline component used in deals page
function JsonLd({ deals }: { deals: Deal[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: deals.map((deal, index) => ({
      '@type': 'ListItem', position: index + 1,
      item: {
        '@type': 'Product', name: deal.title, image: deal.imageUrl,
        offers: { '@type': 'Offer', price: deal.currentPrice, priceCurrency: 'AUD', url: deal.amazonUrl },
      },
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
```

### 7. Service Functions
```typescript
// frontend/services/category-service.ts
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/api/categories`, { next: { revalidate: 3600 } })
  const { data } = await res.json()
  return data
}

// frontend/services/deal-service.ts
export async function fetchDeals(params: DealParams): Promise<PagedResult<Deal>> {
  const searchParams = new URLSearchParams({ limit: String(params.limit), sort: params.sort })
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.category) searchParams.set('category', params.category)
  const res = await fetch(`${API_BASE}/api/deals?${searchParams}`, { next: { revalidate: 300 } })
  return res.json()
}
```

**ISR Revalidation:**
- Categories: 1 hour
- Deals first page: 5 minutes
- Product detail: 15 minutes

## Todo List
- [x] CategoryCard component (Tailwind)
- [x] S-09 Categories page (server component, grid)
- [x] Category products page with generateMetadata + infinite scroll
- [x] useDeals hook (useInfiniteQuery)
- [x] DealsGrid client component (initialData + infinite scroll)
- [x] DealFilters component (sort + category filter)
- [x] S-10 Deals page (SSR first page + client hydration)
- [x] generateMetadata for product detail pages
- [x] generateMetadata for category pages
- [x] Static metadata for deals page
- [x] JSON-LD structured data on deals page
- [x] Category service + deal service
- [x] ISR revalidation config for public pages

## Success Criteria
- `/deals` page source (View Source) contains product HTML (SSR verified)
- Meta tags render correctly for product detail pages
- Categories page lists all categories with correct counts
- Infinite scroll loads more deals via TanStack Query (no duplicate items)
- JSON-LD validates via Google Rich Results Test
- ISR revalidation refreshes deals page every 5 minutes
- `initialData` pattern avoids flash of loading state on first render

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| SSR + client hydration mismatch | Medium | Pass `initialData` to useInfiniteQuery; avoid conditional rendering |
| TanStack Query initialData stale | Low | Set `staleTime` to match ISR revalidation interval |
| SEO indexing delay | Low | Submit sitemap to Google Search Console |
| ISR stale data | Low | 5-min revalidation acceptable; prices update every 5hr anyway |
