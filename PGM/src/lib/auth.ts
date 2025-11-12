import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get baseURL and ensure proper protocol
          let baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
          
          // Ensure baseURL has proper protocol
          if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
            // Default to HTTPS in production, HTTP in development
            baseURL = `https://${baseURL}`;
          }
          
          // Remove trailing slash
          baseURL = baseURL.replace(/\/$/, '');
          
          // Call the backend login endpoint
          const apiUrl = `${baseURL}/auth/login`;
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          // Check if response is JSON before parsing
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response from API:', text.substring(0, 200));
            return null;
          }

          const result = await response.json();

          if (!response.ok || !result.success) {
            console.log('Login failed:', result.message);
            return null;
          }

          // Return user data from backend
          const userData = result.data?.user;
          if (userData) {
            return {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
            };
          }

          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'OWNER' | 'TENANT';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: process.env.NODE_ENV === 'development',
};