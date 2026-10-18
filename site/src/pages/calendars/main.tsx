import { useLang, useTitle } from '../../shared/i18n';
import { Hero, Page } from '../../shared/Layout';
import { mount } from '../../shared/mount';
import { History } from './components/History';
import { Industry } from './components/Industry';
import { Rules } from './components/Rules';
import { Schedule } from './components/Schedule';
import './calendars.css';

const TITLE = { en: 'Macro Calendar', zh: '经济日历' };

function App() {
  const { t } = useLang();
  useTitle(TITLE);
  return (
    <Page current="calendars">
      <Hero title={t(TITLE)}
        sub={t({ en: 'When US data comes out, what it measures, and how it has moved.', zh: '美国经济数据何时公布、衡量什么、过去怎么走。' })} />
      <Schedule />
      <History />
      <Rules />
      <Industry />
    </Page>
  );
}

mount(App);
