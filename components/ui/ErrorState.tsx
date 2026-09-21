import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function ErrorState({
  title = 'Terjadi Kesalahan',
  description = 'Tidak dapat memuat data. Silakan periksa koneksi internet Anda atau coba kembali.',
  onRetry,
  retryText = 'Coba Lagi',
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl bg-danger/5 border border-danger/20',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-base font-bold text-text-primary mb-1">{title}</h4>
      <p className="text-xs text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw size={14} />}
        >
          {retryText}
        </Button>
      )}
    </div>
  );
}
