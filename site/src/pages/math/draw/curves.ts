import type { Bi } from '../../../shared/types';
import { C, plot } from '../plot/engine';

type Fn = (x: number) => number;

export interface Shape { n: Bi; fx: string; d: [number, number, number, number]; f: Fn; f2?: Fn; p: Bi }

const ncdf: Fn = (x) => plot().ncdf(x);
const npdf: Fn = (x) => plot().npdf(x);

export const SHAPES: Shape[] = [
  { n: { en: 'Linear', zh: '线性' }, fx: 'y = ax + b', d: [-3, 3, -3, 3], f: (x) => 0.8 * x + 0.3,
    p: { en: 'Constant slope, no convexity.', zh: '斜率恒定，没有凸性。' } },
  { n: { en: 'Quadratic', zh: '二次' }, fx: 'y = x²', d: [-3, 3, -0.5, 8], f: (x) => x * x,
    p: { en: 'The shape of pure gamma.', zh: '纯 Gamma 的形状。' } },
  { n: { en: 'Cubic', zh: '三次' }, fx: 'y = x³ − 3x', d: [-2.4, 2.4, -4, 4], f: (x) => x * x * x - 3 * x,
    p: { en: 'Two turns, one inflection.', zh: '两个极值、一个拐点。' } },
  { n: { en: 'Exponential', zh: '指数' }, fx: 'y = eˣ,  y = e⁻ˣ', d: [-2.5, 2.5, 0, 8], f: Math.exp, f2: (x) => Math.exp(-x),
    p: { en: 'Compounding and discounting.', zh: '复利与折现。' } },
  { n: { en: 'Logarithm', zh: '对数' }, fx: 'y = ln x', d: [0.05, 6, -3, 2], f: Math.log,
    p: { en: 'Turns products into sums.', zh: '把乘积变成求和。' } },
  { n: { en: 'Logistic', zh: 'S 型' }, fx: 'y = 1/(1+e⁻ˣ)', d: [-6, 6, -0.1, 1.1], f: (x) => 1 / (1 + Math.exp(-x)),
    p: { en: 'Delta against spot.', zh: 'Delta 对股价。' } },
  { n: { en: 'Gaussian pair', zh: '高斯一对' }, fx: 'φ(x), N(x)', d: [-3.5, 3.5, -0.05, 1.05], f: ncdf, f2: npdf,
    p: { en: 'Density and running total.', zh: '密度与累积。' } },
  { n: { en: 'Power law', zh: '幂律' }, fx: 'y = x⁻ᵅ', d: [0.15, 5, 0, 6], f: (x) => Math.pow(x, -1.5),
    p: { en: 'Fat tails in real returns.', zh: '真实收益的肥尾。' } },
];

export function drawShape(cv: HTMLCanvasElement, s: Shape) {
  const P = plot();
  const F = P.frame(cv, s.d[0], s.d[1], s.d[2], s.d[3], { l: 24, b: 16, t: 8, r: 8 });
  P.grid(F, { nx: 4, ny: 3, fmtX: false, fmtY: false });
  if (s.f2) P.fn(F, s.f2, C.d1(), { w: 1.6 });
  P.fn(F, s.f, C.d2(), { w: 2 });
}

/* ------------------------------------------------------------------ Taylor */
const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));

export type TayId = 'exp' | 'sin' | 'log' | 'geo';
interface Tay { id: TayId; lbl: string; f: Fn; d: [number, number, number, number]; c: (a: number, k: number) => number }

export const TAY: Tay[] = [
  { id: 'exp', lbl: 'eˣ', f: Math.exp, d: [-3, 3, -1, 9], c: (a, k) => Math.exp(a) / fact(k) },
  { id: 'sin', lbl: 'sin x', f: Math.sin, d: [-7, 7, -2.2, 2.2], c: (a, k) => Math.sin(a + k * Math.PI / 2) / fact(k) },
  { id: 'log', lbl: 'ln(1+x)', f: (x) => Math.log(1 + x), d: [-0.9, 3, -3, 2],
    c: (a, k) => (k === 0 ? Math.log(1 + a) : Math.pow(-1, k - 1) / (k * Math.pow(1 + a, k))) },
  { id: 'geo', lbl: '1/(1−x)', f: (x) => 1 / (1 - x), d: [-2, 0.95, -2, 8], c: (a, k) => 1 / Math.pow(1 - a, k + 1) },
];

export const tayById = (id: TayId): Tay => TAY.find((t) => t.id === id) ?? TAY[0];

/** Keep the expansion point inside the function's domain. */
export function clampCenter(id: TayId, a: number): number {
  if (id === 'log' && a <= -0.9) return -0.85;
  if (id === 'geo' && a >= 0.95) return 0.9;
  return a;
}

export function taylorAt(e: Tay, a: number, n: number): Fn {
  const coef = Array.from({ length: n + 1 }, (_, k) => e.c(a, k));
  return (x) => coef.reduce((s, c, i) => s + c * Math.pow(x - a, i), 0);
}

export function taylorStats(e: Tay, a: number, n: number) {
  const approx = taylorAt(e, a, n);
  const near = a + 0.5, far = a + (e.d[1] - a) * 0.75;
  return { near: Math.abs(e.f(near) - approx(near)), far: Math.abs(e.f(far) - approx(far)) };
}

export function termsText(e: Tay, a: number, n: number): string {
  const terms = Array.from({ length: Math.min(n, 4) + 1 }, (_, k) => [k, e.c(a, k)] as const)
    .filter(([, c]) => isFinite(c) && Math.abs(c) >= 1e-9)
    .map(([k, c]) => (c > 0 && k > 0 ? '+' : '') + c.toFixed(3) + (k === 0 ? '' : '(x−a)' + (k > 1 ? '^' + k : '')));
  return terms.join(' ') + (n > 4 ? ' …' : '');
}

export function drawTaylor(cv: HTMLCanvasElement, e: Tay, a: number, n: number) {
  const P = plot();
  const approx = taylorAt(e, a, n);
  const F = P.frame(cv, e.d[0], e.d[1], e.d[2], e.d[3], { l: 40, b: 28 });
  P.grid(F, { nx: 8, ny: 5, fmtY: (v) => v.toFixed(1) });

  /* |error| ribbon along the bottom, scaled into the lower fifth */
  const span = F.y1 - F.y0, base = F.y0 + span * 0.02;
  const xs = Array.from({ length: 241 }, (_, i) => F.x0 + (F.x1 - F.x0) * i / 240);
  const errs = xs.map((x) => Math.abs(e.f(x) - approx(x)));
  const maxE = errs.reduce((m, er) => (isFinite(er) ? Math.max(m, Math.min(er, span)) : m), 0);
  if (maxE > 1e-12) {
    const pts = xs.map((x, j): [number, number] => {
      const er = isFinite(errs[j]) ? Math.min(errs[j], span) : span;
      return [x, base + (er / maxE) * span * 0.18];
    });
    P.line(F, [[F.x0, base], ...pts, [F.x1, base]], 'rgba(250,77,86,.5)',
      { w: 0, fill: 'rgba(250,77,86,.16)', close: true });
  }
  P.fn(F, e.f, C.f(), { w: 2.4 });
  P.fn(F, approx, C.d2(), { w: 2, dash: [6, 4] });
  P.vline(F, a, C.aux(), { label: 'a = ' + a.toFixed(1) });
  P.dot(F, a, e.f(a), C.aux(), 4.5);
}
