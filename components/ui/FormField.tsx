import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold text-text-secondary flex items-center gap-1 select-none"
        >
          <span>{label}</span>
          {required && <span className="text-danger">*</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <p className="text-xs text-text-muted mt-0.5">{hint}</p>
      )}

      {error && (
        <p className="text-xs text-danger flex items-center gap-1.5 mt-0.5 font-medium animate-fadeIn">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
