import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-text-muted pointer-events-none shrink-0">
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full h-10 px-3.5 py-2 rounded-md text-sm text-text-primary bg-card border border-border transition-all duration-200',
            'placeholder:text-text-muted/60',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 text-text-muted pointer-events-none shrink-0">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
