import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const iconButtonVariants = cva(
  'inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none active:scale-95',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
        secondary: 'bg-surface-elevated text-text-primary hover:bg-border-bright border border-border',
        outline: 'border border-border-bright text-text-secondary hover:text-white hover:border-primary bg-transparent',
        ghost: 'text-text-secondary hover:text-white hover:bg-surface-elevated',
        danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30',
      },
      size: {
        sm: 'h-8 w-8 rounded-sm',
        md: 'h-10 w-10 rounded-md',
        lg: 'h-12 w-12 rounded-lg',
      },
      shape: {
        rounded: '',
        circle: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
      shape: 'rounded',
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  'aria-label': string;
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, shape, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(iconButtonVariants({ variant, size, shape, className }))}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
