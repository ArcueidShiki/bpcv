import './legacy';
import type { Lang } from '../../shared/types';

/** Typed view over the vendored engines on globalThis.FIN (core / orders / chart). */

export type Side = 'buy' | 'sell';
export type Group = 'basic' | 'moomoo' | 'tiger';
export type Param = 'qty' | 'window' | 'limit' | 'stop' | 'trail' | 'limitOffset' | 'display' | 'pov' | 'slices' | 'tp' | 'sl';
export type Over = Partial<Record<Param, number>>;

export interface Tape {
  n: number; S0: number; tick: number;
  mid: number[]; bid: number[]; ask: number[]; vol: number[];
  sessionVwap: number;
}

export interface Ctx extends Over { tape: Tape; side: Side; qty: number; start: number; end: number }

export interface Fill { i: number; px: number; qty: number }
export interface OrderEvent { i: number; kind: string; label: string }

export interface Report {
  fillRate: number; avg: number | null; arrivalMid: number;
  slipMidBps: number | null; slipVwapBps: number | null;
  nFills: number; barsToComplete: number | null; reason: string | null;
}

export interface RunResult {
  fills: Fill[]; events: OrderEvent[]; report: Report;
  gapped?: boolean; favourableGap?: boolean; ambiguous?: boolean;
}

export interface Book { bids: { px: number; sz: number }[]; asks: { px: number; sz: number }[] }
export interface Sweep { px: number; filled: number; levels: number }

export interface OrderSpec { engine: string; group: Group; side: Side; params: Param[] }

export interface LabInput { side: Side | null; qty: number; start: number; window: number; over: Over }

export interface MarketInput { sigma: number; trend: number; shock: number; adv: number; seed: number }

interface FinGlobal {
  M: {
    tape(o: Record<string, unknown>): Tape;
    run(engine: string, c: Ctx): RunResult;
    book(tp: Tape, i: number, levels: number): Book;
    sweep(tp: Tape, i: number, side: Side, qty: number): Sweep;
    bps(x: number | null): string;
    money(x: number | null): string;
    compact(x: number): string;
  };
  ORD: Record<string, OrderSpec>;
  GROUPS: Group[];
  ctx(id: string, lab: LabInput, tape: Tape): Ctx | null;
  ticket(id: string, c: Ctx, lang: Lang): string;
  Chart: {
    tape(cv: HTMLCanvasElement, o: { tape: Tape; res: RunResult; c: Ctx }): void;
    fills(cv: HTMLCanvasElement, o: { tape: Tape; fills: Fill[]; emptyLabel: string }): void;
    ladder(cv: HTMLCanvasElement, o: { book: Book; side: Side; consumed: number; levels: number }): void;
  };
}

export const FIN = (globalThis as unknown as { FIN: FinGlobal }).FIN;

export const BARS = 240;

export function buildTape(m: MarketInput): Tape {
  return FIN.M.tape({ seed: `session-${m.seed}`, n: BARS, S0: 100, sigma: m.sigma, trend: m.trend, shock: m.shock, adv: m.adv });
}

/** Context for an order at the current lab settings; the window caps the end bar. */
export function ctxFor(id: string, lab: LabInput, tape: Tape): Ctx {
  const c = FIN.ctx(id, lab, tape);
  if (!c) throw new Error(`Unknown order type ${id}`);
  return { ...c, end: Math.min(tape.n - 1, c.start + lab.window) };
}

export function runOrder(id: string, c: Ctx): RunResult {
  const res = FIN.M.run(FIN.ORD[id].engine, c);
  if (!res) throw new Error(`No engine for ${id}`);
  return res;
}

/** Where the order met the book: its first fill, else its trigger, else arrival. */
export function bookBar(res: RunResult, c: Ctx): number {
  if (res.fills.length) return res.fills[0].i;
  const trig = res.events.find((e) => e.kind === 'trigger');
  return trig ? trig.i : c.start;
}
