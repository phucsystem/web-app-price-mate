'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { SummaryBar } from '@/components/dashboard/summary-bar'
import { TrackedItemCard } from '@/components/dashboard/tracked-item-card'
import { InfiniteScroll } from '@/components/shared/infinite-scroll'
import { useDashboard } from '@/hooks/use-dashboard'
import { removeTrackedItem } from '@/services/tracked-items-service'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'price_drop', label: 'Biggest Price Drop' },
  { value: 'alert', label: 'Alert Price' },
  { value: 'name', label: 'Name (A–Z)' },
]

export default function DashboardPage() {
  const [sort, setSort] = useState('recent')
  const queryClient = useQueryClient()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useDashboard(sort)

  const allItems = data?.pages.flatMap((page) => page.items) ?? []
  const summary = data?.pages[0]?.summary ?? { totalTracked: 0, activeAlerts: 0, recentDrops: 0 }

  async function handleRemove(trackedItemId: string) {
    const confirmed = window.confirm('Remove this product from your tracked list?')
    if (!confirmed) return
    try {
      await removeTrackedItem(trackedItemId)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch {
      // silent fail — user can retry
    }
  }

  return (
    <>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <Link
            href="/track"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            + Track New Item
          </Link>
        </div>

        <div className="mb-8">
          <SummaryBar summary={summary} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">Tracked Products</h2>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-40 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600 font-medium">Failed to load your tracked items.</p>
            <p className="text-sm text-red-400 mt-1">Please refresh the page.</p>
          </div>
        )}

        {!isLoading && !isError && allItems.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
            <p className="text-gray-600 font-medium text-lg mb-2">No tracked items yet</p>
            <p className="text-gray-400 text-sm mb-6">Start tracking products to see them here.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/search?q=laptops"
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/track"
                className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Add by URL
              </Link>
            </div>
          </div>
        )}

        {!isLoading && allItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allItems.map((item) => (
                <TrackedItemCard key={item.id} item={item} onRemove={handleRemove} />
              ))}
            </div>
            <InfiniteScroll
              onLoadMore={fetchNextPage}
              hasMore={hasNextPage ?? false}
              isLoading={isFetchingNextPage}
            />
          </>
        )}
      <Link
        href="/track"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors text-2xl font-light"
        aria-label="Track new item"
      >
        +
      </Link>
    </>
  )
}
