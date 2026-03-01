'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const SORT_OPTIONS = [
  { value: 'drop_pct', label: 'Biggest Drop' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const

export function DealFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') ?? 'drop_pct'

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    router.push(`/deals?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 mb-6">
      <label htmlFor="deal-sort" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <select
        id="deal-sort"
        value={currentSort}
        onChange={(event) => handleSortChange(event.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
