import { useState } from 'react';
import { Encyclopedia } from '../../shared/Encyclopedia';
import { useLang, useTitle } from '../../shared/i18n';
import { Hero, Page, Section } from '../../shared/Layout';
import type { Entry } from '../../shared/types';
import content from './content.json';
import { DEFAULT_MARKET, type Market } from './fin';
import { Lab } from './Lab';
import { Screener } from './Screener';
import { CATS } from './strategies';
import './options.css';

const ENTRIES = content as Entry[];
const TITLE = { en: 'Options', zh: '期权手册' };

export function App() {
  useTitle(TITLE);
  const { t } = useLang();
  const [id, setId] = useState('LONG_CALL');
  const [m, setM] = useState<Market>(DEFAULT_MARKET);
  const pickFromTable = (s: string) => {
    setId(s);
    document.getElementById('lab')?.scrollIntoView({ block: 'start' });
  };

  return (
    <Page current="options">
      <Hero title={t({ en: 'Options handbook', zh: '期权手册' })}
            sub={t({ en: 'Pick a strategy, drag the market, read the payoff.', zh: '选一个策略，拖动行情，看盈亏。' })} />
      <Section id="lab" title={t({ en: 'Strategy lab', zh: '策略实验室' })}
               sub={t({ en: 'Strikes are fixed around $100; spot, vol and time move. One contract.', zh: '行权价固定在 $100 附近；现价、波动率和时间可调。一张合约。' })}>
        <Lab id={id} onPick={setId} m={m} onMarket={setM} />
      </Section>
      <Section id="screener" title={t({ en: 'Strategy screener', zh: '策略筛选器' })}>
        <Screener m={m} current={id} onPick={pickFromTable} />
      </Section>
      <Section id="encyclopedia" title={t({ en: 'Encyclopedia', zh: '百科' })}>
        <Encyclopedia book="options" entries={ENTRIES} cats={CATS} />
      </Section>
    </Page>
  );
}
