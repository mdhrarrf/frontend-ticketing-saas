import React from 'react';
import { Spinner } from './Spinner';
import { Skeleton } from './Skeleton';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'card' | 'table';
  count?: number;
  className?: string;
}

export function LoadingState({
  message = 'Memuat data...',
  variant = 'spinner',
  count = 3,
  className,
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center min-h-[220px] p-8 gap-3 text-center',
          className
        )}
      >
        <Spinner size="lg" />
        {message && <p className="text-xs text-text-muted font-medium">{message}</p>}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full',
          className
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-lg bg-card border border-border flex flex-col gap-4"
          >
            <Skeleton className="h-44 w-full rounded-md" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center mt-2 pt-3 border-t border-border">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // table skeleton
  return (
    <div className={cn('w-full flex flex-col gap-3', className)}>
      <Skeleton className="h-10 w-full rounded-md" />
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-md" />
      ))}
    </div>
  );
}
