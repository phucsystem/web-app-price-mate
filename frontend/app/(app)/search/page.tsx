'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchBar } from '@/components/shared/search-bar'
import { ProductCard } from '@/components/product/product-card'
import { InfiniteScroll } from '@/components/shared/infinite-scroll'
import { useProductSearch } from '@/hooks/use-product-search'
import { trackProduct } from '@/services/tracked-items-service'
import { useQueryClient } from '@tanstack/react-query'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const query = searchParams.get('q') ?? ''

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useProductSearch(query)

  const allProducts = data?.pages.flatMap((page) => page.products) ?? []

  async function handleTrack(asin: string) {
    try {
      await trackProduct(asin)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      router.push(`/product/${asin}`)
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 401) {
        router.push('/login')
      }
    }
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500 text-lg">Enter a search term to find products.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-32 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="text-red-500 font-medium">Failed to load results.</p>
        <p className="text-gray-500 text-sm mt-1">Please try again.</p>
      </div>
    )
  }

  if (allProducts.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="text-gray-700 font-medium text-lg">No products found for &quot;{query}&quot;</p>
        <p className="text-gray-500 text-sm mt-2">Try a different search term or paste an Amazon AU product URL.</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        Showing results for <span className="font-semibold text-gray-800">&quot;{query}&quot;</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allProducts.map((product) => (
          <ProductCard
            key={product.asin}
            product={product}
            showTrackBtn
            showDealBadge
            onTrack={() => handleTrack(product.asin)}
          />
        ))}
      </div>
      <InfiniteScroll
        onLoadMore={fetchNextPage}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
      />
    </>
  )
}

function SearchBarWithQuery() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') ?? ''
  return (
    <div className="mb-6 max-w-xl">
      <SearchBar initialQuery={query} size="sm" />
    </div>
  )
}

export default function SearchPage() {
  return (
    <>
      <Suspense fallback={<div className="mb-6 h-10 max-w-xl bg-gray-100 animate-pulse rounded-md" />}>
        <SearchBarWithQuery />
      </Suspense>
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-32 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      }>
        <SearchResultsContent />
      </Suspense>
    </>
  )
}
