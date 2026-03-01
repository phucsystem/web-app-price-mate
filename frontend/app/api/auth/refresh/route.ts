import { NextRequest, NextResponse } from 'next/server'
import { TOKEN_MAX_AGE } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value
  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 401 })
  }

  const apiUrl = process.env.API_BASE_URL ?? 'http://localhost:5000'

  const backendResponse = await fetch(`${apiUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!backendResponse.ok) {
    const res = NextResponse.json({ message: 'Token refresh failed' }, { status: 401 })
    res.cookies.delete('authToken')
    res.cookies.delete('refreshToken')
    return res
  }

  const { data } = await backendResponse.json()
  const isProduction = process.env.NODE_ENV === 'production'

  const res = NextResponse.json({ data: { user: data.user } })

  res.cookies.set('authToken', data.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE.access,
    path: '/',
  })

  res.cookies.set('refreshToken', data.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE.refresh,
    path: '/',
  })

  return res
}
