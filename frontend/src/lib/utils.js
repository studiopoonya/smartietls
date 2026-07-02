import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getBandColor(band) {
  if (!band) return 'var(--text-secondary)';
  if (band >= 8.5) return 'var(--accent-success)';
  if (band >= 7.5) return 'var(--accent-secondary)';
  if (band >= 6.5) return 'var(--accent-primary)';
  if (band >= 5.5) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

export function getBandLabel(band) {
  if (!band) return 'N/A';
  if (band >= 9) return 'Expert';
  if (band >= 8) return 'Very Good';
  if (band >= 7) return 'Good';
  if (band >= 6) return 'Competent';
  if (band >= 5) return 'Modest';
  return 'Limited';
}

export function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
