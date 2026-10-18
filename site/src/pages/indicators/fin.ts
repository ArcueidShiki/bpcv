/* Typed facade over the vendored engines. Importing ./legacy runs the original
   scripts, which attach everything to globalThis.FIN; we read it back once. */
import type { Bi, Category, Entry } from '../../shared/types';
import content from './content.json';
import './legacy';

export type Family = 'technical' | 'fundamental';
export type Series = (number | null)[];

export interface OHLCV { t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[]; n: number }

export interface ParamSpec { k: string; d: number; step?: number; min?: number; max?: number }
export interface SeriesSpec { k: string; color?: string }

export interface RegSpec {
  pane: 'main' | 'sub';
  params?: ParamSpec[];
  series: SeriesSpec[];
  simulated?: boolean;
}

export interface ActiveIndicator {
  id: string;
  spec: RegSpec;
  params: Record<string, number>;
  error: string | null;
}

export interface ChartInstance {
  active: ActiveIndicator[];
  has(id: string): boolean;
  add(id: string, params?: Record<string, number>): ActiveIndicator | null;
  remove(id: string): void;
  get(id: string): ActiveIndicator | null;
  compute(entry: ActiveIndicator): void;
  setData(d: OHLCV): void;
  render(): void;
  resetZoom(): void;
}

interface ChartOptions { canvas: HTMLCanvasElement; data: OHLCV; mini?: boolean }

type CatDef = Bi & { family: Family };

export const UI_KEYS = [
  'subtitle', 'all', 'lab', 'labHint', 'search', 'data', 'newData', 'resetZoom', 'clearAll',
  'none', 'noMatch', 'main', 'sub', 'simulated', 'remove', 'encyclopedia', 'encHint', 'disclaimer',
] as const;
export type UiKey = typeof UI_KEYS[number];

interface Fin {
  Chart: new (opts: ChartOptions) => ChartInstance;
  genOHLCV(n: number, seed: number): OHLCV;
  REG: Record<string, RegSpec>;
  FAMILIES: Record<Family, Bi>;
  CATS: Record<string, CatDef>;
  T: Record<UiKey, Bi>;
}

export const FIN = (globalThis as unknown as { FIN?: Fin }).FIN as Fin;

const missing = !FIN?.Chart || !FIN.REG || !FIN.CATS || UI_KEYS.some((k) => !FIN.T?.[k]);
if (missing) throw new Error('indicators: legacy engines did not initialise FIN');

export const UI: Record<UiKey, Bi> = FIN.T;

export const ENTRIES = content as Entry[];
export const BY_ID: ReadonlyMap<string, Entry> = new Map(ENTRIES.map((e) => [e.id, e]));

export const familyOf = (cat: string): Family => FIN.CATS[cat]?.family ?? 'technical';

/** Category list in display order, optionally limited to one family. */
export function categories(family: Family | ''): Category[] {
  return Object.entries(FIN.CATS)
    .filter(([, c]) => !family || c.family === family)
    .map(([id, c]) => ({ id, label: { en: c.en, zh: c.zh } }));
}

export const isChartable = (id: string): boolean => Boolean(FIN.REG[id]);

/** Default parameter values of an indicator, as a fresh object. */
export function defaultParams(id: string): Record<string, number> {
  return Object.fromEntries((FIN.REG[id]?.params ?? []).map((p) => [p.k, p.d]));
}
