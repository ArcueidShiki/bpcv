import type { ReactNode } from 'react';

export function Slider({ label, value, out, min, max, step, onChange }: {
  label: string; value: number; out: string; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="m-ctrl">
      <span className="m-ctrl-k">{label}</span>
      <output className="m-ctrl-v">{out}</output>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}

export type Tone = 'up' | 'dn' | 'info' | 'acc' | 'gold' | '';

export interface Kpi { k: string; v: string; tone?: Tone; wide?: boolean }

export function Kpis({ items }: { items: Kpi[] }) {
  return (
    <div className="m-kpis">
      {items.map((it) => (
        <div key={it.k} className={it.wide ? 'm-kpi wide' : 'm-kpi'}>
          <div className="m-kpi-k">{it.k}</div>
          <div className={`m-kpi-v ${it.tone ? `t-${it.tone}` : ''}`}>{it.v}</div>
        </div>
      ))}
    </div>
  );
}

export function Chips<T extends string>({ items, value, onPick }: {
  items: { id: T; label: string }[]; value: T | null; onPick: (id: T) => void;
}) {
  return (
    <div className="chips">
      {items.map((it) => (
        <button key={it.id} className={it.id === value ? 'chip on' : 'chip'} onClick={() => onPick(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

export interface LegendItem { color: string; label: string }

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className="m-legend">
      {items.map((it) => (
        <span key={it.label}><i style={{ background: it.color }} />{it.label}</span>
      ))}
    </div>
  );
}

/** A plot with its title, live readout, chart column and control column. */
export function Lab({ title, readout, chart, side }: {
  title: string; readout?: string; chart: ReactNode; side?: ReactNode;
}) {
  return (
    <div className="panel m-lab">
      <div className="m-lab-h"><h3>{title}</h3>{readout ? <span className="m-readout">{readout}</span> : null}</div>
      <div className={side ? 'm-lab-body' : 'm-lab-body solo'}>
        <div className="m-lab-chart">{chart}</div>
        {side ? <aside className="m-lab-side">{side}</aside> : null}
      </div>
    </div>
  );
}
