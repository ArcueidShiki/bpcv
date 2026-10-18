import { useLang } from '../../shared/i18n';
import type { Bi } from '../../shared/types';
import { KIND_LABEL, T } from './copy';
import { localize } from './canvasLang';
import { FIN, type RunResult } from './fin';

const tone = (bps: number | null) => (bps == null ? '' : bps > 0 ? 'dn' : 'up');

function outcome(res: RunResult): { cls: string; text: Bi; pct?: number } {
  const r = res.report;
  if (r.fillRate >= 0.999) return { cls: 'up', text: T.filledAll };
  if (r.fillRate > 0) return { cls: 'gold', text: T.partial, pct: r.fillRate };
  return { cls: 'dn', text: r.reason === 'no-trigger' ? T.noTrigger : T.notFilled };
}

function flag(res: RunResult): Bi | null {
  if (res.gapped) return T.gapped;
  if (res.favourableGap) return T.favGap;
  return res.ambiguous ? T.ambiguous : null;
}

/** Outcome, the numbers that matter, and the event log of one run. */
export function LabResult({ res }: { res: RunResult }) {
  const { t, lang } = useLang();
  const r = res.report;
  const o = outcome(res);
  const f = flag(res);
  const kpis: [Bi, string, string][] = [
    [T.fillRate, `${(r.fillRate * 100).toFixed(1)}%`, o.cls],
    [T.avgPx, FIN.M.money(r.avg), ''],
    [T.slipMid, FIN.M.bps(r.slipMidBps), tone(r.slipMidBps)],
    [T.slipVwap, FIN.M.bps(r.slipVwapBps), tone(r.slipVwapBps)],
    [T.nFills, String(r.nFills), ''],
    [T.bars, r.barsToComplete == null ? '—' : String(r.barsToComplete), ''],
  ];

  return (
    <div className="result">
      <div className={`outcome ${o.cls}`}>
        {t(o.text)}{o.pct != null ? ` · ${(o.pct * 100).toFixed(0)}%` : ''}
        {f ? <span className="flag"> · {t(f)}</span> : null}
      </div>
      <div className="kpis">
        {kpis.map(([k, v, cls]) => (
          <div className="kpi" key={k.en}><span>{t(k)}</span><b className={cls}>{v}</b></div>
        ))}
      </div>
      <div className="pane-title">{t(T.events)}</div>
      <ol className="events">
        {res.events.map((e, k) => (
          <li key={k}>
            <b>{e.i}</b>
            <span className={`kind ${e.kind}`}>{KIND_LABEL[e.kind] ? t(KIND_LABEL[e.kind]) : e.kind}</span>
            <span>{localize(e.label, lang)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
