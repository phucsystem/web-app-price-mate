import type { Metadata } from 'next'
import { NavBar } from '@/components/shared/nav-bar'
import { CategoryCard } from '@/components/categories/category-card'
import { fetchCategories } from '@/services/category-service'

export const metadata: Metadata = {
  title: 'Browse Categories | PriceMate AU',
  description: 'Browse Amazon Australia product categories and track prices across electronics, home, fashion and more.',
}

export default async function CategoriesPage() {
  const categories = await fetchCategories()

  return (
    <>
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Categories</h1>
        <p className="text-gray-500 mb-8">Find the best deals across Amazon Australia categories.</p>

        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-16">No categories available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
