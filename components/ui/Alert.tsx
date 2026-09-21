import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const alertVariants = cva(
  'w-full flex items-start gap-3 p-4 rounded-lg border text-xs leading-relaxed transition-all duration-200',
  {
    variants: {
      variant: {
        info: 'bg-info/10 border-info/30 text-sky-200',
        success: 'bg-success/10 border-success/30 text-emerald-200',
        warning: 'bg-warning/10 border-warning/30 text-amber-200',
        danger: 'bg-danger/10 border-danger/30 text-red-200',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const ALERT_ICONS = {
  info: <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />,
  success: <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />,
  danger: <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  onClose?: () => void;
}

export function Alert({
  className,
  variant = 'info',
  title,
  onClose,
  children,
  ...props
}: AlertProps) {
  return (
    <div className={cn(alertVariants({ variant, className }))} {...props}>
      {ALERT_ICONS[variant ?? 'info']}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-bold text-text-primary mb-0.5 text-xs">{title}</h5>}
        <div className="text-text-secondary">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Tutup</span>
        </button>
      )}
    </div>
  );
}
