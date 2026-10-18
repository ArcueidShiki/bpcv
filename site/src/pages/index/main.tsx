import { useState } from 'react';
import { useLang, useTitle } from '../../shared/i18n';
import { Page, Section } from '../../shared/Layout';
import { mount } from '../../shared/mount';
import type { Bi } from '../../shared/types';
import { PASS_MARK, PRACTICES } from './practices';
import './index.css';

const CARDS: { href: string; title: Bi; desc: Bi }[] = [
  { href: 'orders.html', title: { en: 'Order Types', zh: '订单类型' }, desc: { en: 'Market, limit, stop, trailing, TWAP… what each one promises, with a live order book.', zh: '市价、限价、止损、跟踪、TWAP……每种订单的承诺，配实时订单簿。' } },
  { href: 'indicators.html', title: { en: 'Indicators', zh: '指标手册' }, desc: { en: 'Technical and fundamental indicators, each with a chart you can play with.', zh: '技术与基本面指标，每个都能在图上调参看效果。' } },
  { href: 'options.html', title: { en: 'Options', zh: '期权手册' }, desc: { en: 'Greeks, volatility and strategies, with a Black-Scholes payoff engine.', zh: '希腊值、波动率与策略，配 Black-Scholes 盈亏引擎。' } },
  { href: 'math.html', title: { en: 'Math for Finance', zh: '金融数学' }, desc: { en: 'Derivatives to Kelly sizing, drawn as interactive plots.', zh: '从导数到凯利公式，全部画成可交互的图。' } },
  { href: 'calendars.html', title: { en: 'Macro Calendar', zh: '经济日历' }, desc: { en: 'When US data comes out, and what it has done before.', zh: '美国经济数据什么时候公布，过去表现如何。' } },
  { href: 'market-tycoon.html', title: { en: 'Market Tycoon', zh: '股市大亨' }, desc: { en: 'Learn every order type by trading — the handbooks link straight into its lessons.', zh: '边玩边学下单——手册里的条目可以直接跳进对应关卡。' } },
];

function Practices() {
  const { t } = useLang();
  const [picked, setPicked] = useState<ReadonlySet<number>>(new Set());
  const toggle = (id: number) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const pass = picked.size >= PASS_MARK;
  return (
    <Section id="practices" title={t({ en: 'Web best practices', zh: '前端最佳实践' })}
      sub={t({ en: `Tick the ones you follow. ${PASS_MARK} of ${PRACTICES.length} is a pass.`, zh: `勾选你做到的。${PRACTICES.length} 条中做到 ${PASS_MARK} 条即为合格。` })}>
      <div className="practice-grid">
        {PRACTICES.map((p) => (
          <button key={p.id} className={picked.has(p.id) ? 'practice on' : 'practice'} onClick={() => toggle(p.id)}
                  aria-pressed={picked.has(p.id)}>
            <span className="practice-cat">{p.cat}</span>
            <b>{t(p.name)}</b>
            <span>{t(p.rule)}</span>
          </button>
        ))}
      </div>
      <p className={pass ? 'score pass' : 'score'}>
        {picked.size} / {PRACTICES.length} {pass ? t({ en: '— passed', zh: '——合格' }) : ''}
      </p>
      <p className="muted refs">
        {t({ en: 'Source: ', zh: '来源：' })}
        <a href="https://google.github.io/styleguide/htmlcssguide.html">Google HTML/CSS Style Guide</a> ·{' '}
        <a href="https://google.github.io/styleguide/jsguide.html">Google JavaScript Style Guide</a>
      </p>
    </Section>
  );
}

function App() {
  const { lang, t } = useLang();
  useTitle({ en: 'Arcueid · Trading handbooks', zh: 'Arcueid · 交易手册' });
  return (
    <Page current="index">
      <div className="hero">
        <h1>{t({ en: 'Trading handbooks', zh: '交易手册' })}</h1>
        <p>{t({ en: 'Short explanations, one example each, and a game to practise in.', zh: '简短的原理，一个例子，再加一个可以练手的游戏。' })}</p>
      </div>
      <div className="hub">
        {CARDS.map((c) => (
          <a key={c.href} className="hub-card" href={c.href === 'market-tycoon.html' ? `${c.href}?lang=${lang}` : c.href}>
            <b>{t(c.title)}</b>
            <span>{t(c.desc)}</span>
          </a>
        ))}
        <a className="hub-card ghost" href="cv.html"><b>CV</b><span>{t({ en: 'About me', zh: '个人简历' })}</span></a>
      </div>
      <Practices />
    </Page>
  );
}

mount(App);
