import { useLang } from '../../shared/i18n';
import type { Bi } from '../../shared/types';
import type { Analysis, Greeks } from './fin';
import { money, num, pct, UNLIMITED } from './format';

interface Kpi { k: Bi; v: string; tone?: string; hint?: Bi }

function kpis(an: Analysis, unl: string, twoExp: boolean): Kpi[] {
  const dash = '—';
  return [
    {
      k: an.isCredit ? { en: 'Credit received', zh: '收取权利金' } : { en: 'Debit paid', zh: '支付权利金' },
      v: money(Math.abs(an.cost), unl, 2), tone: an.isCredit ? 'up' : 'dn',
    },
    { k: { en: 'Win rate', zh: '胜率' }, v: twoExp ? dash : pct(an.pop), hint: { en: 'chance of any profit at expiry', zh: '到期盈利的概率' } },
    { k: { en: 'Max profit', zh: '最大盈利' }, v: twoExp ? dash : money(an.maxProfit, unl), tone: 'up' },
    { k: { en: 'Max loss', zh: '最大亏损' }, v: twoExp ? dash : money(an.maxLoss, unl), tone: 'dn' },
    {
      k: { en: 'Break-even', zh: '盈亏平衡' },
      v: twoExp || an.beps.length === 0 ? dash : an.beps.map((b) => b.toFixed(2)).join(' / '), tone: 'gold',
    },
  ];
}

const GREEKS: { k: keyof Greeks; sym: string; d: number; hint: Bi }[] = [
  { k: 'delta', sym: 'Δ', d: 1, hint: { en: 'shares', zh: '股' } },
  { k: 'gamma', sym: 'Γ', d: 2, hint: { en: 'Δ per $1', zh: 'Δ / $1' } },
  { k: 'theta', sym: 'Θ', d: 2, hint: { en: '$ / day', zh: '$ / 天' } },
  { k: 'vega', sym: 'ν', d: 2, hint: { en: '$ / vol pt', zh: '$ / 波动率点' } },
  { k: 'rho', sym: 'ρ', d: 2, hint: { en: '$ / 1% rate', zh: '$ / 1% 利率' } },
];

/** Headline numbers for one contract-sized position, plus the greeks at spot. */
export function Readout({ an, greeks, twoExp }: { an: Analysis; greeks: Greeks; twoExp: boolean }) {
  const { t } = useLang();
  return (
    <div className="readout">
      <div className="kpis">
        {kpis(an, t(UNLIMITED), twoExp).map((x) => (
          <div className="kpi" key={x.k.en} title={x.hint ? t(x.hint) : undefined}>
            <span className="k">{t(x.k)}</span>
            <b className={x.tone}>{x.v}</b>
          </div>
        ))}
      </div>
      <div className="greeks">
        {GREEKS.map((g) => (
          <div className="greek" key={g.k}>
            <span className="sym">{g.sym}</span>
            <b>{num(greeks[g.k], g.d)}</b>
            <span className="k">{t(g.hint)}</span>
          </div>
        ))}
      </div>
      {twoExp ? (
        <p className="muted hint">{t({ en: 'Two expiries: expiry stats don’t apply — read the “today” curve.', zh: '两个到期日：到期统计不适用，请看「今天」曲线。' })}</p>
      ) : null}
    </div>
  );
}
