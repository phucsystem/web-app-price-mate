import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PaginationMeta } from '@/_types/api'
import type { Product, PriceHistory, TrackedProduct } from '@/_types/domain'

export interface SearchResult {
  products: Product[]
  meta: PaginationMeta
}

export interface DashboardResult {
  items: TrackedProduct[]
  meta: PaginationMeta
  summary: {
    totalTracked: number
    activeAlerts: number
    recentDrops: number
  }
}

export interface TrackUrlPayload {
  url: string
  targetPrice?: number | null
}

export async function searchProducts(query: string, cursor?: string): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query })
  if (cursor) params.set('cursor', cursor)
  const result = await apiClient<ApiResponse<Product[]>>(`/api/products/search?${params}`)
  return {
    products: result.data,
    meta: result.meta ?? { cursor: null, hasMore: false },
  }
}

export async function getProduct(asin: string): Promise<Product> {
  const result = await apiClient<ApiResponse<Product>>(`/api/products/${asin}`)
  return result.data
}

export async function getPriceHistory(asin: string, range: string): Promise<PriceHistory[]> {
  const result = await apiClient<ApiResponse<PriceHistory[]>>(
    `/api/products/${asin}/prices?range=${range}`,
  )
  return result.data
}

export async function trackProductUrl(payload: TrackUrlPayload): Promise<TrackedProduct> {
  const result = await apiClient<ApiResponse<TrackedProduct>>('/api/products/track-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function getTopDeals(): Promise<Product[]> {
  const result = await apiClient<ApiResponse<Product[]>>('/api/products/top-deals')
  return result.data
}
