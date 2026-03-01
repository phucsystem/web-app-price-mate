'use client'

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function refreshTokens(): Promise<boolean> {
  const response = await fetch('/api/auth/refresh', { method: 'POST' })
  return response.ok
}

export async function apiClient<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, credentials: 'include' })

  if (response.status === 401) {
    const refreshed = await refreshTokens()
    if (refreshed) {
      const retryResponse = await fetch(url, { ...options, credentials: 'include' })
      if (retryResponse.ok) return retryResponse.json() as Promise<T>
      throw new ApiClientError('Unauthorized after refresh', retryResponse.status)
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new ApiClientError('Unauthorized', 401)
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new ApiClientError(errorText, response.status)
  }

  return response.json() as Promise<T>
}

export function buildApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000'
  return `${base}${path}`
}
