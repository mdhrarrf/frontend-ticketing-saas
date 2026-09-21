import React from 'react';
import { Badge, type BadgeVariant } from '@/components/ui';

export type EventStatus =
  | 'draft'
  | 'published'
  | 'on_sale'
  | 'cancelled'
  | 'ended'
  | 'sold_out'
  | 'scheduled'
  | string;

interface EventStatusConfig {
  label: string;
  variant: BadgeVariant;
}

const EVENT_STATUS_CONFIG: Record<string, EventStatusConfig> = {
  published: { label: 'Tayang', variant: 'primary' },
  on_sale: { label: 'Sedang Dijual', variant: 'success' },
  draft: { label: 'Draft', variant: 'secondary' },
  scheduled: { label: 'Terjadwal', variant: 'accent' },
  ended: { label: 'Selesai', variant: 'secondary' },
  cancelled: { label: 'Dibatalkan', variant: 'danger' },
  sold_out: { label: 'Habis Terjual', variant: 'warning' },
};

export interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EventStatusBadge({ status, className, size = 'sm' }: EventStatusBadgeProps) {
  const normalized = status ? status.toLowerCase() : 'draft';
  const config = EVENT_STATUS_CONFIG[normalized] || {
    label: status ? status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN',
    variant: 'secondary' as BadgeVariant,
  };

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}
