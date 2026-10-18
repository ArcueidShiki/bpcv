import type { Bi } from '../../../shared/types';
import { C, plot, type Pt } from '../plot/engine';

export type Mat = readonly [number, number, number, number];

export const MAT_PRESETS: { id: string; l: Bi; v: Mat }[] = [
  { id: 'rot', l: { en: 'Rotation 30°', zh: '旋转 30°' }, v: [0.866, -0.5, 0.5, 0.866] },
  { id: 'scale', l: { en: 'Scale 2×0.5', zh: '缩放 2×0.5' }, v: [2, 0, 0, 0.5] },
  { id: 'shear', l: { en: 'Shear', zh: '剪切' }, v: [1, 1, 0, 1] },
  { id: 'sing', l: { en: 'Singular', zh: '奇异' }, v: [1, 2, 0.5, 1] },
  { id: 'refl', l: { en: 'Reflection', zh: '反射' }, v: [1, 0, 0, -1] },
];

export function matStats([a, b, c, d]: Mat) {
  const det = a * d - b * c, trace = a + d, disc = trace * trace - 4 * det;
  const eig = disc >= 0 ? [(trace + Math.sqrt(disc)) / 2, (trace - Math.sqrt(disc)) / 2] as const : null;
  return { det, trace, eig };
}

function eigvec([a, b, c, d]: Mat, lam: number): Pt | null {
  const raw: Pt = Math.abs(b) > 1e-9 ? [b, lam - a]
    : Math.abs(c) > 1e-9 ? [lam - d, c]
    : Math.abs(lam - a) < 1e-9 ? [1, 0] : [0, 1];
  const n = Math.hypot(raw[0], raw[1]);
  return n < 1e-9 ? null : [raw[0] / n, raw[1] / n];
}

export function drawMat(cv: HTMLCanvasElement, m: Mat) {
  const P = plot();
  const [a, b, c, d] = m;
  const F = P.frame(cv, -3, 3, -3, 3, { l: 34, b: 24 });
  P.grid(F, { nx: 6, ny: 6, fmtY: (v) => v.toFixed(0) });
  const sq: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  P.line(F, [...sq, sq[0]], C.dim(), { w: 1.4, dash: [4, 4] });
  const img = sq.map(([x, y]): Pt => [a * x + b * y, c * x + d * y]);
  P.line(F, [...img, img[0]], C.d2(), { w: 2.2, fill: 'rgba(255,122,0,.16)', close: true });
  P.line(F, [[0, 0], [a, c]], C.d2(), { w: 2.6 });
  P.line(F, [[0, 0], [b, d]], C.gold(), { w: 2.6 });
  P.label(F, a, c, ' A·î', C.d2(), { dy: -4 });
  P.label(F, b, d, ' A·ĵ', C.gold(), { dy: -4 });
  /* real eigenvectors only — complex ones mean a rotation, nothing to draw */
  (matStats(m).eig ?? []).forEach((lam) => {
    const v = eigvec(m, lam);
    if (v) P.line(F, [[-v[0] * 2.8, -v[1] * 2.8], [v[0] * 2.8, v[1] * 2.8]], C.aux(), { w: 1.4, dash: [7, 5] });
  });
}

/* ------------------------------------------------------- portfolio variance */
export interface PV { w1: number; s1: number; s2: number; rho: number }

export function pvModel({ s1, s2, rho }: PV) {
  const a = s1 / 100, b = s2 / 100, r = rho / 100;
  const vol = (w: number) => Math.sqrt(Math.max(0, w * w * a * a + (1 - w) * (1 - w) * b * b + 2 * w * (1 - w) * r * a * b));
  const den = a * a + b * b - 2 * r * a * b;
  const wMin = Math.min(1, Math.max(0, den > 1e-9 ? (b * b - r * a * b) / den : 0));
  return { vol, wMin, a, b };
}

export function drawPortVar(cv: HTMLCanvasElement, pv: PV) {
  const P = plot();
  const { vol, wMin, a, b } = pvModel(pv);
  const w1 = pv.w1 / 100;
  const pct = (v: number) => (v * 100).toFixed(0) + '%';
  const F = P.frame(cv, 0, 1, 0, Math.max(a, b) * 1.25, { l: 40, b: 24, t: 10 });
  P.grid(F, { nx: 5, ny: 4, fmtX: pct, fmtY: pct });
  P.line(F, [[0, b], [1, a]], C.dim(), { w: 1.4, dash: [5, 4] });
  P.line(F, Array.from({ length: 101 }, (_, i): Pt => [i / 100, vol(i / 100)]), C.d2(), { w: 2.4 });
  P.dot(F, wMin, vol(wMin), C.aux(), 4);
  P.dot(F, w1, vol(w1), C.gold(), 5);
  P.vline(F, w1, C.gold(), { dash: [3, 4] });
}
