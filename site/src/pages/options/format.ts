import type { Bi } from '../../shared/types';

export const UNLIMITED: Bi = { en: 'Unlimited', zh: '无限' };

/** Dollars with sign; ±∞ handled by the caller-supplied word so no English
 *  leaks into the Chinese view. */
export function money(x: number, unlimited: string, digits = 0): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : unlimited;
  const abs = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${x < 0 ? '−' : ''}$${abs}`;
}

export const pct = (x: number, d = 1) => (Number.isFinite(x) ? `${(x * 100).toFixed(d)}%` : '∞');

export const num = (x: number, d = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
