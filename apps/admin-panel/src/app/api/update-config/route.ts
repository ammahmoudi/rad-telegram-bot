import { setSystemConfig } from '@rad/shared';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const plankaBaseUrl = formData.get('plankaBaseUrl');
    const openRouterKey = formData.get('openRouterKey');
    const defaultModel = formData.get('defaultModel');
    const maxToolCalls = formData.get('maxToolCalls');
    const mcpProjectScanLimit = formData.get('mcpProjectScanLimit');
    const mcpProjectScanDelay = formData.get('mcpProjectScanDelay');
    const useHardcodedPrompts = formData.get('useHardcodedPrompts');

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

    if (maxToolCalls && typeof maxToolCalls === 'string') {
      const num = parseInt(maxToolCalls);
      if (num >= 1 && num <= 10) {
        await setSystemConfig('maxToolCalls', maxToolCalls);
      }
    }

    if (mcpProjectScanLimit !== null && typeof mcpProjectScanLimit === 'string') {
      const trimmed = mcpProjectScanLimit.trim();
      if (trimmed === '') {
        // Empty means unlimited - store empty string
        await setSystemConfig('mcpProjectScanLimit', '');
      } else {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 0) {
          await setSystemConfig('mcpProjectScanLimit', trimmed);
        }
      }
    }

    if (mcpProjectScanDelay !== null && typeof mcpProjectScanDelay === 'string') {
      const trimmed = mcpProjectScanDelay.trim();
      if (trimmed !== '') {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 0) {
          await setSystemConfig('mcpProjectScanDelay', trimmed);
        }
      }
    }

    // Update hardcoded prompts setting
    await setSystemConfig('USE_HARDCODED_PROMPTS', useHardcodedPrompts === 'on' ? 'true' : 'false');

    // Redirect back to home page with success parameter
    const url = new URL('/', request.url);
    url.searchParams.set('success', 'config-updated');
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Failed to update config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
