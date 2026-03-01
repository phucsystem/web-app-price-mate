'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchDeals } from '@/services/deal-service'
import type { PagedResult } from '@/_types/api'
import type { Deal } from '@/_types/domain'

interface UseDealsOptions {
  sort: string
  category?: string
  initialData?: PagedResult<Deal>
}

export function useDeals({ sort, category, initialData }: UseDealsOptions) {
  return useInfiniteQuery({
    queryKey: ['deals', sort, category],
    queryFn: ({ pageParam }) =>
      fetchDeals({ cursor: pageParam as string | undefined, sort, category, limit: 20 }),
    initialPageParam: initialData?.meta.cursor as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? (lastPage.meta.cursor ?? undefined) : undefined,
    initialData: initialData
      ? { pages: [initialData], pageParams: [undefined] }
      : undefined,
    staleTime: 300_000,
  })
}
