import Link from 'next/link'
import type { Category } from '@/_types/domain'

interface CategoryCardProps {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="flex flex-col items-center gap-2 rounded-md border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow text-center"
    >
      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
      <span className="text-sm text-gray-500">{category.productCount} products</span>
    </Link>
  )
}
