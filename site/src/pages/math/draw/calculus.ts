import { C, plot } from '../plot/engine';

/** f(x) = x³ − 3x and its derivatives: the worked example of section 01. */
export const D = {
  f: (x: number) => x * x * x - 3 * x,
  d1: (x: number) => 3 * x * x - 3,
  d2: (x: number) => 6 * x,
};

export interface DerivOpts { x0: number; showD1: boolean; showD2: boolean; showTan: boolean }
export interface DerivLabels { max: string; min: string; inflection: string }

export function drawDeriv(cv: HTMLCanvasElement, o: DerivOpts, L: DerivLabels) {
  const P = plot();
  const F = P.frame(cv, -2.4, 2.4, -8, 8, { l: 40, b: 28 });
  P.grid(F, { nx: 8, ny: 8, fmtY: (v) => v.toFixed(0) });
  ([[-1, 'x = −1'], [1, 'x = 1'], [0, 'x = 0']] as const).forEach(([x, l]) =>
    P.vline(F, x, P.col('--line-2'), { dash: [3, 5], label: l }));

  if (o.showD2) P.fn(F, D.d2, C.d2(), { w: 1.8 });
  if (o.showD1) P.fn(F, D.d1, C.d1(), { w: 1.8 });
  P.fn(F, D.f, C.f(), { w: 2.4 });

  P.dot(F, -1, D.f(-1), C.gold(), 4);
  P.dot(F, 1, D.f(1), C.gold(), 4);
  P.label(F, -1, D.f(-1), ` ${L.max} 2`, C.gold(), { dy: -8 });
  P.label(F, 1, D.f(1), ` ${L.min} −2`, C.gold(), { dy: 16 });
  P.dot(F, 0, 0, C.d3(), 4);
  P.label(F, 0, 0, ` ${L.inflection}`, C.d3(), { dy: -8 });

  const y0 = D.f(o.x0), s = D.d1(o.x0), span = 1.5;
  if (o.showTan) {
    P.line(F, [[o.x0 - span, y0 - s * span], [o.x0 + span, y0 + s * span]], C.aux(), { w: 1.6, dash: [6, 4] });
  }
  P.dot(F, o.x0, y0, C.f(), 5);
  P.dot(F, o.x0, D.d1(o.x0), C.d1(), 3.5);
  P.dot(F, o.x0, D.d2(o.x0), C.d2(), 3.5);
}

export const SECANT_X0 = 1.5;

export function secantStats(h: number) {
  const slope = (D.f(SECANT_X0 + h) - D.f(SECANT_X0)) / h;
  const exact = D.d1(SECANT_X0);
  return { slope, exact, err: Math.abs(slope - exact) };
}

export function drawSecant(cv: HTMLCanvasElement, h: number) {
  const P = plot();
  const x0 = SECANT_X0;
  const F = P.frame(cv, 0.4, 2.6, -3, 6, { l: 34, b: 24 });
  P.grid(F, { nx: 5, ny: 4, fmtY: (v) => v.toFixed(0) });
  P.fn(F, D.f, C.f(), { w: 2.2 });
  const y0 = D.f(x0);
  const { slope, exact } = secantStats(h);
  P.line(F, [[x0 - 1, y0 - exact], [x0 + 1, y0 + exact]], C.aux(), { w: 1.6 });
  P.line(F, [[x0 - 1, y0 - slope], [x0 + 1.2, y0 + slope * 1.2]], C.d2(), { w: 1.6, dash: [5, 4] });
  P.dot(F, x0, y0, C.f(), 4.5);
  P.dot(F, x0 + h, D.f(x0 + h), C.d2(), 4);
}

const RIEMANN_A = -3, RIEMANN_B = 1;

/** Midpoint rule on the standard normal density over [−3, 1]. */
export function riemannStats(n: number) {
  const P = plot();
  const dx = (RIEMANN_B - RIEMANN_A) / n;
  const sum = Array.from({ length: n }, (_, i) => P.npdf(RIEMANN_A + dx * (i + 0.5)) * dx)
    .reduce((a, b) => a + b, 0);
  const exact = P.ncdf(RIEMANN_B) - P.ncdf(RIEMANN_A);
  return { sum, exact, err: Math.abs(sum - exact) };
}

export function drawRiemann(cv: HTMLCanvasElement, n: number) {
  const P = plot();
  const F = P.frame(cv, -3.4, 3.4, 0, 0.45, { l: 40, b: 24 });
  P.grid(F, { nx: 6, ny: 3, fmtY: (v) => v.toFixed(2) });
  const dx = (RIEMANN_B - RIEMANN_A) / n, ctx = F.ctx;
  ctx.save();
  ctx.fillStyle = 'rgba(46,155,255,.22)';
  ctx.strokeStyle = 'rgba(46,155,255,.55)';
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const y = P.npdf(RIEMANN_A + dx * (i + 0.5));
    const px = F.X(RIEMANN_A + dx * i), pw = F.X(RIEMANN_A + dx * (i + 1)) - px;
    const py = F.Y(y), ph = F.Y(0) - py;
    ctx.fillRect(px, py, pw, ph);
    if (n <= 60) ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph);
  }
  ctx.restore();
  P.fn(F, P.npdf, C.f(), { w: 2.2 });
  P.vline(F, RIEMANN_B, C.gold(), { label: 'z = 1' });
}
