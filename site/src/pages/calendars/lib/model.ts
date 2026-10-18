import type { Bi } from '../../../shared/types';
import type { Freq, Series } from '../data/sources';

/** A transformed observation; null marks a gap (missing or non-consecutive). */
export interface Point { date: string; value: number | null }

export interface Forecast {
  target: string;
  prediction: number;
  low: number;
  high: number;
  mae: number;
  naiveMae: number;
  n: number;
}

const MIN_CHECKS = 12;
const WINDOW: Record<Freq, number> = { W: 104, M: 36, Q: 20 };

export function nextPeriod(date: string, freq: Freq): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (freq === 'W') d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + (freq === 'Q' ? 3 : 1));
  return d.toISOString().slice(0, 10);
}

/** Convert raw levels to the displayed measure (MoM %, change, annualized %). */
export function transformed(s: Series): Point[] {
  return s.points.map(([date, value], i) => {
    if (value === null) return { date, value: null };
    if (s.transform === 'level') return { date, value };
    const prev = s.points[i - 1];
    if (!prev || prev[1] === null || nextPeriod(prev[0], s.freq) !== date) return { date, value: null };
    const p = prev[1];
    const v = s.transform === 'diff' ? value - p
      : s.transform === 'annual' ? 100 * ((value / p) ** 4 - 1)
        : 100 * (value / p - 1);
    return { date, value: Number.isFinite(v) ? v : null };
  });
}

export function quantile(values: readonly number[], p: number): number | null {
  if (!values.length) return null;
  const a = [...values].sort((x, y) => x - y);
  const k = (a.length - 1) * p;
  const i = Math.floor(k);
  return a[i] + (a[Math.ceil(k)] - a[i]) * (k - i);
}

/** Mean of the three consecutive observations before index `end`. */
function baseline(points: readonly Point[], end: number, freq: Freq): number | null {
  const a = points.slice(end - 3, end);
  if (a.length !== 3 || a.some((x) => x.value === null)) return null;
  for (let i = 1; i < 3; i++) if (nextPeriod(a[i - 1].date, freq) !== a[i].date) return null;
  return a.reduce((sum, x) => sum + (x.value ?? 0), 0) / 3;
}

/** 3-period mean, with a P10–P90 range from its own rolling errors. */
export function forecast(s: Series): Forecast | null {
  const points = transformed(s);
  const prediction = baseline(points, points.length, s.freq);
  const errors: number[] = [];
  const naive: number[] = [];
  for (let i = Math.max(3, points.length - WINDOW[s.freq]); i < points.length; i++) {
    const pred = baseline(points, i, s.freq);
    const cur = points[i].value;
    const prev = points[i - 1].value;
    if (pred === null || cur === null || prev === null || nextPeriod(points[i - 1].date, s.freq) !== points[i].date) continue;
    errors.push(cur - pred);
    naive.push(Math.abs(cur - prev));
  }
  const lo = quantile(errors, 0.1);
  const hi = quantile(errors, 0.9);
  if (prediction === null || errors.length < MIN_CHECKS || lo === null || hi === null) return null;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    target: nextPeriod(points[points.length - 1].date, s.freq),
    prediction, low: prediction + lo, high: prediction + hi,
    mae: mean(errors.map(Math.abs)), naiveMae: mean(naive), n: errors.length,
  };
}

/** Keep the last `years` years (0 = everything). */
export function lastYears(points: readonly Point[], years: number): Point[] {
  if (!years || !points.length) return [...points];
  const d = new Date(`${points[points.length - 1].date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  const from = d.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= from);
}

const RAW_UNITS: Record<string, Bi> = {
  Percent: { en: '%', zh: '%' },
  'Thousands of persons': { en: 'thousand people', zh: '千人' },
  Persons: { en: 'people', zh: '人' },
  'Thousands of units, SAAR': { en: 'thousand units, annual rate', zh: '千套，折年率' },
};

export function unitOf(s: Series): Bi {
  if (s.transform === 'diff') return { en: 'thousand jobs / month', zh: '千人 / 月' };
  if (s.transform === 'pct') return { en: 'MoM %', zh: '环比 %' };
  if (s.transform === 'annual') return { en: 'QoQ annualized %', zh: '环比折年率 %' };
  return RAW_UNITS[s.unit] ?? { en: s.unit, zh: s.unit };
}

export function historyCsv(s: Series): string {
  const rows = transformed(s).map((p, i) => [p.date, s.points[i][1] ?? '', p.value ?? '', s.id].join(','));
  return ['reference_period,raw_value,display_value,series_id', ...rows].join('\r\n') + '\r\n';
}
