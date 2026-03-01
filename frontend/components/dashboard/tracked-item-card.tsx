'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import type { TrackedProduct } from '@/_types/domain'

const SparklineChart = dynamic(
  () => import('@/components/product/sparkline-chart').then((mod) => ({ default: mod.SparklineChart })),
  { ssr: false, loading: () => <div className="h-[50px]" /> },
)

interface TrackedItemCardProps {
  item: TrackedProduct
  onRemove: (id: string) => void
}

export function TrackedItemCard({ item, onRemove }: TrackedItemCardProps) {
  const { product, priceHistory, targetPrice, alertEnabled } = item
  const latestPrice = product.currentPrice
  const previousPrice = priceHistory.length >= 2 ? priceHistory[priceHistory.length - 2].price : null
  const priceChange = previousPrice ? latestPrice - previousPrice : 0
  const priceChangePct = previousPrice ? (priceChange / previousPrice) * 100 : 0

  const changeColor =
    priceChange < 0 ? 'text-green-600' : priceChange > 0 ? 'text-red-500' : 'text-gray-500'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <Link href={`/product/${product.asin}`} className="flex-shrink-0">
          <div className="relative h-16 w-16">
            <Image
              src={product.imageUrl || '/placeholder-product.png'}
              alt={product.title}
              fill
              sizes="64px"
              className="rounded-sm object-contain"
              unoptimized={product.imageUrl?.startsWith('http')}
            />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/product/${product.asin}`}>
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
              {product.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-base font-bold text-gray-900">
              ${latestPrice.toFixed(2)}
            </span>
            {previousPrice && (
              <span className={`text-xs font-medium ${changeColor}`}>
                {priceChange > 0 ? '+' : ''}{priceChangePct.toFixed(1)}%
              </span>
            )}
          </div>
          {targetPrice && (
            <p className="text-xs text-gray-500 mt-0.5">
              Alert at{' '}
              <span className="font-mono font-medium text-orange-600">${targetPrice.toFixed(2)}</span>
              {alertEnabled && <span className="ml-1 text-green-600">• Active</span>}
            </p>
          )}
        </div>
      </div>

      {priceHistory.length > 1 && (
        <div className="mt-2">
          <SparklineChart
            data={priceHistory}
            color={priceChange < 0 ? '#388E3C' : priceChange > 0 ? '#D32F2F' : '#1976D2'}
          />
        </div>
      )}

      <div className="flex justify-end mt-2">
        <button
          onClick={() => onRemove(item.id)}
          className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
