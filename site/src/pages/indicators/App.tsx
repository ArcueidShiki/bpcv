import { useEffect, useMemo, useState } from 'react';
import { Encyclopedia } from '../../shared/Encyclopedia';
import { useLang, useTitle } from '../../shared/i18n';
import { Hero, Page, Section } from '../../shared/Layout';
import { ChartLab } from './ChartLab';
import { ENTRIES, FIN, UI, categories, familyOf, type Family } from './fin';
import { useLab } from './useLab';
import './indicators.css';

const TITLE = { en: 'Indicators', zh: '指标手册' };
const FAMILIES = Object.keys(FIN.FAMILIES) as Family[];

function FamilySwitch({ value, onChange }: { value: Family | ''; onChange: (f: Family | '') => void }) {
  const { t } = useLang();
  const opts: { id: Family | ''; label: string }[] = [
    { id: '', label: t(UI.all) },
    ...FAMILIES.map((f) => ({ id: f, label: t(FIN.FAMILIES[f]) })),
  ];
  return (
    <div className="fam-switch" role="group">
      {opts.map((o) => (
        <button key={o.id || 'all'} className={value === o.id ? `fam on ${o.id}` : 'fam'}
                aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

export function App() {
  useTitle(TITLE);
  const { t } = useLang();
  const lab = useLab();
  const [family, setFamily] = useState<Family | ''>('');

  // A deep link (#ID) must land on its entry, so drop any family filter.
  useEffect(() => {
    const reset = () => { if (location.hash) setFamily(''); };
    addEventListener('hashchange', reset);
    return () => removeEventListener('hashchange', reset);
  }, []);

  const entries = useMemo(
    () => (family ? ENTRIES.filter((e) => familyOf(e.cat) === family) : ENTRIES), [family]);
  const cats = useMemo(() => categories(family), [family]);

  return (
    <Page current="indicators">
      <Hero title={t(TITLE)} sub={t(UI.subtitle)} />
      <FamilySwitch value={family} onChange={setFamily} />
      <Section id="lab" title={t(UI.lab)} sub={t(UI.labHint)}>
        <ChartLab lab={lab} family={family} />
      </Section>
      <Section id="encyclopedia" title={t(UI.encyclopedia)} sub={t(UI.encHint)}>
        <Encyclopedia key={family || 'all'} book="indicators" entries={entries} cats={cats} />
      </Section>
      <footer className="ind-foot muted">{t(UI.disclaimer)}</footer>
    </Page>
  );
}
