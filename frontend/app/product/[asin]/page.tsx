import type { Metadata } from 'next'
import { API_BASE_URL } from '@/lib/constants'
import { ProductDetailClient } from '@/components/product/product-detail-client'
import type { Product } from '@/_types/domain'
import type { ApiResponse } from '@/_types/api'

interface Props {
  params: Promise<{ asin: string }>
}

async function fetchProductForMeta(asin: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${asin}`, {
      next: { revalidate: 900 },
    })
    if (!res.ok) return null
    const body: ApiResponse<Product> = await res.json()
    return body.data
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { asin } = await params
  const product = await fetchProductForMeta(asin)
  if (!product) return { title: 'Product Price History | PriceMate AU' }
  return {
    title: `${product.title} Price History | PriceMate AU`,
    description:
      `Track ${product.title} price on Amazon AU. ` +
      `Current: $${product.currentPrice.toFixed(2)}.`,
    openGraph: {
      title: product.title,
      description: `Currently $${product.currentPrice.toFixed(2)} on Amazon AU`,
      images: product.imageUrl ? [product.imageUrl] : [],
      type: 'website',
    },
  }
}

export default function ProductDetailPage() {
  return <ProductDetailClient />
}
