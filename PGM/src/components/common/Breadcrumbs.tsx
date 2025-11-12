'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname);

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      <Link
        href="/"
        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            {isLast || !item.href ? (
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Format segment name
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });
  
  return items;
}

