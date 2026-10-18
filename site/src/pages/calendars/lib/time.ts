import type { Bi, Lang } from '../../../shared/types';

export const ZONES: { id: string; label: Bi }[] = [
  { id: 'America/New_York', label: { en: 'New York (ET)', zh: '美东（纽约）' } },
  { id: 'Australia/Perth', label: { en: 'Perth (UTC+8)', zh: '珀斯（UTC+8）' } },
  { id: 'Asia/Shanghai', label: { en: 'Beijing (UTC+8)', zh: '北京（UTC+8）' } },
];

export const locale = (lang: Lang) => (lang === 'zh' ? 'zh-CN' : 'en-US');

/** YYYY-MM-DD of an instant, as seen in `zone`. */
export function dateKey(at: string | Date, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(at));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function dateLabel(at: string, zone: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: zone, month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(at));
}

export function monthLabel(ym: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { year: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${ym}-01T00:00:00Z`));
}

export function fmt(v: number | null, lang: Lang, digits = 3): string {
  return v === null || !Number.isFinite(v) ? '—'
    : new Intl.NumberFormat(locale(lang), { maximumFractionDigits: digits }).format(v);
}
