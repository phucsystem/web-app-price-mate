'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/refresh', { method: 'POST' })
        if (!response.ok) {
          router.replace('/login')
          return
        }
      } catch {
        router.replace('/login')
        return
      } finally {
        setChecking(false)
      }
    }
    checkSession()
  }, [router])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
