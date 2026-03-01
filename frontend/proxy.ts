import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev_secret_key_minimum_32_characters_long')

const protectedRoutes = ['/dashboard', '/track']
const authRoutes = ['/login', '/register', '/reset-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('authToken')?.value

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isAuthRoute && token) {
    try {
      await jwtVerify(token, secret)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch {
      // token invalid — let user stay on auth page
    }
  }

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    try {
      const { payload } = await jwtVerify(token, secret)
      const headers = new Headers(request.headers)
      headers.set('x-user-id', payload.sub as string)
      return NextResponse.next({ request: { headers } })
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
