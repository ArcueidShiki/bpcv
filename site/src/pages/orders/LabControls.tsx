import { useLang } from '../../shared/i18n';
import type { Bi } from '../../shared/types';
import { GROUP_LABEL, MARKET_LABEL, PARAM_LABEL, T, shortName } from './copy';
import { FIN, type MarketInput, type Param } from './fin';
import type { LabState } from './useLab';

interface Range { min: number; max: number; step: number }

/** Price params span ±6% around the session open; the rest have fixed ranges. */
const PRICE_SPAN = 0.06;
const PARAM_RANGE: Partial<Record<Param, Range>> = {
  trail: { min: 0.05, max: 6, step: 0.01 },
  limitOffset: { min: 0.01, max: 3, step: 0.01 },
  display: { min: 100, max: 20_000, step: 100 },
  pov: { min: 1, max: 50, step: 1 },
  slices: { min: 2, max: 60, step: 1 },
  qty: { min: 1000, max: 200_000, step: 1000 },
  window: { min: 5, max: 239, step: 1 },
};
const PRICE_PARAMS: Param[] = ['limit', 'stop', 'tp', 'sl', 'trail', 'limitOffset'];

const MARKET_CTRLS: { k: keyof typeof MARKET_LABEL; r: Range; fmt: (v: number) => string }[] = [
  { k: 'trend', r: { min: -6, max: 6, step: 0.1 }, fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%` },
  { k: 'sigma', r: { min: 0.08, max: 0.9, step: 0.01 }, fmt: (v) => `${(v * 100).toFixed(0)}%` },
  { k: 'shock', r: { min: -10, max: 10, step: 0.5 }, fmt: (v) => (v === 0 ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`) },
  { k: 'adv', r: { min: 300_000, max: 20_000_000, step: 100_000 }, fmt: (v) => FIN.M.compact(v) },
];

function Slider({ label, value, r, fmt, onChange }: {
  label: string; value: number; r: Range; fmt: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <label className="ctrl">
      <span>{label}</span><output>{fmt(value)}</output>
      <input type="range" min={r.min} max={r.max} step={r.step} value={value}
             onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}

export function OrderPicker({ s, names }: { s: LabState; names: Record<string, Bi> }) {
  const { t, lang } = useLang();
  const ids = Object.keys(FIN.ORD).filter((id) => FIN.ORD[id].group === s.group);
  return (
    <div className="picker">
      <div className="seg" role="tablist">
        {FIN.GROUPS.map((g) => (
          <button key={g} role="tab" aria-selected={g === s.group} className={g === s.group ? 'on' : undefined}
                  onClick={() => s.select(Object.keys(FIN.ORD).find((id) => FIN.ORD[id].group === g) ?? 'MARKET')}>
            {t(GROUP_LABEL[g])}
          </button>
        ))}
      </div>
      <div className="chips">
        {ids.map((id) => (
          <button key={id} className={id === s.id ? 'chip on' : 'chip'} data-id={id} onClick={() => s.select(id)}>
            {shortName(names, id, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LabControls({ s }: { s: LabState }) {
  const { t } = useLang();
  const spec = FIN.ORD[s.id];
  const value = (p: Param) => (p === 'qty' ? s.lab.qty : p === 'window' ? s.lab.window : s.ctx[p]);
  const range = (p: Param): Range => PARAM_RANGE[p] ?? {
    min: +(s.tape.S0 * (1 - PRICE_SPAN)).toFixed(2), max: +(s.tape.S0 * (1 + PRICE_SPAN)).toFixed(2), step: 0.01,
  };
  const fmt = (p: Param) => (v: number) =>
    PRICE_PARAMS.includes(p) ? v.toFixed(2) : p === 'pov' ? `${v}%` : v.toLocaleString('en-US');

  return (
    <div className="ctrls">
      <div className="ctrl">
        <span>{t(T.side)}</span>
        <div className="seg mini">
          {(['buy', 'sell'] as const).map((side) => (
            <button key={side} className={s.ctx.side === side ? 'on' : undefined} onClick={() => s.setSide(side)}>
              {t(T[side])}
            </button>
          ))}
        </div>
      </div>
      {spec.params.map((p) => {
        const v = value(p);
        return v == null ? null : (
          <Slider key={p} label={t(PARAM_LABEL[p])} value={v} r={range(p)} fmt={fmt(p)} onChange={(x) => s.setParam(p, x)} />
        );
      })}
      <div className="ctrl-head">{t(T.market)}</div>
      {MARKET_CTRLS.map((c) => (
        <Slider key={c.k} label={t(MARKET_LABEL[c.k])} value={s.market[c.k as keyof MarketInput]} r={c.r} fmt={c.fmt}
                onChange={(x) => s.setMarket(c.k, x)} />
      ))}
      <div className="ctrl-btns">
        <button className="btn" onClick={s.reseed}>{t(T.reseed)}</button>
        <button className="btn" onClick={s.reset}>{t(T.reset)}</button>
      </div>
    </div>
  );
}
