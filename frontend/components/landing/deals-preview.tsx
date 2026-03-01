import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/_types/domain'
import { DealBadge } from '@/components/product/deal-badge'

interface DealsPreviewProps {
  products: Product[]
}

function DealCard({ product }: { product: Product }) {
  const discount =
    product.originalPrice && product.originalPrice > product.currentPrice
      ? Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100)
      : null

  return (
    <Link
      href={`/product/${product.asin}`}
      className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative h-20 w-20 flex-shrink-0">
        <Image
          src={product.imageUrl || '/placeholder-product.png'}
          alt={product.title}
          fill
          sizes="80px"
          className="rounded-sm object-contain"
          unoptimized={product.imageUrl?.startsWith('http')}
        />
      </div>
      <div className="flex flex-col justify-between min-w-0">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.title}</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold text-gray-900">
            ${product.currentPrice.toFixed(2)}
          </span>
          {discount && <DealBadge score={discount >= 30 ? 'great' : 'good'} />}
        </div>
      </div>
    </Link>
  )
}

export function DealsPreview({ products }: DealsPreviewProps) {
  if (products.length === 0) return null

  return (
    <section className="py-14 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Deals</h2>
          <Link href="/search?q=deals" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => (
            <DealCard key={product.asin} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
