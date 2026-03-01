import { NextRequest, NextResponse } from 'next/server'
import { TOKEN_MAX_AGE } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const apiUrl = process.env.API_BASE_URL ?? 'http://localhost:5000'

  const backendResponse = await fetch(`${apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!backendResponse.ok) {
    const errorBody = await backendResponse.json().catch(() => ({ message: 'Registration failed' }))
    return NextResponse.json(errorBody, { status: backendResponse.status })
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
