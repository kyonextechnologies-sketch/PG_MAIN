declare module 'framer-motion';
declare module '@hookform/resolvers/zod';

import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'OWNER' | 'TENANT' | 'ADMIN';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: 'OWNER' | 'TENANT' | 'ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'OWNER' | 'TENANT' | 'ADMIN';
    id: string;
  }
}