'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { searchProducts } from '@/services/product-service'

export function useProductSearch(query: string) {
  return useInfiniteQuery({
    queryKey: ['products', 'search', query],
    queryFn: ({ pageParam }) => searchProducts(query, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? (lastPage.meta.cursor ?? undefined) : undefined,
    enabled: !!query,
  })
}
