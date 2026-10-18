import { C, plot, type Frame, type Pt } from '../plot/engine';

const S0 = 100;

export function normStats(sigPct: number, days: number) {
  const sd = (sigPct / 100) * Math.sqrt(days / 365);
  return { sd, lo: S0 * Math.exp(-sd), hi: S0 * Math.exp(sd), move: S0 * sd * 0.7979 };
}

/** A sub-frame of a shared canvas, so one canvas can hold two stacked charts. */
function band(base: Frame, top: number, height: number, x0: number, x1: number): Frame {
  const iw = base.w - 52;
  return {
    ...base, l: 40, t: top, iw, ih: height, x0, x1, y0: 0, y1: 1.12,
    X: (x) => 40 + ((x - x0) / (x1 - x0)) * iw,
    Y: (y) => top + height - (y / 1.12) * height,
  };
}

export function drawNorm(cv: HTMLCanvasElement, sigPct: number, days: number, L: { log: string; price: string }) {
  const P = plot();
  const { sd } = normStats(sigPct, days);
  const f = P.fit(cv), half = f.h / 2 - 4;
  const shell: Frame = { ...f, l: 0, t: 0, iw: f.w, ih: f.h, x0: 0, x1: 1, y0: 0, y1: 1, X: (x) => x, Y: (y) => y };

  /* upper: log-return density, symmetric */
  const span = Math.max(3.2 * sd, 0.05);
  const Fu = band(shell, 8, half - 18, -span, span);
  P.grid(Fu, { nx: 4, ny: 2, fmtX: (v) => (v * 100).toFixed(0) + '%', fmtY: false });
  P.fn(Fu, (x) => Math.exp(-0.5 * (x / sd) ** 2), C.d1(), { w: 2.2 });
  P.vline(Fu, -sd, C.dim(), { dash: [3, 4] });
  P.vline(Fu, sd, C.dim(), { dash: [3, 4] });
  P.label(Fu, 0, 1.02, L.log, C.d1(), { align: 'center' });

  /* lower: the same thing in price space, right-skewed */
  const lo = S0 * Math.exp(-3.2 * sd), hi = S0 * Math.exp(3.2 * sd);
  const Fl = band(shell, half + 12, half - 26, lo, hi);
  P.grid(Fl, { nx: 4, ny: 2, fmtX: (v) => v.toFixed(0), fmtY: false });
  const dens = (S: number) => (S <= 0 ? 0 : Math.exp(-0.5 * (Math.log(S / S0) / sd) ** 2) / S);
  const peak = Math.max(...Array.from({ length: 201 }, (_, i) => dens(lo + (hi - lo) * i / 200)));
  P.fn(Fl, (S) => dens(S) / (peak || 1), C.d2(), { w: 2.2 });
  P.vline(Fl, S0 * Math.exp(-sd), C.dim(), { dash: [3, 4] });
  P.vline(Fl, S0 * Math.exp(sd), C.dim(), { dash: [3, 4] });
  P.vline(Fl, S0, C.gold(), { dash: [2, 3], label: 'S₀' });
  P.label(Fl, (lo + hi) / 2, 1.02, L.price, C.d2(), { align: 'center' });
}

export interface GbmRun { paths: Pt[][]; finals: number[]; steps: number; days: number; sig: number }

/** Simulate risk-neutral GBM paths from a fixed seed (deterministic per seed). */
export function simulateGbm(nP: number, sigPct: number, days: number, seed: number): GbmRun {
  const P = plot();
  const sig = sigPct / 100, steps = Math.min(days, 260), dt = (days / 365) / steps;
  const rnd = P.rng(seed), drift = -0.5 * sig * sig * dt, vol = sig * Math.sqrt(dt);
  const paths = Array.from({ length: nP }, () => {
    let s = S0;
    const pts: Pt[] = [[0, S0]];
    for (let j = 1; j <= steps; j++) {
      s *= Math.exp(drift + vol * P.gauss(rnd));
      pts.push([j, s]);
    }
    return pts;
  });
  const finals = paths.map((p) => p[p.length - 1][1]).sort((a, b) => a - b);
  return { paths, finals, steps, days, sig };
}

export function drawGbm(cv: HTMLCanvasElement, run: GbmRun, dayUnit: string) {
  const P = plot();
  const { paths, steps, days, sig } = run;
  /* reduce, not spread: paths × steps can exceed engine argument limits */
  const [yLo, yHi] = paths.reduce(([lo, hi], path) => path.reduce(([l, h], [, y]) =>
    [Math.min(l, y), Math.max(h, y)], [lo, hi]), [S0, S0]);
  const pad = (yHi - yLo) * 0.08 + 1;
  const F = P.frame(cv, 0, steps, Math.max(0.1, yLo - pad), yHi + pad, { l: 40, b: 24, t: 10 });
  P.grid(F, { nx: 5, ny: 4, fmtX: (v) => (v / steps * days).toFixed(0) + dayUnit, fmtY: (v) => v.toFixed(0) });
  paths.forEach((p) => P.line(F, p, 'rgba(153,161,173,.34)', { w: 1 }));
  const env = (k: number) => Array.from({ length: steps + 1 }, (_, t): Pt => {
    const tt = (t / steps) * (days / 365);
    return [t, S0 * Math.exp(-0.5 * sig * sig * tt + k * sig * Math.sqrt(tt))];
  });
  P.line(F, env(1), C.d2(), { w: 1.8, dash: [6, 4] });
  P.line(F, env(-1), C.d2(), { w: 1.8, dash: [6, 4] });
  P.line(F, env(0), C.gold(), { w: 1.6 });
}
