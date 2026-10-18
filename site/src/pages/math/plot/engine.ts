import '../legacy';

/** Typed view of the vendored plotting layer (legacy/plot.js → globalThis.MF.P). */
export interface Frame {
  ctx: CanvasRenderingContext2D;
  w: number; h: number; l: number; t: number; iw: number; ih: number;
  x0: number; x1: number; y0: number; y1: number;
  X: (x: number) => number;
  Y: (y: number) => number;
}
type Fmt = ((v: number) => string) | false;
type Pt = [number, number];
interface LineOpt { w?: number; dash?: number[]; fill?: string; close?: boolean; n?: number }

export interface PlotApi {
  col: (name: string) => string;
  fit: (cv: HTMLCanvasElement) => { ctx: CanvasRenderingContext2D; w: number; h: number };
  frame: (cv: HTMLCanvasElement, x0: number, x1: number, y0: number, y1: number,
          pad?: { l?: number; r?: number; t?: number; b?: number }) => Frame;
  grid: (F: Frame, opt?: { nx?: number; ny?: number; fmtX?: Fmt; fmtY?: Fmt }) => void;
  fn: (F: Frame, f: (x: number) => number, col: string, opt?: LineOpt) => void;
  line: (F: Frame, pts: Pt[], col: string, opt?: LineOpt) => void;
  dot: (F: Frame, x: number, y: number, col: string, r?: number) => void;
  vline: (F: Frame, x: number, col: string, opt?: { w?: number; dash?: number[]; label?: string }) => void;
  label: (F: Frame, x: number, y: number, text: string, col: string,
          opt?: { size?: number; align?: CanvasTextAlign; base?: CanvasTextBaseline; dx?: number; dy?: number }) => void;
  bars: (F: Frame, xs: number[], ys: number[], col: string, opt?: { frac?: number }) => void;
  ncdf: (x: number) => number;
  npdf: (x: number) => number;
  rng: (seed: number) => () => number;
  gauss: (rnd: () => number) => number;
  fmt: (x: number, d?: number) => string;
}

/** Read lazily so the legacy script has certainly run. */
export function plot(): PlotApi {
  const mf = (globalThis as unknown as { MF?: { P?: PlotApi } }).MF;
  if (!mf?.P) throw new Error('plot engine (MF.P) not loaded');
  return mf.P;
}

/** Series colours, defined as CSS tokens in math.css. */
export const C = {
  f: () => plot().col('--c-f'),
  d1: () => plot().col('--c-d1'),
  d2: () => plot().col('--c-d2'),
  d3: () => plot().col('--c-d3'),
  aux: () => plot().col('--c-aux'),
  dim: () => plot().col('--text-3'),
  gold: () => plot().col('--gold'),
};

export type { Pt };
