import { API_BASE_URL } from '@/lib/constants'
import type { DealParams, PagedResult } from '@/_types/api'
import type { Deal } from '@/_types/domain'

export async function fetchDeals(params: DealParams): Promise<PagedResult<Deal>> {
  try {
    const searchParams = new URLSearchParams({ limit: String(params.limit), sort: params.sort })
    if (params.cursor) searchParams.set('cursor', params.cursor)
    if (params.category) searchParams.set('category', params.category)
    const res = await fetch(`${API_BASE_URL}/api/deals?${searchParams}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return { data: [], meta: { cursor: null, hasMore: false } }
    return res.json()
  } catch {
    return { data: [], meta: { cursor: null, hasMore: false } }
  }
}
