'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { ProductCard } from '@/components/product/product-card'
import { InfiniteScroll } from '@/components/shared/infinite-scroll'
import { fetchCategoryProducts } from '@/services/category-service'
import type { CategoryProducts } from '@/_types/api'

interface CategoryProductsGridProps {
  slug: string
  sort: string
  initialData: CategoryProducts
}

export function CategoryProductsGrid({ slug, sort, initialData }: CategoryProductsGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['category-products', slug, sort],
    queryFn: ({ pageParam }) =>
      fetchCategoryProducts(slug, pageParam as string | undefined, sort),
    initialPageParam: initialData.meta.cursor as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? (lastPage.meta.cursor ?? undefined) : undefined,
    initialData: { pages: [initialData], pageParams: [undefined] },
    staleTime: 3_600_000,
  })

  const allProducts = data?.pages.flatMap((page) => page.products) ?? []

  if (allProducts.length === 0) {
    return <p className="text-gray-500 text-center py-16">No products found in this category.</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allProducts.map((product) => (
          <ProductCard key={product.asin} product={product} showDealBadge showTrackBtn />
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
