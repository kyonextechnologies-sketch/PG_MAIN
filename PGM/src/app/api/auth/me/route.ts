import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Get Current Session API Route
 * 
 * Returns the current user session for the requesting tab.
 * Reads the per-tab session cookie based on tabId header.
 */
export async function GET(request: NextRequest) {
  try {
    // Get tabId from request header
    const tabId = request.headers.get('x-tab-id');
    
    if (!tabId) {
      return NextResponse.json(
        { success: false, message: 'Tab ID is required' },
        { status: 400 }
      );
    }

    // Get tab-specific cookie
    const cookieName = `session_${tabId}`;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(cookieName);

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { success: false, message: 'No session found for this tab' },
        { status: 401 }
      );
    }

    // Verify token with backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const baseURL = apiUrl.replace(/\/$/, '');

    const response = await fetch(`${baseURL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        user: data.data?.user || data.user,
        accessToken: sessionCookie.value,
        tabId,
      },
    });
  } catch (error: unknown) {
    console.error('Get session API error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}

