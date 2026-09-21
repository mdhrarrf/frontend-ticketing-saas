import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const ROUNDED_MAP = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton bg-surface-elevated/60 shrink-0', ROUNDED_MAP[rounded], className)}
      {...props}
    />
  );
}
