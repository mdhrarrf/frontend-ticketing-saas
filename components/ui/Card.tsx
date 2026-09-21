import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const cardVariants = cva(
  'rounded-lg transition-all duration-200 text-text-primary overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-card border border-border shadow-sm',
        elevated: 'bg-card border border-border shadow-lg shadow-black/20',
        bordered: 'bg-transparent border border-border-bright',
        interactive:
          'bg-card border border-border hover:border-border-bright hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer',
        glass:
          'bg-card/75 backdrop-blur-md border border-border/80 shadow-md',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-5 md:p-6',
        lg: 'p-6 md:p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 mb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-bold text-text-primary tracking-tight leading-snug', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-text-secondary leading-relaxed', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('w-full', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';
