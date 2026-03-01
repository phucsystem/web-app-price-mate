import { SearchBar } from '@/components/shared/search-bar'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Track Amazon AU Prices
        </h1>
        <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
          Get alerts when prices drop. Never overpay for products on Amazon Australia again.
        </p>
        <div className="max-w-xl mx-auto mb-6">
          <SearchBar placeholder="Search products or paste an Amazon AU link…" size="lg" />
        </div>
        <p className="text-sm text-blue-200">
          Or{' '}
          <Link href="/track" className="text-white underline underline-offset-2 hover:text-blue-100">
            paste a product URL to start tracking
          </Link>
        </p>
      </div>
    </section>
  )
}
