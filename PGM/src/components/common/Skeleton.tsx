import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'circular' | 'text' | 'card';
}

export function Skeleton({ 
  className, 
  variant = 'default',
  ...props 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
    card: 'rounded-lg',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  );
}

// Pre-built skeleton components
export function SkeletonCard() {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <Skeleton variant="text" className="w-3/4 h-6" />
      <Skeleton variant="text" className="w-1/2 h-4" />
      <Skeleton variant="text" className="w-full h-4" />
      <Skeleton variant="text" className="w-5/6 h-4" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton variant="text" className="w-1/4 h-4" />
          <Skeleton variant="text" className="w-1/4 h-4" />
          <Skeleton variant="text" className="w-1/4 h-4" />
          <Skeleton variant="text" className="w-1/4 h-4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar() {
  return <Skeleton variant="circular" className="w-12 h-12" />;
}

export function SkeletonButton() {
  return <Skeleton variant="default" className="h-10 w-24 rounded-md" />;
}

