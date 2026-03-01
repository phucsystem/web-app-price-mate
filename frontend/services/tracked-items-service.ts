import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/_types/api'
import type { TrackedProduct } from '@/_types/domain'

export interface DashboardSummary {
  totalTracked: number
  activeAlerts: number
  recentDrops: number
}

export interface DashboardPage {
  items: TrackedProduct[]
  summary: DashboardSummary
  meta: { cursor: string | null; hasMore: boolean }
}

export async function getDashboard(cursor?: string, sort = 'recent'): Promise<DashboardPage> {
  const params = new URLSearchParams({ sort })
  if (cursor) params.set('cursor', cursor)
  const result = await apiClient<ApiResponse<{ items: TrackedProduct[]; summary: DashboardSummary }>>(
    `/api/dashboard?${params}`,
  )
  return {
    items: result.data.items,
    summary: result.data.summary,
    meta: result.meta ?? { cursor: null, hasMore: false },
  }
}

export async function setAlert(trackedItemId: string, targetPrice: number): Promise<TrackedProduct> {
  const result = await apiClient<ApiResponse<TrackedProduct>>(
    `/api/tracked-items/${trackedItemId}/alert`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPrice }),
    },
  )
  return result.data
}

export async function removeTrackedItem(trackedItemId: string): Promise<void> {
  await apiClient<ApiResponse<null>>(`/api/tracked-items/${trackedItemId}`, {
    method: 'DELETE',
  })
}

export async function trackProduct(asin: string, targetPrice?: number): Promise<TrackedProduct> {
  const result = await apiClient<ApiResponse<TrackedProduct>>('/api/tracked-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asin, targetPrice }),
  })
  return result.data
}
