'use client';

import { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/lib/types';

interface RequireRoleProps {
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ role, children, fallback }: RequireRoleProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== role) {
      if (!fallback) {
        router.push('/unauthorized');
      }
    }
  }, [status, session, role, router, fallback]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (session.user?.role !== role) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated' && !fallback) {
      router.push('/login');
    }
  }, [status, router, fallback]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}

interface RoleBasedRenderProps {
  owner?: ReactNode;
  tenant?: ReactNode;
  fallback?: ReactNode;
}

export function RoleBasedRender({ owner, tenant, fallback }: RoleBasedRenderProps) {
  const { data: session } = useSession();

  if (!session) {
    return <>{fallback}</>;
  }

  if (session.user?.role === 'OWNER' && owner) {
    return <>{owner}</>;
  }

  if (session.user?.role === 'TENANT' && tenant) {
    return <>{tenant}</>;
  }

  return <>{fallback}</>;
}
