import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const LOGIN_PATH = '/login';
const DEFAULT_APP_PATH = '/dashboard';

function isPublicPath(pathname: string) {
  return pathname === LOGIN_PATH;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get('holocron_token')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '') ??
    '';

  if (!token) {
    if (!isPublicPath(pathname)) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (isPublicPath(pathname)) {
        const nextResponse = NextResponse.next();
        nextResponse.cookies.delete('holocron_token');
        return nextResponse;
      }

      const loginUrl = new URL(LOGIN_PATH, request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete('holocron_token');
      return redirectResponse;
    }

    const user = await response.json();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-permissions', JSON.stringify(user.permissions ?? []));

    if (isPublicPath(pathname)) {
      return NextResponse.redirect(new URL(DEFAULT_APP_PATH, request.url));
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    if (!isPublicPath(pathname)) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
