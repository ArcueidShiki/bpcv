import './legacy';

/** Typed bridge over the vendored engines (globalThis.FIN). Only what the
 *  React layer calls is typed. */

export type LegType = 'C' | 'P' | 'S';
export interface Leg { t: LegType; q: number; K: number | null; T: number; v: number }
export interface Position { id: string; bias: Bias; legs: Leg[]; cashSecured: boolean }
export type Bias = 'bullish' | 'neutral' | 'directional' | 'bearish' | 'basics' | 'advanced';

export interface Greeks { delta: number; gamma: number; vega: number; theta: number; rho: number }
export interface Analysis {
  T: number; iv: number; cost: number; isCredit: boolean; beps: number[];
  maxProfit: number; maxLoss: number; pop: number; ev: number; cvar: number;
  risk: number; ror: number; greeks: Greeks; mult: number;
}

interface CurveSeries { name: string; color: string; pts: [number, number][]; dash?: number[]; width?: number; fill?: string }

interface Fin {
  STRAT: Record<string, { id: string; bias: Bias }>;
  BIASES: Bias[];
  build: (id: string, o: { S: number; w: number; dte: number; iv: number; tick?: number; dteFar?: number }) => Position | null;
  ticket: (pos: Position, lang: string) => string;
  M: {
    analyse: (pos: Position, S: number, r: number, q: number, mult: number) => Analysis;
    greeks: (pos: Position, S: number, r: number, q: number) => Greeks;
    grid: (S: number, v: number, T: number, n: number) => number[];
  };
  Chart: {
    colors: Record<string, string>;
    payoff: (cv: HTMLCanvasElement, o: {
      pos: Position; S: number; r: number; q: number; mult: number; an: Analysis;
      showT0?: boolean; showProb?: boolean; label?: string;
    }) => void;
    curve: (cv: HTMLCanvasElement, o: {
      series: CurveSeries[]; fmtX?: (v: number) => string; fmtY?: (v: number) => string;
      hlines?: { v: number; label?: string; color?: string }[]; vline?: number; vlabel?: string;
    }) => void;
  };
}

export const FIN = (globalThis as unknown as { FIN: Fin }).FIN;

/** One market assumption drives both the lab and the screener. Strikes are
 *  anchored to BASE_SPOT so moving the spot slider actually moves the trade
 *  in or out of the money instead of just rescaling the chart. */
export interface Market { S: number; iv: number; dte: number; w: number }
export const BASE_SPOT = 100;
export const RATE = 0.04;
export const MULT = 100;
export const DEFAULT_MARKET: Market = { S: BASE_SPOT, iv: 0.35, dte: 30, w: 0.05 };

export function buildPosition(id: string, m: Market): Position | null {
  return FIN.build(id, { S: BASE_SPOT, w: m.w, dte: m.dte, iv: m.iv, tick: 1, dteFar: m.dte * 3 });
}

export const analyse = (pos: Position, S: number): Analysis => FIN.M.analyse(pos, S, RATE, 0, MULT);

/** Position greeks in share-equivalent units. FIN.M.greeks mixes units (stock
 *  legs in shares, option legs per share of one contract), so options are
 *  scaled by the multiplier here and stock contributes its share count to Δ. */
export function positionGreeks(pos: Position, S: number): Greeks {
  const opts = { ...pos, legs: pos.legs.filter((l) => l.t !== 'S') };
  const shares = pos.legs.filter((l) => l.t === 'S').reduce((a, l) => a + l.q, 0);
  const g = FIN.M.greeks(opts, S, RATE, 0);
  return {
    delta: g.delta * MULT + shares,
    gamma: g.gamma * MULT,
    vega: g.vega * MULT,
    theta: g.theta * MULT,
    rho: g.rho * MULT,
  };
}

/** Two expiries (calendar / diagonal): terminal-payoff stats are meaningless. */
export const hasTwoExpiries = (pos: Position) =>
  new Set(pos.legs.filter((l) => l.t !== 'S').map((l) => l.T.toFixed(6))).size > 1;
