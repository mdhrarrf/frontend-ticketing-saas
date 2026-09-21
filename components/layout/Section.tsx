import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'transparent' | 'subtle' | 'card';
}

const SPACING_MAP = {
  none: 'py-0',
  sm: 'py-6 sm:py-8',
  md: 'py-10 sm:py-12',
  lg: 'py-16 sm:py-20',
  xl: 'py-20 sm:py-28',
};

const VARIANT_MAP = {
  transparent: '',
  subtle: 'bg-surface/40 border-y border-border/40',
  card: 'bg-card border-y border-border',
};

export function Section({
  spacing = 'md',
  variant = 'transparent',
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn('w-full', SPACING_MAP[spacing], VARIANT_MAP[variant], className)}
      {...props}
    >
      {children}
    </section>
  );
}
