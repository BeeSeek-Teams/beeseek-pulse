import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = () => process.env.BACKEND_INTERNAL_URL || 'http://localhost:3009';

/**
 * Server-side proxy to the backend API.
 * This avoids client-side CORS issues and hides the backend URL.
 * Usage: /api/backend/health → proxies to BACKEND_INTERNAL_URL/health
 */
async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
  method: 'GET' | 'POST' | 'DELETE' = 'GET'
) {
  const { path } = await params;
  const targetPath = path.join('/');
  const url = new URL(request.url);
  const queryString = url.search;

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    };

    if (method === 'POST') {
      try {
        fetchOptions.body = JSON.stringify(await request.json());
      } catch {
        fetchOptions.body = '{}';
      }
    }

    const response = await fetch(`${BACKEND_URL()}/${targetPath}${queryString}`, fetchOptions);

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('image/svg+xml') || contentType.includes('text/')) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: { 'Content-Type': contentType },
      });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      const text = await response.text().catch(() => '');
      data = { raw: text || 'Non-JSON response' };
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Backend unavailable', status: 'down' },
      { status: 503 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context, 'POST');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context, 'DELETE');
}
