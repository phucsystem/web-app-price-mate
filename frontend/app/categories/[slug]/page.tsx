import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NavBar } from '@/components/shared/nav-bar'
import { CategoryProductsGrid } from '@/components/categories/category-products-grid'
import { fetchCategoryProducts } from '@/services/category-service'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const result = await fetchCategoryProducts(slug)
    const category = result.category
    return {
      title: `${category.name} Deals | PriceMate AU`,
      description: `Track prices for ${category.productCount} ${category.name} products on Amazon AU. Find the best deals and price history.`,
      openGraph: {
        title: `${category.name} Deals | PriceMate AU`,
        description: `Track prices for ${category.productCount} ${category.name} products on Amazon AU.`,
        type: 'website',
      },
    }
  } catch {
    return { title: 'Category | PriceMate AU' }
  }
}

export default async function CategoryProductsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { sort = 'price_asc' } = await searchParams

  let initialData
  try {
    initialData = await fetchCategoryProducts(slug, undefined, sort)
  } catch {
    notFound()
  }

  const category = initialData.category

  return (
    <>
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/categories" className="hover:text-blue-600 transition-colors">
            Categories
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{category.name}</span>
        </nav>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-500 mt-1">{category.productCount} products tracked</p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="category-sort" className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <form method="get">
              <select
                id="category-sort"
                name="sort"
                defaultValue={sort}
                onChange={(event) => {
                  const form = event.currentTarget.form
                  if (form) form.submit()
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="price_drop">Biggest Drop</option>
              </select>
            </form>
          </div>
        </div>

        <CategoryProductsGrid slug={slug} sort={sort} initialData={initialData} />
      </main>
    </>
  )
}
