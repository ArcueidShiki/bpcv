import { useMemo, useState } from 'react';
import { useLang } from '../../../shared/i18n';
import { Section } from '../../../shared/Layout';
import { CATS, INDICATORS, type CatId } from '../data/indicators';
import { CatChips } from './Chips';

/** Each release: when, what it measures, and why markets care. */
export function Rules() {
  const { t } = useLang();
  const [cat, setCat] = useState<CatId | ''>('');
  const shown = useMemo(() => INDICATORS.filter((r) => !cat || r.cat === cat), [cat]);
  const catLabel = (id: CatId) => CATS.find((c) => c.id === id)?.label;

  return (
    <Section id="rules" title={t({ en: 'Release handbook', zh: '规则手册' })}>
      <CatChips value={cat} onChange={setCat} />
      <div className="rules">
        {shown.map((r) => {
          const label = catLabel(r.cat);
          return (
            <article key={r.id} className="rule" id={`rule-${r.id}`}>
              <div className="rule-top">
                <span className="rule-abbr">{r.abbr}</span>
                {label ? <span className="muted small">{t(label)}</span> : null}
              </div>
              <h3>{t(r.name)}</h3>
              <p className="rule-when">{t(r.when)}</p>
              <p>{t(r.what)}</p>
              <p className="muted">{t(r.why)}</p>
              <a href={r.url} target="_blank" rel="noopener noreferrer">{t({ en: 'Official source ↗', zh: '官方来源 ↗' })}</a>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
