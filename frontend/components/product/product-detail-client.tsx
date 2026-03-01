'use client'

import { useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { NavBar } from '@/components/shared/nav-bar'
import { DealBadge } from '@/components/product/deal-badge'
import { AlertForm } from '@/components/product/alert-form'
import { getProduct, getPriceHistory } from '@/services/product-service'
import { setAlert, trackProduct } from '@/services/tracked-items-service'
import type { PriceHistory } from '@/_types/domain'

const PriceChart = dynamic(
  () => import('@/components/product/price-chart').then((mod) => ({ default: mod.PriceChart })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" /> },
)

const TIME_RANGES = ['30d', '90d', '180d', '1y', 'all'] as const
type TimeRange = typeof TIME_RANGES[number]

function priceStats(history: PriceHistory[]) {
  if (history.length === 0) return { lowest: 0, highest: 0, average: 0 }
  const prices = history.map((entry) => entry.price)
  return {
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
  }
}

function PriceHistorySection({ asin, range }: { asin: string; range: TimeRange }) {
  const { data: history = [] } = useQuery({
    queryKey: ['priceHistory', asin, range],
    queryFn: () => getPriceHistory(asin, range),
  })

  const stats = priceStats(history)
  const recentEntries = [...history].reverse().slice(0, 10)

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <PriceChart data={history} height={300} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Lowest', value: stats.lowest, color: 'text-green-600' },
          { label: 'Highest', value: stats.highest, color: 'text-red-500' },
          { label: 'Average', value: stats.average, color: 'text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
            <p className={`font-mono text-xl font-bold ${stat.color}`}>${stat.value.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {recentEntries.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <h3 className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100">
            Price History (last 10 records)
          </h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentEntries.map((entry, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(entry.recordedAt).toLocaleDateString('en-AU', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-semibold text-gray-900">
                    ${entry.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export function ProductDetailClient() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const asin = params.asin as string
  const [selectedRange, setSelectedRange] = useState<TimeRange>('90d')
  const [trackedItemId, setTrackedItemId] = useState<string | null>(null)
  const [alertSaved, setAlertSaved] = useState(false)

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', asin],
    queryFn: () => getProduct(asin),
  })

  async function handleTrack() {
    try {
      const tracked = await trackProduct(asin)
      setTrackedItemId(tracked.id)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 401) router.push('/login')
    }
  }

  async function handleSetAlert(targetPrice: number) {
    if (!trackedItemId) {
      const tracked = await trackProduct(asin)
      setTrackedItemId(tracked.id)
      await setAlert(tracked.id, targetPrice)
    } else {
      await setAlert(trackedItemId, targetPrice)
    }
    setAlertSaved(true)
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  if (isLoading) {
    return (
      <>
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-8 w-64 bg-gray-100 animate-pulse rounded mb-4" />
          <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        </main>
      </>
    )
  }

  if (isError || !product) {
    return (
      <>
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-red-500 font-medium">Product not found.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">Back to home</Link>
        </main>
      </>
    )
  }

  const amazonUrl = `https://www.amazon.com.au/dp/${product.asin}`

  return (
    <>
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="relative h-48 w-48 flex-shrink-0 mx-auto sm:mx-0">
              <Image
                src={product.imageUrl || '/placeholder-product.png'}
                alt={product.title}
                fill
                sizes="192px"
                className="object-contain rounded-md"
                unoptimized={product.imageUrl?.startsWith('http')}
                priority
              />
            </div>

            <div className="flex flex-col gap-3 flex-1">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{product.title}</h1>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-3xl font-bold text-gray-900">
                  ${product.currentPrice.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.currentPrice && (
                  <span className="font-mono text-lg text-gray-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
                <DealBadge score="good" />
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="rounded-md bg-orange-400 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
                >
                  View on Amazon AU ↗
                </a>
                {!trackedItemId && (
                  <button
                    onClick={handleTrack}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Track This Product
                  </button>
                )}
                {trackedItemId && (
                  <span className="rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                    Tracking active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                * As an Amazon Associate we may earn from qualifying purchases.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-semibold text-gray-800">Price History</h2>
            <div className="flex gap-1">
              {TIME_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    selectedRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />}>
            <PriceHistorySection asin={asin} range={selectedRange} />
          </Suspense>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Price Alert</h2>
          {alertSaved ? (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Alert saved! We will notify you when the price drops.
            </div>
          ) : (
            <AlertForm
              currentPrice={product.currentPrice}
              onSave={handleSetAlert}
            />
          )}
        </div>
      </main>
    </>
  )
}
