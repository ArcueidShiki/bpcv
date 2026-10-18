import { useLang, useTitle } from '../../shared/i18n';
import { Hero, Page } from '../../shared/Layout';
import { mount } from '../../shared/mount';
import './math.css';
import { ORDER, SECTIONS, SUBTITLE, TITLE } from './sections';
import { AppliedSection } from './sections/Applied';
import { CalcSection, DerivSection } from './sections/Calculus';
import { ShapesSection, TaylorSection } from './sections/Curves';
import { KellySection } from './sections/Kelly';
import { LinAlgSection } from './sections/LinAlg';
import { ProbSection } from './sections/Prob';
import { FourierSection, TrigSection } from './sections/Waves';

function Toc() {
  const { t } = useLang();
  return (
    <nav className="chips m-toc" aria-label={t({ en: 'Sections', zh: '章节' })}>
      {ORDER.map((id, i) => (
        <a key={id} className="chip" href={`#${id}`}>{String(i + 1).padStart(2, '0')} {t(SECTIONS[id].nav)}</a>
      ))}
    </nav>
  );
}

function MathPage() {
  const { t } = useLang();
  useTitle(TITLE);
  return (
    <Page current="math">
      <Hero title={t(TITLE)} sub={t(SUBTITLE)} />
      <Toc />
      <DerivSection />
      <CalcSection />
      <ShapesSection />
      <TaylorSection />
      <LinAlgSection />
      <TrigSection />
      <FourierSection />
      <ProbSection />
      <KellySection />
      <AppliedSection />
    </Page>
  );
}

mount(MathPage);
