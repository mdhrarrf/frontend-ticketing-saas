'use client';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showClose?: boolean;
}

const MAX_WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[95vw] md:max-w-4xl',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  showClose = true,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-200 data-[state=open]:animate-fadeIn data-[state=closed]:opacity-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card border border-border p-6 shadow-2xl focus:outline-none transition-all duration-200 max-h-[90vh] overflow-y-auto',
            MAX_WIDTHS[maxWidth]
          )}
        >
          {(title || showClose) && (
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-border">
              <div>
                {title && (
                  <DialogPrimitive.Title className="text-lg font-bold text-text-primary tracking-tight">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="text-xs text-text-secondary mt-1">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              {showClose && (
                <DialogPrimitive.Close className="rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Tutup</span>
                </DialogPrimitive.Close>
              )}
            </div>
          )}

          <div className="w-full text-text-primary">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
