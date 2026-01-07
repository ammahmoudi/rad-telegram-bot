import { auth } from './auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const proxy: any = auth((req): ReturnType<typeof NextResponse.next | typeof NextResponse.redirect> => {
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const isLoggedIn = !!req.auth;

  // Allow auth pages and API routes
  if (isAuthPage || isApiRoute) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
