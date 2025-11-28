import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/dashboard/revenue
 * 
 * Returns aggregated revenue data for the owner's dashboard
 * Groups revenue by month from invoices and payments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (role !== 'OWNER') {
      return NextResponse.json(
        { success: false, message: 'Only owners can access this endpoint' },
        { status: 403 }
      );
    }

    // Get backend API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const baseURL = apiUrl.replace(/\/$/, '');
    const accessToken = (session as any).accessToken;

    // Call backend revenue endpoint
    const response = await fetch(`${baseURL}/dashboard/revenue`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch revenue data' }));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch revenue data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Revenue API error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}

