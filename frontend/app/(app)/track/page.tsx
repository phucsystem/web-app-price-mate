'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import Image from 'next/image'
import { trackProductUrl } from '@/services/product-service'
import type { TrackedProduct } from '@/_types/domain'

function extractAsin(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/)
  return match ? match[1] : null
}

export default function TrackPage() {
  const router = useRouter()
  const [preview, setPreview] = useState<TrackedProduct | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)

  const form = useForm({
    defaultValues: { url: '', targetPrice: '' },
    onSubmit: async ({ value }) => {
      try {
        const result = await trackProductUrl({
          url: value.url,
          targetPrice: value.targetPrice ? Number(value.targetPrice) : null,
        })
        router.push(`/product/${result.product.asin}`)
      } catch {
        setFetchError('Failed to start tracking. Please try again.')
      }
    },
  })

  async function handleFetchProduct() {
    const url = form.getFieldValue('url').trim()
    if (!url) return
    setIsFetching(true)
    setFetchError(null)
    setPreview(null)
    try {
      const result = await trackProductUrl({ url, targetPrice: null })
      setPreview(result)
    } catch {
      setFetchError('Could not fetch product. Make sure it is a valid Amazon AU URL.')
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Track a Product</h1>
        <p className="text-sm text-gray-500 mb-8">Paste an Amazon AU product URL to start tracking its price.</p>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amazon AU Product URL</label>
            <form.Field
              name="url"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return 'URL is required'
                  if (!value.includes('amazon.com.au') && !value.includes('amazon.au')) {
                    return 'Must be an Amazon AU product URL'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="https://www.amazon.com.au/dp/XXXXXXXXXX"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleFetchProduct}
                      disabled={isFetching}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {isFetching ? 'Fetching…' : 'Fetch Product'}
                    </button>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
                  )}
                  {fetchError && (
                    <p className="mt-1 text-xs text-red-600">{fetchError}</p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {preview && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0">
                <Image
                  src={preview.product.imageUrl || '/placeholder-product.png'}
                  alt={preview.product.title}
                  fill
                  sizes="80px"
                  className="rounded-sm object-contain"
                  unoptimized={preview.product.imageUrl?.startsWith('http')}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{preview.product.title}</p>
                <p className="font-mono text-lg font-bold text-gray-900 mt-1">
                  ${preview.product.currentPrice.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">ASIN: {preview.product.asin}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Price <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <form.Field name="targetPrice">
              {(field) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="0.00"
                    className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </form.Field>
            <p className="mt-1 text-xs text-gray-500">We will email you when the price drops below this amount.</p>
          </div>

          <button
            type="submit"
            disabled={form.state.isSubmitting}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {form.state.isSubmitting ? 'Starting tracking…' : 'Start Tracking'}
          </button>
        </form>
    </div>
  )
}
