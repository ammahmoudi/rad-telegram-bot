import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSystemConfig } from '@rad/shared';

/**
 * GET /api/planka-categories
 * Fetch project categories from Planka server
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
    
    if (!plankaBaseUrl) {
      return NextResponse.json({ 
        error: 'Planka server URL not configured',
        categories: [] 
      }, { status: 400 });
    }

    if (!authToken) {
      return NextResponse.json({
        error: 'Not authenticated with Planka. Please login in Settings.',
        categories: []
      }, { status: 401 });
    }

    try {
      // Fetch project categories from Planka API
      const response = await fetch(`${plankaBaseUrl}/api/project-categories`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Planka API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const categories = data.items || data.item || data || [];
      
      return NextResponse.json({ 
        categories: Array.isArray(categories) ? categories : [categories],
        success: true 
      });
    } catch (fetchError: any) {
      console.error('[planka-categories] Fetch error:', fetchError);
      return NextResponse.json({ 
        error: `Failed to fetch from Planka: ${fetchError.message}`,
        categories: []
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[planka-categories] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch categories',
      categories: []
    }, { status: 500 });
  }
}
