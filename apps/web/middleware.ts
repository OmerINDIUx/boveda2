import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function middleware(request: NextRequest) {
  const token =
    request.cookies.get('holocron_token')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '') ??
    '';

  if (!token) {
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.next();
    }

    const user = await response.json();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-permissions', JSON.stringify(user.permissions ?? []));

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
