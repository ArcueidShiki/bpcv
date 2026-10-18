import { useState } from 'react';
import { useLang } from '../../../shared/i18n';
import type { Bi } from '../../../shared/types';
import { indicatorById } from '../data/indicators';
import { IMPACTS, type Series } from '../data/sources';
import { unitOf } from '../lib/model';
import { fmt } from '../lib/time';

type Side = 'low' | 'near' | 'high';

const MARKETS: Bi[] = [
  { en: 'Economy', zh: '经济' },
  { en: 'Stocks', zh: '股市' },
  { en: 'Treasuries', zh: '国债' },
  { en: 'Oil', zh: '原油' },
];

const VERDICT: Record<Side, Bi> = {
  low: { en: 'Below expectations', zh: '低于预期' },
  near: { en: 'In line', zh: '符合预期' },
  high: { en: 'Above expectations', zh: '高于预期' },
};

function classify(a: number, c: number, d: number): Side {
  const eps = 1e-10 * Math.max(1, Math.abs(a), Math.abs(c), d);
  const diff = a - c;
  return diff < -d - eps ? 'low' : diff > d + eps ? 'high' : 'near';
}

/** Actual vs. expected: classify the surprise, then show the usual market read. */
export function Scenario({ series }: { series: Series }) {
  const { t, lang } = useLang();
  const [vals, setVals] = useState({ a: '', c: '', d: '0' });
  const nums = [vals.a, vals.c, vals.d].map((v) => (v.trim() === '' ? NaN : Number(v)));
  const [a, c, d] = nums;
  const ready = nums.every(Number.isFinite) && d >= 0;
  const side = ready ? classify(a, c, d) : null;
  const profile = indicatorById(series.group)?.profile;
  const effects = side && side !== 'near' && profile ? IMPACTS[profile][side] : null;

  const field = (k: keyof typeof vals, label: Bi) => (
    <label className="sc-field">
      <span>{t(label)}</span>
      <input type="number" step="any" value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
    </label>
  );

  return (
    <div className="panel sc">
      <h3>{t({ en: 'Actual vs. expected', zh: '实际值 vs 预期' })} <small className="muted">· {t(unitOf(series))}</small></h3>
      <div className="sc-fields">
        {field('a', { en: 'Actual (or what-if)', zh: '实际值（或假设）' })}
        {field('c', { en: 'Expected', zh: '预期值' })}
        {field('d', { en: 'Tolerance ±', zh: '容差 ±' })}
      </div>
      {side ? (
        <>
          <p className={`sc-verdict ${side}`}>
            <b>{t(VERDICT[side])}</b> · A − C = {fmt(a - c, lang)}
          </p>
          {effects ? (
            <dl className="sc-effects">
              {MARKETS.map((m, i) => (
                <div key={m.en}><dt>{t(m)}</dt><dd>{t(effects[i])}</dd></div>
              ))}
            </dl>
          ) : <p className="muted">{t({ en: 'Little new information; revisions and details drive the move.', zh: '新信息有限，行情更多取决于修正值和分项。' })}</p>}
        </>
      ) : (
        <p className="muted">{t({ en: 'Enter both numbers in the unit above; tolerance must be ≥ 0.', zh: '按上方单位输入两个数值；容差须 ≥ 0。' })}</p>
      )}
    </div>
  );
}
