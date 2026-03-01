import { HeroSection } from '@/components/landing/hero-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { DealsPreview } from '@/components/landing/deals-preview'
import { NavBar } from '@/components/shared/nav-bar'
import Link from 'next/link'
import type { Product } from '@/_types/domain'

async function fetchTopDeals(): Promise<Product[]> {
  try {
    const base = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050'
    const response = await fetch(`${base}/api/products/top-deals`, { next: { revalidate: 3600 } })
    if (!response.ok) return []
    const body = await response.json()
    return body.data ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const topDeals = await fetchTopDeals()

  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <HowItWorks />
        <DealsPreview products={topDeals} />

        <section className="py-14 px-4 bg-white text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to start saving?</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create a free account and start tracking prices on Amazon Australia today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get started free
            </Link>
            <Link
              href="/search?q=laptops"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse deals
            </Link>
          </div>
        </section>

        <footer className="border-t border-gray-200 bg-gray-50 py-8 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2026 PriceMate AU. Track Amazon Australia prices.</p>
            <div className="flex gap-6">
              <Link href="/about" className="hover:text-gray-700">About</Link>
              <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-700">Terms</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
