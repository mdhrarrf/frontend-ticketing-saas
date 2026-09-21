'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let globalShowToast: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export const toast = {
  success: (message: string, title?: string) => {
    globalShowToast?.({ type: 'success', message, title });
  },
  error: (message: string, title?: string) => {
    globalShowToast?.({ type: 'error', message, title });
  },
  warning: (message: string, title?: string) => {
    globalShowToast?.({ type: 'warning', message, title });
  },
  info: (message: string, title?: string) => {
    globalShowToast?.({ type: 'info', message, title });
  },
};

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success shrink-0" />,
  error: <AlertCircle className="h-5 w-5 text-danger shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning shrink-0" />,
  info: <Info className="h-5 w-5 text-accent shrink-0" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toastData: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toastData, id }]);
  }, []);

  // Register global imperative helper
  globalShowToast = showToast;

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.duration ?? 4000}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
            className={cn(
              'flex items-start gap-3 w-[360px] max-w-[90vw] p-4 rounded-lg bg-card border shadow-xl transition-all duration-200',
              t.type === 'success' && 'border-success/30',
              t.type === 'error' && 'border-danger/30',
              t.type === 'warning' && 'border-warning/30',
              t.type === 'info' && 'border-accent/30'
            )}
          >
            {TOAST_ICONS[t.type]}
            <div className="flex-1">
              {t.title && (
                <ToastPrimitive.Title className="text-xs font-bold text-text-primary mb-0.5">
                  {t.title}
                </ToastPrimitive.Title>
              )}
              <ToastPrimitive.Description className="text-xs text-text-secondary leading-snug">
                {t.message}
              </ToastPrimitive.Description>
            </div>
            <ToastPrimitive.Close className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors">
              <X className="h-3.5 w-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 outline-none pointer-events-none [&>*]:pointer-events-auto" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { toast, showToast: globalShowToast, removeToast: () => {} };
  }
  return context;
}
