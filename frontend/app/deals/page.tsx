import type { Metadata } from 'next'
import { Suspense } from 'react'
import { NavBar } from '@/components/shared/nav-bar'
import { DealsGrid } from '@/components/deals/deals-grid'
import { DealFilters } from '@/components/deals/deal-filters'
import { fetchDeals } from '@/services/deal-service'
import type { Deal } from '@/_types/domain'

export const metadata: Metadata = {
  title: "Today's Best Amazon AU Deals | PriceMate AU",
  description: 'Discover the biggest price drops on Amazon Australia. Updated every 5 minutes with the latest deals.',
  openGraph: {
    title: "Today's Best Amazon AU Deals | PriceMate AU",
    description: 'Discover the biggest price drops on Amazon Australia. Updated every 5 minutes.',
    type: 'website',
  },
}

interface Props {
  searchParams: Promise<{ sort?: string; category?: string }>
}

function JsonLd({ deals }: { deals: Deal[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: deals.map((deal, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: deal.title,
        image: deal.imageUrl,
        offers: {
          '@type': 'Offer',
          price: deal.currentPrice,
          priceCurrency: 'AUD',
          url: deal.amazonUrl,
        },
      },
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function DealsPage({ searchParams }: Props) {
  const { sort = 'drop_pct', category } = await searchParams
  const initialData = await fetchDeals({ limit: 20, sort, category })

  return (
    <>
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Today&apos;s Best Amazon AU Deals
        </h1>
        <p className="text-gray-500 mb-6">Updated every 5 minutes with the latest price drops.</p>

        <Suspense>
          <DealFilters />
        </Suspense>

        <DealsGrid initialData={initialData} sort={sort} category={category} />
        <JsonLd deals={initialData.data} />
      </main>
    </>
  )
}
