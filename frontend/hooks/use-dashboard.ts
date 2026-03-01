'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getDashboard } from '@/services/tracked-items-service'

export function useDashboard(sort = 'recent') {
  return useInfiniteQuery({
    queryKey: ['dashboard', sort],
    queryFn: ({ pageParam }) => getDashboard(pageParam as string | undefined, sort),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? (lastPage.meta.cursor ?? undefined) : undefined,
  })
}
