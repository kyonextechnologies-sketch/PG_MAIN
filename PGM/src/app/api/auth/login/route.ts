import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Login API Route
 * 
 * Handles login and creates per-tab session cookies.
 * Expects tabId in request header to create tab-specific cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, tabId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get backend API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const baseURL = apiUrl.replace(/\/$/, '');

    // Call backend login endpoint
    const response = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Login failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return NextResponse.json(
        { success: false, message: data.message || 'Login failed' },
        { status: 401 }
      );
    }

    const { user, accessToken } = data.data;

    // Generate tab-specific cookie name
    const cookieName = tabId ? `session_${tabId}` : 'session_default';
    
    // Set per-tab session cookie
    const cookieStore = await cookies();
    cookieStore.set(cookieName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        tabId,
        cookieName,
      },
    });
  } catch (error: unknown) {
    console.error('Login API error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}

