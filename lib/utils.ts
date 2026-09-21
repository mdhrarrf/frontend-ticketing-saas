import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility to conditionally merge Tailwind CSS class names
 * using clsx and tailwind-merge to avoid specificity conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to Indonesian Rupiah (IDR).
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date string to Indonesian localized format.
 */
export function formatDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return '-';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  return new Date(dateString).toLocaleDateString('id-ID', defaultOptions);
}
