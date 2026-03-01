import { API_BASE_URL } from '@/lib/constants'
import type { Category } from '@/_types/domain'
import type { CategoryProducts } from '@/_types/api'

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const body = await res.json()
    return body.data ?? []
  } catch {
    return []
  }
}

export async function fetchCategoryProducts(
  slug: string,
  cursor?: string,
  sort?: string,
): Promise<CategoryProducts> {
  const params = new URLSearchParams({ limit: '20' })
  if (cursor) params.set('cursor', cursor)
  if (sort) params.set('sort', sort)
  const res = await fetch(
    `${API_BASE_URL}/api/categories/${slug}/products?${params}`,
    { next: { revalidate: 3600 } },
  )
  if (!res.ok) throw new Error(`Failed to fetch category: ${slug}`)
  return res.json()
}
