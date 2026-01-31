import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSystemConfig } from '@rad/shared';

/**
 * GET /api/planka-status
 * Check if actually connected to Planka by making a test request
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Planka base URL and auth token from system config
    const plankaBaseUrl = await getSystemConfig('PLANKA_BASE_URL');
    const authToken = await getSystemConfig('PLANKA_AUTH_TOKEN');
    
    // If no URL or token, return not connected
    if (!plankaBaseUrl || !authToken) {
      return NextResponse.json({
        connected: false,
        reason: !plankaBaseUrl ? 'No URL configured' : 'No auth token'
      });
    }

    try {
      // Test connection by fetching user info
      const response = await fetch(`${plankaBaseUrl}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return NextResponse.json({
          connected: true,
          user: userData.item?.username || 'Unknown user',
          url: plankaBaseUrl
        });
      } else {
        return NextResponse.json({
          connected: false,
          reason: `HTTP ${response.status}`,
          url: plankaBaseUrl
        });
      }
    } catch (error) {
      return NextResponse.json({
        connected: false,
        reason: error instanceof Error ? error.message : 'Connection failed',
        url: plankaBaseUrl
      });
    }
  } catch (error) {
    console.error('[planka-status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check status', connected: false },
      { status: 500 }
    );
  }
}
