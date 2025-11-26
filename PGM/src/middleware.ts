import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for per-tab session isolation
 * 
 * Reads tabId from request headers and validates the corresponding session cookie.
 * Each tab maintains its own independent session cookie.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes and API routes
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/register') ||
      pathname === '/' ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/_vercel') ||
      pathname.startsWith('/favicon.ico')) {
    
    // For API routes, handle per-tab cookie isolation
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/login') && !pathname.startsWith('/api/auth/logout')) {
      // Get tabId from request header
      const tabId = request.headers.get('x-tab-id');
      
      if (tabId) {
        // Check if session cookie exists for this tab
        const cookieName = `session_${tabId}`;
        const sessionCookie = request.cookies.get(cookieName);
        
        // Add cookie to request headers for backend API calls
        // The backend will read this cookie for authentication
        const response = NextResponse.next();
        
        if (sessionCookie) {
          // Forward the session cookie to the backend
          response.headers.set('X-Session-Cookie', sessionCookie.value);
          response.headers.set('X-Tab-ID', tabId);
        }
        
        return response;
      }
    }
    
    return NextResponse.next();
  }
  
  // For protected routes, check for session
  // This will be handled by client-side components
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
