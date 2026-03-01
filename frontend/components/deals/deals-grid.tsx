'use client'

import { ProductCard } from '@/components/product/product-card'
import { InfiniteScroll } from '@/components/shared/infinite-scroll'
import { useDeals } from '@/hooks/use-deals'
import type { PagedResult } from '@/_types/api'
import type { Deal } from '@/_types/domain'

interface DealsGridProps {
  initialData: PagedResult<Deal>
  sort: string
  category?: string
}

export function DealsGrid({ initialData, sort, category }: DealsGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useDeals({
    sort,
    category,
    initialData,
  })

  const allDeals = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allDeals.map((deal) => (
          <ProductCard
            key={deal.asin}
            product={{
              asin: deal.asin,
              title: deal.title,
              imageUrl: deal.imageUrl,
              currentPrice: deal.currentPrice,
              originalPrice: deal.previousPrice,
              currency: 'AUD',
              seller: 'Amazon AU',
            }}
            showDealBadge
          >
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="line-through text-gray-400">
                ${deal.previousPrice.toFixed(2)}
              </span>
              <span className="font-semibold text-green-600">-{deal.dropPercent}%</span>
            </div>
          </ProductCard>
        ))}
      </div>
      <InfiniteScroll
        onLoadMore={fetchNextPage}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </>
  )
}
