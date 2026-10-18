import { useState } from 'react';
import { useLang } from '../../shared/i18n';
import type { Bi } from '../../shared/types';
import { FIN, MULT, RATE, positionGreeks, type Analysis, type Greeks, type Position } from './fin';
import { useCanvas } from './useCanvas';

type GreekKey = 'delta' | 'gamma' | 'theta' | 'vega';

const SUB: { k: GreekKey; sym: string; label: Bi; hint: Bi; d: number }[] = [
  { k: 'delta', sym: 'Δ', label: { en: 'Delta', zh: 'Delta' }, hint: { en: 'share-equivalent exposure', zh: '折合股数敞口' }, d: 0 },
  { k: 'gamma', sym: 'Γ', label: { en: 'Gamma', zh: 'Gamma' }, hint: { en: 'Δ change per $1', zh: '股价每动 $1，Δ 的变化' }, d: 2 },
  { k: 'theta', sym: 'Θ', label: { en: 'Theta', zh: 'Theta' }, hint: { en: '$ per day', zh: '每天 $' }, d: 0 },
  { k: 'vega', sym: 'ν', label: { en: 'Vega', zh: 'Vega' }, hint: { en: '$ per vol point', zh: '波动率每 1 点 $' }, d: 0 },
];

const LEGEND: { cls: string; label: Bi }[] = [
  { cls: 'lg-exp', label: { en: 'At expiry', zh: '到期' } },
  { cls: 'lg-t0', label: { en: 'Today', zh: '今天' } },
  { cls: 'lg-bep', label: { en: 'Break-even', zh: '盈亏平衡' } },
  { cls: 'lg-prob', label: { en: 'Likely range', zh: '概率分布' } },
];

/** Payoff (main) and a greek-vs-spot curve (sub) in one panel, sharing an x-axis. */
export function PayoffPanel({ pos, an, S }: { pos: Position; an: Analysis; S: number }) {
  const { t, lang } = useLang();
  const [greek, setGreek] = useState<GreekKey>('delta');
  const sub = SUB.find((g) => g.k === greek) ?? SUB[0];
  const spot = t({ en: 'Spot', zh: '现价' });

  const main = useCanvas((cv) => {
    FIN.Chart.payoff(cv, { pos, S, r: RATE, q: 0, mult: MULT, an, label: spot });
  }, [pos, an, S, lang]);

  const subRef = useCanvas((cv) => {
    const xs = FIN.M.grid(S, an.iv, an.T, 121);
    const pts = xs.map((x): [number, number] => [x, positionGreeks(pos, x)[greek as keyof Greeks]]);
    FIN.Chart.curve(cv, {
      series: [{ name: sub.sym, color: FIN.Chart.colors.purple, pts, width: 1.8 }],
      hlines: [{ v: 0 }],
      vline: S,
      vlabel: spot,
      fmtY: (v) => v.toFixed(sub.d),
    });
  }, [pos, an, S, greek, lang]);

  return (
    <div className="pay">
      <div className="pay-legend">
        {LEGEND.map((l) => <span key={l.cls} className={`lg ${l.cls}`}>{t(l.label)}</span>)}
      </div>
      <canvas ref={main} className="pay-main" aria-label={t({ en: 'Profit and loss chart', zh: '盈亏图' })} />
      <div className="pay-subbar">
        <div className="chips">
          {SUB.map((g) => (
            <button key={g.k} className={g.k === greek ? 'chip on' : 'chip'} onClick={() => setGreek(g.k)}>
              {g.sym} {t(g.label)}
            </button>
          ))}
        </div>
        <span className="muted hint">{t(sub.hint)}</span>
      </div>
      <canvas ref={subRef} className="pay-sub" aria-label={t(sub.label)} />
    </div>
  );
}
