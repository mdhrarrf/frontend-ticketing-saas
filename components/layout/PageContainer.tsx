import React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const SIZE_MAP = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  full: 'max-w-full',
};

export function PageContainer({
  size = 'lg',
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto px-6 sm:px-8 lg:px-10',
        SIZE_MAP[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
