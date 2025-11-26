import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple middleware without NextAuth complications
  const { pathname } = request.nextUrl;
  
  // Allow public routes and API routes (especially NextAuth)
  // NextAuth routes must be allowed to pass through without modification
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/register') ||
      pathname === '/' ||
      pathname.startsWith('/api/auth') || // NextAuth routes - must be first
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/_vercel') ||
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }
  
  // For now, allow all other routes
  // Authentication will be handled by components
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
