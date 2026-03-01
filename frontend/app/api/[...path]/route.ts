import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:5050'

async function proxyRequest(request: NextRequest, path: string) {
  const authToken = request.cookies.get('authToken')?.value
  const url = new URL(request.url)
  const backendUrl = `${API_URL}/api/${path}${url.search}`

  const headers: HeadersInit = {}
  const contentType = request.headers.get('content-type')
  if (contentType) headers['Content-Type'] = contentType
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  let backendResponse: Response
  try {
    backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined,
    })
  } catch {
    return NextResponse.json({ message: 'Backend service unavailable' }, { status: 502 })
  }

  const responseBody = await backendResponse.text()
  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: { 'Content-Type': backendResponse.headers.get('content-type') ?? 'application/json' },
  })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}
