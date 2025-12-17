import { setSystemConfig } from '@rastar/shared';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const plankaBaseUrl = formData.get('plankaBaseUrl');

    if (!plankaBaseUrl || typeof plankaBaseUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Normalize URL (remove trailing slash)
    const normalizedUrl = plankaBaseUrl.replace(/\/+$/, '');

    await setSystemConfig('PLANKA_BASE_URL', normalizedUrl);

    // Redirect back to home page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Failed to update config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
