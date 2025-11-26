import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Logout API Route
 * 
 * Destroys the per-tab session cookie.
 * Only deletes the cookie for the specific tab (tabId).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tabId } = body;

    // Get tab-specific cookie name
    const cookieName = tabId ? `session_${tabId}` : 'session_default';
    
    // Delete the tab-specific cookie
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);

    // Optionally call backend logout endpoint
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const baseURL = apiUrl.replace(/\/$/, '');
      
      // Get access token from cookie for backend logout
      const token = cookieStore.get(cookieName)?.value;
      
      if (token) {
        await fetch(`${baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Ignore backend logout errors
        });
      }
    } catch (error) {
      // Ignore backend logout errors - we've already cleared the cookie
      console.warn('Backend logout failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: unknown) {
    console.error('Logout API error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}

