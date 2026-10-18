import { useMemo, useState } from 'react';
import {
  BARS, FIN, buildTape, ctxFor, runOrder,
  type Ctx, type Group, type LabInput, type MarketInput, type Param, type RunResult, type Side, type Tape,
} from './fin';

const MARKET_DEFAULTS: MarketInput = { sigma: 0.3, trend: -0.8, shock: -3, adv: 4_000_000, seed: 1 };
const LAB_DEFAULTS: LabInput = { side: null, qty: 20_000, start: 0, window: BARS - 1, over: {} };

export interface LabState {
  id: string;
  lab: LabInput;
  market: MarketInput;
  tape: Tape;
  ctx: Ctx;
  res: RunResult;
  group: Group;
  select: (id: string) => void;
  setSide: (s: Side) => void;
  setParam: (p: Param, v: number) => void;
  setMarket: (k: keyof MarketInput, v: number) => void;
  reseed: () => void;
  reset: () => void;
}

/** All lab state lives here so the controls, the charts, the book and the
 *  comparison table read one session and one selected order. */
export function useLab(): LabState {
  const [id, setId] = useState('MARKET');
  const [lab, setLab] = useState<LabInput>(LAB_DEFAULTS);
  const [market, setMarketState] = useState<MarketInput>(MARKET_DEFAULTS);

  const tape = useMemo(() => buildTape(market), [market]);
  const ctx = useMemo(() => ctxFor(id, lab, tape), [id, lab, tape]);
  const res = useMemo(() => runOrder(id, ctx), [id, ctx]);

  return {
    id, lab, market, tape, ctx, res,
    group: FIN.ORD[id].group,
    select: (next) => { setId(next); setLab((l) => ({ ...l, over: {} })); },
    setSide: (side) => setLab((l) => ({ ...l, side, over: {} })),
    setParam: (p, v) => setLab((l) => (
      p === 'qty' ? { ...l, qty: v } : p === 'window' ? { ...l, window: v } : { ...l, over: { ...l.over, [p]: v } })),
    setMarket: (k, v) => setMarketState((m) => ({ ...m, [k]: v })),
    reseed: () => setMarketState((m) => ({ ...m, seed: m.seed + 1 })),
    reset: () => { setLab(LAB_DEFAULTS); setMarketState(MARKET_DEFAULTS); },
  };
}
