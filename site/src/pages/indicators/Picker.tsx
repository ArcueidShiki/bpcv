import { useMemo, useState } from 'react';
import { useLang } from '../../shared/i18n';
import type { Entry } from '../../shared/types';
import { BY_ID, ENTRIES, FIN, UI, categories, isChartable, type Family } from './fin';

interface Group { cat: string; label: string; items: Entry[] }

function matches(e: Entry, needle: string): boolean {
  return !needle || [e.id, e.name.en, e.name.zh].some((s) => s.toLowerCase().includes(needle));
}

/** Chartable indicators grouped by category, filtered by family and search. */
export function Picker({ family, ids, onToggle }: {
  family: Family | ''; ids: readonly string[]; onToggle: (id: string) => void;
}) {
  const { t } = useLang();
  const [q, setQ] = useState('');

  const groups = useMemo<Group[]>(() => {
    const needle = q.trim().toLowerCase();
    return categories(family)
      .map((c) => ({
        cat: c.id,
        label: t(c.label),
        items: ENTRIES.filter((e) => e.cat === c.id && isChartable(e.id) && matches(e, needle)),
      }))
      .filter((g) => g.items.length > 0);
  }, [family, q, t]);

  const on = new Set(ids);
  return (
    <div className="picker">
      <input className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
             placeholder={t(UI.search)} aria-label={t(UI.search)} />
      <div className="pick-list">
        {groups.map((g) => (
          <div key={g.cat} className="pick-group">
            <div className="pick-group-h">{g.label}</div>
            {g.items.map((e) => (
              <label key={e.id} className={on.has(e.id) ? 'pick-row on' : 'pick-row'}>
                <input type="checkbox" checked={on.has(e.id)} onChange={() => onToggle(e.id)} />
                <span className="pick-id">{e.id}</span>
                <span className="pick-name">{t(e.name)}</span>
                <PaneTag id={e.id} />
              </label>
            ))}
          </div>
        ))}
        {groups.length === 0 ? <p className="muted pick-empty">{t(UI.noMatch)}</p> : null}
      </div>
    </div>
  );
}

export function PaneTag({ id }: { id: string }) {
  const { t } = useLang();
  const pane = FIN.REG[id]?.pane ?? 'sub';
  return <span className={`pane-tag ${pane}`}>{t(pane === 'main' ? UI.main : UI.sub)}</span>;
}

export const nameOf = (id: string) => BY_ID.get(id)?.name;
