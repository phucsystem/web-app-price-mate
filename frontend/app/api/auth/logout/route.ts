import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value
  const apiUrl = process.env.API_BASE_URL ?? 'http://localhost:5000'

  if (refreshToken) {
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {
      // best-effort: clear cookies even if backend call fails
    })
  }

  const res = NextResponse.json({ message: 'Logged out' })
  res.cookies.delete('authToken')
  res.cookies.delete('refreshToken')
  return res
}
