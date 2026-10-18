import type { Bi } from '../../../shared/types';
import { C, plot, type Frame } from '../plot/engine';

const TAU = 2 * Math.PI;

export function drawTrig(cv: HTMLCanvasElement, th: number) {
  const P = plot();
  const f = P.fit(cv), ctx = f.ctx;
  const cx = 78, cy = f.h / 2, R = Math.min(62, f.h / 2 - 18);
  /* left: the circle itself */
  ctx.save();
  ctx.strokeStyle = P.col('--line-2'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  ctx.strokeStyle = P.col('--line');
  ctx.beginPath(); ctx.moveTo(cx - R - 8, cy); ctx.lineTo(cx + R + 8, cy);
  ctx.moveTo(cx, cy - R - 8); ctx.lineTo(cx, cy + R + 8); ctx.stroke();
  const px = cx + R * Math.cos(th), py = cy - R * Math.sin(th);
  ctx.strokeStyle = C.d2(); ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy); ctx.stroke();
  ctx.strokeStyle = C.d1();
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, py); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = C.aux(); ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
  ctx.fillStyle = C.aux();
  ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU); ctx.fill();
  ctx.restore();

  /* right: the same angle unrolled */
  const left = cx + R + 26, iw = Math.max(10, f.w - left - 10), ih = f.h - 36;
  const F: Frame = {
    ctx, w: f.w, h: f.h, l: left, t: 12, iw, ih, x0: 0, x1: TAU, y0: -1.15, y1: 1.15,
    X: (x) => left + (x / TAU) * iw,
    Y: (y) => 12 + ih - ((y + 1.15) / 2.3) * ih,
  };
  P.grid(F, { nx: 4, ny: 4, fmtX: (v) => (v / Math.PI).toFixed(1) + 'π', fmtY: (v) => v.toFixed(1) });
  P.fn(F, Math.sin, C.d1(), { w: 2 });
  P.fn(F, Math.cos, C.d2(), { w: 2 });
  P.vline(F, th, C.aux(), { dash: [4, 4] });
  P.dot(F, th, Math.sin(th), C.d1(), 4);
  P.dot(F, th, Math.cos(th), C.d2(), 4);
}

/* ------------------------------------------------------------------ Fourier */
export type WaveId = 'square' | 'saw' | 'tri';
interface Wave { id: WaveId; l: Bi; f: (x: number) => number; a: (n: number) => number }

const wrap = (x: number) => ((x % TAU) + TAU) % TAU;

export const WAVES: Wave[] = [
  { id: 'square', l: { en: 'Square', zh: '方波' },
    f: (x) => (Math.sin(x) >= 0 ? 1 : -1),
    a: (n) => (n % 2 === 1 ? 4 / (n * Math.PI) : 0) },
  { id: 'saw', l: { en: 'Sawtooth', zh: '锯齿波' },
    f: (x) => (wrap(x + Math.PI) - Math.PI) / Math.PI,
    a: (n) => 2 / (n * Math.PI) * (n % 2 === 1 ? 1 : -1) },
  { id: 'tri', l: { en: 'Triangle', zh: '三角波' },
    f: (x) => { const u = wrap(x); return u < Math.PI ? 2 * u / Math.PI - 1 : 3 - 2 * u / Math.PI; },
    a: (n) => (n % 2 === 1 ? 8 / (n * n * Math.PI * Math.PI) * (((n - 1) / 2) % 2 === 0 ? 1 : -1) : 0) },
];

export const waveById = (id: WaveId): Wave => WAVES.find((w) => w.id === id) ?? WAVES[0];

export function fourierModel(w: Wave, N: number) {
  const amps = Array.from({ length: N }, (_, i) => w.a(i + 1));
  const partial = (x: number) => amps.reduce((s, a, i) => (a ? s + a * Math.sin((i + 1) * x) : s), 0);
  const m = 600;
  const sq = Array.from({ length: m }, (_, i) => {
    const x = -Math.PI + TAU * i / m;
    return (w.f(x) - partial(x)) ** 2;
  }).reduce((a, b) => a + b, 0);
  return { amps, partial, used: amps.filter((a) => Math.abs(a) > 1e-9).length, rms: Math.sqrt(sq / m) };
}

export function drawFourier(cv: HTMLCanvasElement, w: Wave, N: number) {
  const P = plot();
  const { partial } = fourierModel(w, N);
  const F = P.frame(cv, -Math.PI, 3 * Math.PI, -1.6, 1.6, { l: 34, b: 24 });
  P.grid(F, { nx: 4, ny: 4, fmtX: (v) => (v / Math.PI).toFixed(0) + 'π', fmtY: (v) => v.toFixed(1) });
  P.fn(F, w.f, C.dim(), { w: 1.8, n: 1200 });
  P.fn(F, partial, C.d2(), { w: 2.2, n: 1200 });
}

export function drawSpectrum(cv: HTMLCanvasElement, w: Wave, N: number) {
  const P = plot();
  const amps = fourierModel(w, N).amps.map(Math.abs);
  const maxA = Math.max(0.01, ...amps);
  const G = P.frame(cv, 0.5, Math.max(6, N) + 0.5, 0, maxA * 1.15, { l: 40, b: 22, t: 10 });
  P.grid(G, { nx: Math.min(10, Math.max(6, N)), ny: 3, fmtX: (v) => v.toFixed(0), fmtY: (v) => v.toFixed(2) });
  P.bars(G, amps.map((_, i) => i + 1), amps, C.d1(), { frac: 0.55 });
}
