import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

// Export handlers for GET and POST requests
export { handler as GET, handler as POST };

// Ensure this is a dynamic route (not statically generated)
export const dynamic = 'force-dynamic';

// Runtime configuration
export const runtime = 'nodejs';