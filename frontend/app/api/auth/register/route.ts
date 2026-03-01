import { NextRequest, NextResponse } from 'next/server'
import { TOKEN_MAX_AGE } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:5050'

  let backendResponse: Response
  try {
    backendResponse = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return NextResponse.json({ message: 'Backend service unavailable' }, { status: 502 })
  }

  if (!backendResponse.ok) {
    const errorBody = await backendResponse.json().catch(() => ({ message: 'Registration failed' }))
    return NextResponse.json(errorBody, { status: backendResponse.status })
  }

  const result = await backendResponse.json()
  const isProduction = process.env.NODE_ENV === 'production'

  const res = NextResponse.json({ data: { user: result.user } })

  res.cookies.set('authToken', result.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE.access,
    path: '/',
  })

  res.cookies.set('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE.refresh,
    path: '/',
  })

  return res
}
