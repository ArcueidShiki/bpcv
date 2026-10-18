import { useLang } from '../../shared/i18n';
import { FIN, UI } from './fin';
import { PaneTag, nameOf } from './Picker';
import type { Params } from './useLab';

const FALLBACK_COLOR = '#FF8D1E';

/** What is on the chart, with its tunable parameters. */
export function ActiveList({ ids, params, onRemove, onParam }: {
  ids: readonly string[];
  params: Readonly<Record<string, Params>>;
  onRemove: (id: string) => void;
  onParam: (id: string, key: string, value: number) => void;
}) {
  const { t } = useLang();
  if (ids.length === 0) return <p className="muted act-empty">{t(UI.none)}</p>;
  return (
    <ul className="act-list">
      {ids.map((id) => {
        const spec = FIN.REG[id];
        const name = nameOf(id);
        return (
          <li key={id} className="act-row">
            <span className="act-dot" style={{ background: spec.series[0]?.color ?? FALLBACK_COLOR }} />
            <b className="act-id" title={name ? t(name) : undefined}>{id}</b>
            <PaneTag id={id} />
            {spec.simulated ? <span className="sim-tag" title={t(UI.simulated)}>~</span> : null}
            {(spec.params ?? []).map((p) => (
              <label key={p.k} className="act-param">
                <span>{p.k}</span>
                <input type="number" value={params[id]?.[p.k] ?? p.d} step={p.step ?? 1}
                       min={p.min} max={p.max}
                       onChange={(e) => onParam(id, p.k, e.target.valueAsNumber)} />
              </label>
            ))}
            <button className="act-x" onClick={() => onRemove(id)} aria-label={`${t(UI.remove)} ${id}`}
                    title={t(UI.remove)}>✕</button>
          </li>
        );
      })}
    </ul>
  );
}
