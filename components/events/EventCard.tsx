'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, Zap, Users, Flame } from 'lucide-react';
import type { Event } from '@/types';
import { Card, Badge } from '@/components/ui';
import { formatRupiah, formatDate } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  index?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  concert: 'Concert',
  konser: 'Concert',
  festival: 'Festival',
  fan_meeting: 'Fan Meeting',
  fanmeeting: 'Fan Meeting',
  seminar: 'Seminar',
  sports: 'Sports',
  olahraga: 'Sports',
  exhibition: 'Exhibition',
  pameran: 'Exhibition',
  music: 'Music',
  musik: 'Music',
  theater: 'Theater',
  teater: 'Theater',
  workshop: 'Workshop',
  conference: 'Conference',
};

const GRADIENTS = [
  'from-primary/80 to-purple-900',
  'from-pink-600/80 to-rose-950',
  'from-indigo-600/80 to-slate-950',
  'from-violet-600/80 to-purple-950',
  'from-cyan-600/80 to-blue-950',
];

function EventBanner({ event, index = 0 }: { event: Event; index?: number }) {
  const gradientClass = GRADIENTS[index % GRADIENTS.length];
  const categoryName = event.category
    ? (CATEGORY_LABELS[event.category.toLowerCase()] || event.category)
    : 'Event';

  if (event.banner) {
    return (
      <img
        src={event.banner}
        alt={event.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    );
  }

  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500`}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10 blur-lg" />
      <Ticket className="w-10 h-10 text-white/80 mb-2" />
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">
        {categoryName}
      </span>
    </div>
  );
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const soldPercent =
    event.total_capacity > 0
      ? Math.min(100, Math.round((event.total_sold / event.total_capacity) * 100))
      : 0;
  const isAlmostSoldOut = soldPercent >= 80;
  const categoryDisplay = event.category?.trim()
    ? (CATEGORY_LABELS[event.category.trim().toLowerCase()] || event.category.trim())
    : null;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block h-full select-none focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl"
    >
      <Card
        variant="interactive"
        padding="none"
        className="h-full flex flex-col overflow-hidden border-border/80 group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/5 transition-all duration-300"
      >
        {/* Banner Area */}
        <div className="relative aspect-video w-full overflow-hidden bg-surface">
          <EventBanner event={event} index={index} />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Badges Top */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
            {categoryDisplay && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-sm">
                {categoryDisplay}
              </span>
            )}

            {event.is_war_ticket && (
              <Badge variant="warTicket" size="sm" className="shadow-md shadow-primary/30">
                <Zap className="w-3 h-3 fill-current" /> WAR TICKET
              </Badge>
            )}
          </div>

          {isAlmostSoldOut && (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="danger" size="sm" className="shadow-sm backdrop-blur-md">
                <Flame className="w-3 h-3" /> Hampir Habis
              </Badge>
            </div>
          )}

          {/* Date & Sold Overlay Bottom */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 z-10">
            <div className="flex items-center gap-1.5 font-medium drop-shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{formatDate(event.event_date)}</span>
            </div>
            {event.total_sold > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-white/80">
                <Users className="w-3 h-3" />
                <span>{event.total_sold.toLocaleString('id-ID')} terjual</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
            {event.title}
          </h3>

          {/* Venue */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-4">
            <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="truncate">{event.venue_name ?? event.venue_city ?? 'TBA'}</span>
          </div>

          {/* Stock Bar */}
          {event.total_capacity > 0 && (
            <div className="mb-4 mt-auto">
              <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAlmostSoldOut ? 'bg-danger' : 'bg-primary'
                  }`}
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-text-muted mt-1.5">
                <span>{soldPercent}% terjual</span>
                <span>{(event.total_capacity - event.total_sold).toLocaleString('id-ID')} tersisa</span>
              </div>
            </div>
          )}

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-auto">
            <div>
              {event.min_price !== undefined && (
                <>
                  <div className="text-[10px] uppercase font-semibold text-text-muted">Mulai dari</div>
                  <div className="text-sm sm:text-base font-extrabold text-primary">
                    {formatRupiah(Number(event.min_price))}
                  </div>
                </>
              )}
            </div>

            <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
              {event.is_war_ticket ? (
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" /> War
                </span>
              ) : (
                'Beli Tiket'
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
