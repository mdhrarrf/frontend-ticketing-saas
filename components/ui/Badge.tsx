import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider rounded-full select-none transition-colors duration-150',
  {
    variants: {
      variant: {
        default:
          'bg-surface-elevated text-text-secondary border border-border',
        primary:
          'bg-primary/15 text-primary border border-primary/30',
        secondary:
          'bg-secondary/15 text-secondary border border-secondary/30',
        accent:
          'bg-accent/15 text-accent border border-accent/30',
        success:
          'bg-success/15 text-success border border-success/30',
        warning:
          'bg-warning/15 text-warning border border-warning/30',
        danger:
          'bg-danger/15 text-danger border border-danger/30',
        info:
          'bg-info/15 text-info border border-info/30',
        warTicket:
          'bg-gradient-to-r from-danger/20 to-warning/20 text-red-300 border border-danger/40 animate-pulse-badge',
        outline:
          'bg-transparent text-text-primary border border-border-bright',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5 leading-normal',
        md: 'text-xs px-2.5 py-1 leading-normal',
        lg: 'text-xs px-3 py-1.5 font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>['size']>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
