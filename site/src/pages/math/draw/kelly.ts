import { C, plot, type Pt } from '../plot/engine';

export interface KellyIn { p: number; b: number; f: number }

export function kellyModel({ p, b, f }: KellyIn) {
  const q = 1 - p;
  const g = (x: number) => (x <= 0 ? 0 : x >= 1 ? -Infinity : p * Math.log(1 + x * b) + q * Math.log(1 - x));
  const fStar = (p * b - q) / b;
  return { g, fStar, edge: p * b - q, gf: g(f), hasPeak: fStar > 0 && fStar < 1 };
}

export function drawKelly(cv: HTMLCanvasElement, k: KellyIn) {
  const P = plot();
  const { g, fStar, hasPeak } = kellyModel(k);
  /* Frame the peak, not the ruin tail: g → −∞ as f → 1 would squash the maximum. */
  const gMax = hasPeak ? g(fStar) : 0;
  const [bot, top] = gMax > 1e-6 ? [-gMax * 4, gMax * 1.6] : [-0.3, 0.02];
  const F = P.frame(cv, 0, 1, bot, top, { l: 46, b: 26, t: 10 });
  P.grid(F, { nx: 5, ny: 4, fmtX: (v) => (v * 100).toFixed(0) + '%', fmtY: (v) => v.toFixed(3) });
  P.fn(F, g, C.d2(), { w: 2.4, n: 400 });
  if (hasPeak) {
    P.vline(F, fStar, C.aux(), { label: 'f* ' + (fStar * 100).toFixed(1) + '%' });
    P.dot(F, fStar, g(fStar), C.aux(), 5);
    P.vline(F, fStar / 2, C.d1(), { dash: [3, 5] });
  }
  P.dot(F, k.f, g(k.f), C.gold(), 5);
}

const N_BETS = 200, N_PATHS = 24, SEED = 4242;

export function drawKellyPaths(cv: HTMLCanvasElement, k: KellyIn) {
  const P = plot();
  const { gf } = kellyModel(k);
  const rnd = P.rng(SEED);
  const series = Array.from({ length: N_PATHS }, () => {
    let w = 1;
    const pts: Pt[] = [[0, 0]];
    for (let t = 1; t <= N_BETS; t++) {
      w = Math.max(1e-12, w * (rnd() < k.p ? 1 + k.f * k.b : 1 - k.f));
      pts.push([t, Math.log10(w)]);
    }
    return pts;
  });
  const [lo, hi] = series.reduce(([l0, h0], s) => s.reduce(([l, h], [, y]) =>
    [Math.min(l, y), Math.max(h, y)], [l0, h0]), [0, 0]);
  const G = P.frame(cv, 0, N_BETS, lo - 0.2, hi + 0.2, { l: 46, b: 24, t: 10 });
  P.grid(G, {
    nx: 5, ny: 4, fmtX: (v) => v.toFixed(0),
    fmtY: (v) => (Math.pow(10, v) >= 0.01 ? Math.pow(10, v).toFixed(2) + '×' : '10^' + v.toFixed(0)),
  });
  series.forEach((s) => P.line(G, s, 'rgba(153,161,173,.4)', { w: 1 }));
  if (isFinite(gf)) P.line(G, [[0, 0], [N_BETS, gf * N_BETS / Math.LN10]], C.d2(), { w: 2 });
}
