export interface User {
  id: string
  email: string
  displayName: string
  createdAt?: string
}

export interface Product {
  asin: string
  title: string
  imageUrl: string
  currentPrice: number
  originalPrice?: number
  currency: string
  seller: string
  category?: string
  rating?: number
  reviewCount?: number
}

export interface PriceHistory {
  price: number
  recordedAt: string
}

export interface TrackedProduct {
  id: string
  userId: string
  asin: string
  targetPrice?: number
  alertEnabled: boolean
  product: Product
  priceHistory: PriceHistory[]
  createdAt: string
}

export interface RegisterData {
  email: string
  password: string
  displayName: string
}

export interface LoginData {
  email: string
  password: string
}

export interface Category {
  id: string
  name: string
  slug: string
  productCount: number
}

export interface Deal {
  asin: string
  title: string
  imageUrl: string
  currentPrice: number
  previousPrice: number
  dropPercent: number
  amazonUrl: string
  category?: string
}
