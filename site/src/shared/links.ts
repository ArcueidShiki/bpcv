import type { Bi, Lang } from './types';
import tycoonLinks from './tycoon-links.json';

export type PageId = 'index' | 'orders' | 'indicators' | 'options' | 'math' | 'calendars' | 'tycoon';

export const NAV: { id: PageId; href: string; label: Bi }[] = [
  { id: 'orders', href: 'orders.html', label: { en: 'Orders', zh: '订单' } },
  { id: 'indicators', href: 'indicators.html', label: { en: 'Indicators', zh: '指标' } },
  { id: 'options', href: 'options.html', label: { en: 'Options', zh: '期权' } },
  { id: 'math', href: 'math.html', label: { en: 'Math', zh: '数学' } },
  { id: 'calendars', href: 'calendars.html', label: { en: 'Calendar', zh: '经济日历' } },
  { id: 'tycoon', href: 'market-tycoon.html', label: { en: 'Market Tycoon', zh: '股市大亨' } },
];

export type Handbook = 'orders' | 'indicators' | 'options';

/** Handbook entry id -> Market Tycoon deep-link query (e.g. "lesson=LMT").
 *  Only entries the game can actually open are listed; the rest get no button. */
const MAP = tycoonLinks as Record<Handbook, Record<string, string>>;

export function tycoonHref(book: Handbook, id: string, lang: Lang): string | null {
  const q = MAP[book]?.[id];
  return q ? `market-tycoon.html?${q}&lang=${lang}` : null;
}

export function entryHref(book: Handbook, id: string, lang: Lang): string {
  return `${book}.html?lang=${lang}#${encodeURIComponent(id)}`;
}
