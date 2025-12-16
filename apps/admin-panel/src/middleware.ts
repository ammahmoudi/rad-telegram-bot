import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_BASIC_AUTH_USER || '';
  const pass = process.env.ADMIN_BASIC_AUTH_PASS || '';

  // If creds are not configured, deny by default.
  if (!user || !pass) {
    return new NextResponse('Admin auth not configured', { status: 503 });
  }

  const auth = req.headers.get('authorization') || '';
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return unauthorized();
  }

  let decoded = '';
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  const idx = decoded.indexOf(':');
  if (idx < 0) return unauthorized();

  const gotUser = decoded.slice(0, idx);
  const gotPass = decoded.slice(idx + 1);

  if (gotUser !== user || gotPass !== pass) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};

function unauthorized() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Rastar Admin"',
    },
  });
}
