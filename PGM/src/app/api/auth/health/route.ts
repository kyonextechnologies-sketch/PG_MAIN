/**
 * Health check endpoint for NextAuth
 * This helps verify that the API routes are accessible
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'next-auth',
    timestamp: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';

