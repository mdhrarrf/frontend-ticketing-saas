'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, Ticket, Zap,
  ChevronLeft, ChevronRight, Music2, Mic2, Theater, BookOpen, Trophy, Globe
} from 'lucide-react';
import { EventCard } from '../../../components/events/EventCard';
import { apiService } from '../../../lib/api';
import type { Event } from '../../../types';

const CATEGORIES = [
  { value: '', label: 'Semua' },
  { value: 'concert',    label: 'Concert',      icon: Music2 },
  { value: 'festival',   label: 'Festival',     icon: Theater },
  { value: 'fan_meeting',label: 'Fan Meeting',  icon: Mic2 },
  { value: 'seminar',    label: 'Seminar',      icon: BookOpen },
  { value: 'sports',     label: 'Sports',       icon: Trophy },
  { value: 'exhibition', label: 'Exhibition',   icon: Globe },
];

const SORT_OPTIONS = [
  { value: '',               label: 'Terpopuler' },
  { value: 'event_date_asc', label: 'Paling Dekat' },
  { value: 'price_asc',      label: 'Harga Terendah' },
  { value: 'price_desc',     label: 'Harga Tertinggi' },
  { value: 'newest',         label: 'Terbaru' },
];

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function EventsContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [events,    setEvents]    = useState<Event[]>([]);
  const [meta,      setMeta]      = useState<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 12 });
  const [loading,   setLoading]   = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search,   setSearch]   = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [warOnly,  setWarOnly]  = useState(searchParams.get('war_ticket') === 'true');
  const [sort,     setSort]     = useState('');
  const [page,     setPage]     = useState(Number(searchParams.get('page') ?? 1));

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 12 };
      if (search)   params.search     = search;
      if (category) params.category   = category;
      if (warOnly)  params.war_ticket = true;
      if (sort)     params.sort       = sort;

      const res = await apiService.events.getEvents(params);
      const d   = (res as any)?.data ?? res;
      setEvents(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      if (d?.meta) setMeta(d.meta);
      else if (d?.current_page) setMeta({ current_page: d.current_page, last_page: d.last_page, total: d.total, per_page: d.per_page });
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, warOnly, sort, page]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Sync URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (search)   p.set('q', search);
    if (category) p.set('category', category);
    if (warOnly)  p.set('war_ticket', 'true');
    if (page > 1) p.set('page', String(page));
    router.replace(`/events${p.size ? `?${p.toString()}` : ''}`, { scroll: false });
  }, [search, category, warOnly, page, router]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); loadEvents(); };
  const resetFilters = () => { setSearch(''); setCategory(''); setWarOnly(false); setSort(''); setPage(1); };
  const hasFilters   = search || category || warOnly || sort;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 80 }}>
      <div className="container">

        {/* ─── PAGE HEADER ─────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', marginBottom: 8, color: 'var(--text-primary)', fontWeight: 800 }}>
            Jelajahi Event
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {meta.total > 0 ? `${meta.total.toLocaleString('id-ID')} event ditemukan` : 'Temukan konser & event favoritmu'}
          </p>
        </div>

        {/* ─── SEARCH + CONTROLS ───────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 240, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); if (!e.target.value) setPage(1); }}
                placeholder="Cari event, artis, venue..."
                className="input"
                style={{ paddingLeft: 42 }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Cari</button>
          </form>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            className="input"
            style={{ width: 'auto', minWidth: 160 }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ position: 'relative' }}
          >
            <SlidersHorizontal size={16} />
            Filter
            {hasFilters && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--color-secondary)', fontSize: '0.65rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>!</span>
            )}
          </button>

          {hasFilters && (
            <button onClick={resetFilters} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
              <X size={14} /> Reset
            </button>
          )}
        </div>

        {/* ─── FILTER PANEL ────────────────────────────────── */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: 24, borderRadius: 16, marginBottom: 24,
              background: 'var(--card)', border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {/* Category filter */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <label className="label" style={{ marginBottom: 12 }}>Kategori</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => { setCategory(c.value); setPage(1); }}
                      style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        border: category === c.value ? '1px solid var(--color-primary)' : '1px solid var(--border)',
                        background: category === c.value
                          ? 'var(--color-primary)'
                          : 'var(--background)',
                        color: category === c.value ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.icon && <c.icon size={14} />}
                        {c.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* War ticket toggle */}
              <div>
                <label className="label" style={{ marginBottom: 12 }}>Tipe</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div
                    onClick={() => { setWarOnly(!warOnly); setPage(1); }}
                    style={{
                      width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
                      background: warOnly
                        ? 'var(--color-primary)'
                        : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.2s',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', left: warOnly ? 22 : 2,
                    }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={14} style={{ color: warOnly ? '#F59E0B' : 'var(--text-muted)' }} />
                    War Ticket only
                  </span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── ACTIVE FILTER CHIPS ─────────────────────────── */}
        {hasFilters && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {search && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <Search size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--text-secondary)' }} /> "{search}"
                <button onClick={() => { setSearch(''); setPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 0, padding: 0 }}><X size={12} /></button>
              </span>
            )}
            {category && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {CATEGORIES.find(c => c.value === category)?.label}
                <button onClick={() => { setCategory(''); setPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 0, padding: 0 }}><X size={12} /></button>
              </span>
            )}
            {warOnly && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <Zap size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> War Ticket
                <button onClick={() => { setWarOnly(false); setPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 0, padding: 0 }}><X size={12} /></button>
              </span>
            )}
          </div>
        )}

        {/* ─── EVENTS GRID ─────────────────────────────────── */}
        {loading ? (
          <div className="grid-events">
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ borderRadius: 20, overflow: 'hidden' }}>
                <div className="skeleton" style={{ aspectRatio: '16/9', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 18, width: '85%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 6, marginBottom: 8 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton" style={{ height: 20, width: '35%' }} />
                  <div className="skeleton" style={{ height: 32, width: '28%', borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid-events">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ height: '100%' }}
                >
                  <EventCard event={event} index={i} />
                </motion.div>
              ))}
            </div>

            {/* ─── PAGINATION ──────────────────────────────── */}
            {meta.last_page > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 48 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={meta.current_page === 1}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={16} />
                </button>

                {[...Array(meta.last_page)].map((_, i) => {
                  const p = i + 1;
                  const isActive = p === meta.current_page;
                  if (Math.abs(p - meta.current_page) > 2 && p !== 1 && p !== meta.last_page) {
                    if (p === meta.current_page - 3 || p === meta.current_page + 3) {
                      return <span key={p} style={{ color: 'var(--text-muted)' }}>…</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontWeight: isActive ? 700 : 400,
                        background: isActive
                          ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                          : 'rgba(255,255,255,0.05)',
                        color: isActive ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page === meta.last_page}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 16 }}>
              Menampilkan {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} dari {meta.total.toLocaleString('id-ID')} event
            </p>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '80px 0' }}
          >
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}><Ticket size={64} style={{ color: 'var(--text-muted)' }} /></div>
            <h2 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>Tidak ada event ditemukan</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
              Coba ubah filter atau kata kunci pencarianmu
            </p>
            <button onClick={resetFilters} className="btn btn-primary">
              <X size={16} /> Reset Filter
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} className="animate-spin" />
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}
