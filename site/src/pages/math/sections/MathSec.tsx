import type { ReactNode } from 'react';
import { useLang } from '../../../shared/i18n';
import { EXAMPLE, SECTIONS } from '../sections';

/** Section shell: title, one principle, one finance example, the maths line. */
export function MathSec({ id, children }: { id: string; children: ReactNode }) {
  const { t } = useLang();
  const s = SECTIONS[id];
  return (
    <section className="sec m-sec" id={id}>
      <div className="sec-head">
        <h2>{t(s.title)}</h2>
        <p>{t(s.principle)}</p>
      </div>
      <p className="m-example"><b>{t(EXAMPLE)}</b>{t(s.example)}</p>
      {s.formula ? <pre className="m-formula">{s.formula}</pre> : null}
      <div className="m-stack">{children}</div>
    </section>
  );
}
