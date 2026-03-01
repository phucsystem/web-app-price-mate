export interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta
  message?: string
}

export interface PaginationMeta {
  cursor: string | null
  hasMore: boolean
  total?: number
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string[]>
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  user: import('./domain').User
  accessToken: string
  refreshToken: string
}

export interface RegisterResponse {
  user: import('./domain').User
  accessToken: string
  refreshToken: string
}

export interface DealParams {
  limit: number
  sort: string
  cursor?: string
  category?: string
}

export interface PagedResult<T> {
  data: T[]
  meta: PaginationMeta
}

export interface CategoryProducts {
  category: import('./domain').Category
  products: import('./domain').Product[]
  meta: PaginationMeta
}
