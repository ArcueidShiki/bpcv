import { useMemo } from 'react';
import { useLang } from '../../shared/i18n';
import type { Bi } from '../../shared/types';
import { T, shortName } from './copy';
import { FIN, ctxFor, runOrder } from './fin';
import type { LabState } from './useLab';

interface Row { id: string; fill: number; slip: number | null }

/** Every order type, same side/size/tape, ranked by slippage. Click to load. */
export function Compare({ s, names }: { s: LabState; names: Record<string, Bi> }) {
  const { t, lang } = useLang();
  const { lab, tape } = s;
  const rows = useMemo<Row[]>(() => Object.keys(FIN.ORD).map((id) => {
    const r = runOrder(id, ctxFor(id, { ...lab, over: {} }, tape)).report;
    return { id, fill: r.fillRate, slip: r.slipMidBps };
  }).sort((a, b) => (a.slip ?? Infinity) - (b.slip ?? Infinity)), [lab, tape]);

  return (
    <div className="cmp-wrap">
      <table className="cmp">
        <thead><tr><th>{t(T.type)}</th><th>{t(T.fillRate)}</th><th>{t(T.slipMid)}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.id === s.id ? 'on' : undefined}
                onClick={() => { s.select(r.id); document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <td>{shortName(names, r.id, lang)}</td>
              <td className={r.fill >= 0.999 ? 'up' : r.fill > 0 ? 'gold' : 'dn'}>{(r.fill * 100).toFixed(0)}%</td>
              <td className={r.slip == null ? '' : r.slip > 0 ? 'dn' : 'up'}>{FIN.M.bps(r.slip)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
