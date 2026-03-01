'use client'

import { useState, useCallback } from 'react'
import type { User, LoginData, RegisterData } from '@/_types/domain'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (data: LoginData): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Login failed' }))
        setError(errorBody.message ?? 'Login failed')
        return false
      }
      const body = await response.json()
      setUser(body.data?.user ?? null)
      return true
    } catch {
      setError('Network error. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Registration failed' }))
        setError(errorBody.message ?? 'Registration failed')
        return false
      }
      const body = await response.json()
      setUser(body.data?.user ?? null)
      return true
    } catch {
      setError('Network error. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }, [])

  return { user, loading, error, login, register, logout }
}
