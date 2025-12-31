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

    // Get Planka base URL from system config
    const plankaBaseUrl = await getSystemConfig('PLANKA_BASE_URL');
    
    if (!plankaBaseUrl) {
      return NextResponse.json({ 
        error: 'Planka server URL not configured',
        categories: [] 
      }, { status: 400 });
    }

    // For now, return empty array since we'd need admin credentials to fetch
    // In production, you'd either:
    // 1. Store admin Planka token in system config
    // 2. Have users authenticate via OAuth
    // 3. Have a dedicated service account
    
    return NextResponse.json({
      categories: [],
      message: 'Project categories require Planka admin authentication. Please set category ID manually or authenticate.'
    });

    // TODO: Implement actual fetching when admin auth is available
    // const response = await fetch(`${plankaBaseUrl}/api/project-categories`, {
    //   headers: {
    //     'Authorization': `Bearer ${adminToken}`,
    //   },
    // });
    // const categories = await response.json();
    // return NextResponse.json({ categories });

  } catch (error) {
    console.error('[planka-categories] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch categories',
      categories: []
    }, { status: 500 });
  }
}
