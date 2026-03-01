'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/_types/domain'
import { DealBadge } from './deal-badge'

interface ProductCardProps {
  product: Product
  showTrackBtn?: boolean
  showDealBadge?: boolean
  showRemoveBtn?: boolean
  dealScore?: string
  onTrack?: () => void
  onRemove?: () => void
  children?: React.ReactNode
}

export function ProductCard({
  product,
  showTrackBtn,
  showDealBadge,
  showRemoveBtn,
  dealScore,
  onTrack,
  onRemove,
  children,
}: ProductCardProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/product/${product.asin}`} className="flex-shrink-0">
        <div className="relative h-24 w-24">
          <Image
            src={product.imageUrl || '/placeholder-product.png'}
            alt={product.title}
            fill
            sizes="96px"
            className="rounded-sm object-contain"
            unoptimized={product.imageUrl?.startsWith('http')}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between min-w-0">
        <Link href={`/product/${product.asin}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-lg font-bold text-gray-900">
            ${product.currentPrice.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.currentPrice && (
            <span className="font-mono text-sm text-gray-400 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
          {showDealBadge && dealScore && <DealBadge score={dealScore} />}
        </div>

        {children}

        <div className="flex gap-2 mt-2">
          {showTrackBtn && (
            <button
              onClick={onTrack}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Track
            </button>
          )}
          {showRemoveBtn && (
            <button
              onClick={onRemove}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
