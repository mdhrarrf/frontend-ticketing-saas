'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const difference = new Date(targetDate).getTime() - Date.now();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function FlipUnit({ value, label, size }: { value: number; label: string; size: 'sm' | 'md' | 'lg' }) {
  const padded = String(value).padStart(2, '0');
  const sizeMap = {
    sm: { num: 'text-2xl', lbl: 'text-[0.6rem]' },
    md: { num: 'text-3xl', lbl: 'text-[0.65rem]' },
    lg: { num: 'text-5xl', lbl: 'text-xs' },
  };
  const s = sizeMap[size];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ 
        background: 'rgba(99,102,241,0.06)', 
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 8, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: size === 'sm' ? 44 : 52, 
        height: size === 'sm' ? 44 : 52,
      }}>
        <motion.div
          key={value}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.12 }}
          className={s.num}
          style={{ color: 'var(--color-primary)', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
        >
          {padded}
        </motion.div>
      </div>
      <div className={s.lbl} style={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em', marginTop: 8 }}>{label}</div>
    </div>
  );
}

export function CountdownTimer({ targetDate, label, onComplete, size = 'md' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));
  const [completed, setCompleted] = useState(false);

  const tick = useCallback(() => {
    const t = calculateTimeLeft(targetDate);
    setTimeLeft(t);
    if (!t.days && !t.hours && !t.minutes && !t.seconds) {
      setCompleted(true);
      onComplete?.();
    }
  }, [targetDate, onComplete]);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  if (completed) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-3"
      >
        <span className="animate-pulse-slow" style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.1rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', marginRight: 8 }} /> TIKET SEDANG DIJUAL!
        </span>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {label && (
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <FlipUnit value={timeLeft.days}    label="HARI"  size={size} />
        <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.25rem', paddingTop: '8px' }}>:</span>
        <FlipUnit value={timeLeft.hours}   label="JAM"   size={size} />
        <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.25rem', paddingTop: '8px' }}>:</span>
        <FlipUnit value={timeLeft.minutes} label="MENIT" size={size} />
        <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.25rem', paddingTop: '8px' }}>:</span>
        <FlipUnit value={timeLeft.seconds} label="DETIK" size={size} />
      </div>
    </div>
  );
}
