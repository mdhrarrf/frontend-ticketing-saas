import React from 'react';
import { Card, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconColorClass?: string;
  iconBgClass?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColorClass = 'text-primary',
  iconBgClass = 'bg-primary/10 border-primary/20',
  trend,
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card variant="default" className={cn('p-5', className)}>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-7 w-36 mb-2" />
        <Skeleton className="h-3 w-20" />
      </Card>
    );
  }

  return (
    <Card
      variant="interactive"
      className={cn('p-5 flex flex-col justify-between transition-all duration-200', className)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0',
              iconBgClass,
              iconColorClass
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-extrabold text-text-primary tracking-tight mb-1">
          {value}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 font-semibold',
                trend.isPositive ? 'text-success' : 'text-danger'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-text-muted">{subtitle}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
