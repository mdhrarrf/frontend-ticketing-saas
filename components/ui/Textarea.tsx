import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'w-full min-h-[90px] px-3.5 py-2.5 rounded-md text-sm text-text-primary bg-card border border-border transition-all duration-200',
          'placeholder:text-text-muted/60',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
