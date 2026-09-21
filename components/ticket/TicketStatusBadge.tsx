import React from 'react';
import { Badge, type BadgeVariant } from '@/components/ui';

export type TicketStatus =
  | 'paid'
  | 'waiting_payment'
  | 'pending'
  | 'cancelled'
  | 'used'
  | 'expired'
  | 'refunded'
  | string;

interface TicketStatusConfig {
  label: string;
  variant: BadgeVariant;
}

const TICKET_STATUS_CONFIG: Record<string, TicketStatusConfig> = {
  paid: { label: 'Lunas', variant: 'success' },
  success: { label: 'Berhasil', variant: 'success' },
  waiting_payment: { label: 'Menunggu Pembayaran', variant: 'warning' },
  pending: { label: 'Pending', variant: 'warning' },
  processing: { label: 'Diproses', variant: 'accent' },
  cancelled: { label: 'Dibatalkan', variant: 'danger' },
  canceled: { label: 'Dibatalkan', variant: 'danger' },
  expired: { label: 'Kadaluarsa', variant: 'secondary' },
  used: { label: 'Sudah Digunakan', variant: 'info' },
  refunded: { label: 'Refund', variant: 'secondary' },
};

export interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TicketStatusBadge({ status, className, size = 'sm' }: TicketStatusBadgeProps) {
  const normalized = status ? status.toLowerCase() : 'pending';
  const config = TICKET_STATUS_CONFIG[normalized] || {
    label: status ? status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN',
    variant: 'secondary' as BadgeVariant,
  };

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}
