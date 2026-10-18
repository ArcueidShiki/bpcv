import { useLang } from '../../shared/i18n';
import type { Bi } from '../../shared/types';
import type { Market } from './fin';

interface Ctrl { k: keyof Market; label: Bi; min: number; max: number; step: number; fmt: (v: number) => string }

const CTRLS: Ctrl[] = [
  { k: 'S', label: { en: 'Spot', zh: '现价' }, min: 60, max: 140, step: 0.5, fmt: (v) => `$${v.toFixed(1)}` },
  { k: 'iv', label: { en: 'Implied vol', zh: '隐含波动率' }, min: 0.05, max: 1.5, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%` },
  { k: 'dte', label: { en: 'Days to expiry', zh: '剩余天数' }, min: 1, max: 365, step: 1, fmt: (v) => `${v}d` },
  { k: 'w', label: { en: 'Strike width', zh: '行权价间距' }, min: 0.01, max: 0.2, step: 0.005, fmt: (v) => `${(v * 100).toFixed(1)}%` },
];

/** The market assumption. Strikes stay put; spot moves against them. */
export function Sliders({ m, onChange }: { m: Market; onChange: (m: Market) => void }) {
  const { t } = useLang();
  return (
    <div className="sliders">
      {CTRLS.map((c) => (
        <label className="slider" key={c.k}>
          <span className="k">{t(c.label)}</span>
          <output>{c.fmt(m[c.k])}</output>
          <input type="range" min={c.min} max={c.max} step={c.step} value={m[c.k]}
                 onChange={(e) => onChange({ ...m, [c.k]: Number(e.target.value) })} />
        </label>
      ))}
    </div>
  );
}
