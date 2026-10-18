import { useMemo, useState } from 'react';
import { useLang } from '../../shared/i18n';
import type { Bi } from '../../shared/types';
import { analyse, buildPosition, FIN, hasTwoExpiries, type Market } from './fin';
import { money, pct, UNLIMITED } from './format';
import { stratName } from './strategies';

interface Row { id: string; name: Bi; ok: boolean; pop: number; maxP: number; maxL: number; cvar: number }
type SortKey = 'name' | 'pop' | 'maxP' | 'maxL' | 'cvar';

const COLS: { k: SortKey; label: Bi }[] = [
  { k: 'name', label: { en: 'Strategy', zh: '策略' } },
  { k: 'pop', label: { en: 'Win rate', zh: '胜率' } },
  { k: 'maxP', label: { en: 'Max profit', zh: '最大盈利' } },
  { k: 'maxL', label: { en: 'Max loss', zh: '最大亏损' } },
  { k: 'cvar', label: { en: 'Worst 5%', zh: '最差 5%' } },
];

function rows(m: Market): Row[] {
  return Object.keys(FIN.STRAT).flatMap((id) => {
    const pos = buildPosition(id, m);
    if (!pos) return [];
    const a = analyse(pos, m.S);
    return [{ id, name: stratName(id), ok: !hasTwoExpiries(pos), pop: a.pop, maxP: a.maxProfit, maxL: a.maxLoss, cvar: a.cvar }];
  });
}

/** Every structure under the lab's market assumption. Opens alphabetical:
 *  ranking by win rate by default would imply a recommendation. */
export function Screener({ m, current, onPick }: { m: Market; current: string; onPick: (id: string) => void }) {
  const { t, lang } = useLang();
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: 'name', dir: 1 });
  const all = useMemo(() => rows(m), [m]);
  const shown = useMemo(() => [...all].sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? -1 : 1;
    if (sort.k === 'name') return a.name[lang].localeCompare(b.name[lang], lang) * sort.dir;
    const x = a[sort.k], y = b[sort.k];
    return x === y ? 0 : (x < y ? -1 : 1) * sort.dir;
  }), [all, sort, lang]);

  const unl = t(UNLIMITED);
  const by = (k: SortKey) => setSort((s) => (s.k === k ? { k, dir: s.dir === 1 ? -1 : 1 } : { k, dir: k === 'name' ? 1 : -1 }));
  const cell = (ok: boolean, v: string, cls?: string) => <td className={`n ${cls ?? ''}`}>{ok ? v : '—'}</td>;

  return (
    <div className="panel scr">
      <p className="muted hint">
        {t({ en: 'Click a row to load it above. High win rate ≠ edge — check max loss and worst 5%.', zh: '点击一行载入上方实验室。高胜率不等于优势——看最大亏损和最差 5%。' })}
      </p>
      <div className="scr-scroll">
        <table className="scr-table">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.k} className={c.k === 'name' ? '' : 'n'} aria-sort={sort.k === c.k ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}>
                  <button onClick={() => by(c.k)}>{t(c.label)}{sort.k === c.k ? (sort.dir > 0 ? ' ▴' : ' ▾') : ''}</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className={r.id === current ? 'on' : undefined}>
                <td><button className="row-btn" onClick={() => onPick(r.id)}>{t(r.name)}</button></td>
                {cell(r.ok, pct(r.pop))}
                {cell(r.ok, money(r.maxP, unl), 'up')}
                {cell(r.ok, money(r.maxL, unl), 'dn')}
                {cell(r.ok, money(r.cvar, unl), 'dn')}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
