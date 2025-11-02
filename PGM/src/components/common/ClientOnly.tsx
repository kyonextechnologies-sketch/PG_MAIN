'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback for better performance
    const timer = typeof requestIdleCallback !== 'undefined' ? 
      requestIdleCallback(() => setHasMounted(true)) :
      setTimeout(() => setHasMounted(true), 0);
    
    return () => {
      if (typeof requestIdleCallback !== 'undefined') {
        cancelIdleCallback(timer as number);
      } else {
        clearTimeout(timer as NodeJS.Timeout);
      }
    };
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
