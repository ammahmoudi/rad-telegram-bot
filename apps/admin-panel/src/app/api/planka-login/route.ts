import { setSystemConfig, getSystemConfig } from '@rad/shared';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const plankaUsername = formData.get('plankaUsername');
    const plankaPassword = formData.get('plankaPassword');

    if (!plankaUsername || !plankaPassword || typeof plankaUsername !== 'string' || typeof plankaPassword !== 'string') {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get Planka base URL
    const baseUrl = await getSystemConfig('PLANKA_BASE_URL');
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Planka Base URL must be set before logging in. Please configure it first.' },
        { status: 400 }
      );
    }

    try {
      // Login to Planka
      const loginResponse = await fetch(`${baseUrl}/api/access-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: plankaUsername.trim(),
          password: plankaPassword,
        }),
      });

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('Planka login failed:', loginResponse.status, errorText);
        return NextResponse.json(
          { error: 'Failed to authenticate with Planka. Please check your credentials.' },
          { status: 401 }
        );
      }

      const data = await loginResponse.json();
      // Planka returns the token directly as the 'item' property
      const token = (typeof data.item === 'string' ? data.item : data.item?.accessToken) || data.accessToken;
      
      if (token) {
        await setSystemConfig('PLANKA_AUTH_TOKEN', token);
        
        // Return success JSON response
        return NextResponse.json({ success: true, message: 'Successfully authenticated with Planka' });
      } else {
        console.error('No token in Planka response:', data);
        return NextResponse.json(
          { error: 'Failed to retrieve access token from Planka' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Planka login error:', error);
      return NextResponse.json(
        { error: 'Failed to connect to Planka server. Please check the Planka Base URL.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error during Planka login:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
