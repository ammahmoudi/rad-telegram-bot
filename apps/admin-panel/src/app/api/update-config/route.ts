import { setSystemConfig } from '@rastar/shared';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const plankaBaseUrl = formData.get('plankaBaseUrl');
    const openRouterKey = formData.get('openRouterKey');
    const defaultModel = formData.get('defaultModel');

    if (!plankaBaseUrl || typeof plankaBaseUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Normalize URL (remove trailing slash)
    const normalizedUrl = plankaBaseUrl.replace(/\/+$/, '');
    await setSystemConfig('PLANKA_BASE_URL', normalizedUrl);

    // Update AI configuration if provided
    if (openRouterKey && typeof openRouterKey === 'string') {
      // Only update if not empty or if explicitly clearing
      if (openRouterKey.trim().length > 0) {
        await setSystemConfig('OPENROUTER_API_KEY', openRouterKey.trim());
      }
    }

    if (defaultModel && typeof defaultModel === 'string') {
      await setSystemConfig('DEFAULT_AI_MODEL', defaultModel);
    }

    // Redirect back to home page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Failed to update config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
