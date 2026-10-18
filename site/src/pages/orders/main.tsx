import { Encyclopedia } from '../../shared/Encyclopedia';
import { useLang, useTitle } from '../../shared/i18n';
import { Hero, Page, Section } from '../../shared/Layout';
import { mount } from '../../shared/mount';
import type { Bi, Entry } from '../../shared/types';
import { Compare } from './Compare';
import content from './content.json';
import { CATS, T } from './copy';
import { OrderLab } from './OrderLab';
import { useLab } from './useLab';
import './orders.css';

const entries = content as Entry[];
const names: Record<string, Bi> = Object.fromEntries(entries.map((e) => [e.id, e.name]));

function App() {
  const { t } = useLang();
  useTitle(T.title);
  const lab = useLab();
  return (
    <Page current="orders">
      <Hero title={t(T.title)} sub={t(T.heroSub)} />
      <Section id="lab-sec" title={t(T.lab)} sub={t(T.labSub)}>
        <OrderLab s={lab} names={names} />
      </Section>
      <Section id="compare" title={t(T.cmp)} sub={t(T.cmpSub)}>
        <Compare s={lab} names={names} />
      </Section>
      <Section id="encyclopedia" title={t(T.ency)}>
        <Encyclopedia book="orders" entries={entries} cats={CATS} />
      </Section>
    </Page>
  );
}

mount(App);
