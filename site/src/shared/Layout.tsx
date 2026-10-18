import type { ReactNode } from 'react';
import { useLang } from './i18n';
import { NAV, type PageId } from './links';

export function TopBar({ current }: { current: PageId }) {
  const { lang, setLang, t } = useLang();
  return (
    <header className="topbar">
      <div className="wrap topbar-row">
        <a className="brand" href="index.html">▤ <b>Arcueid</b></a>
        <nav className="topnav" aria-label={t({ en: 'Site', zh: '站点导航' })}>
          {NAV.map((n) => (
            <a key={n.id} href={n.id === 'tycoon' ? `${n.href}?lang=${lang}` : n.href} className={n.id === current ? 'on' : undefined}
               aria-current={n.id === current ? 'page' : undefined}>{t(n.label)}</a>
          ))}
        </nav>
        <button className="lang-btn" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
                aria-label={t({ en: 'Switch to Chinese', zh: '切换到英文' })}>
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>
    </header>
  );
}

export function Page({ current, children }: { current: PageId; children: ReactNode }) {
  return (
    <>
      <TopBar current={current} />
      <main className="wrap" id="top">{children}</main>
    </>
  );
}

export function Section({ id, title, sub, children }: { id?: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="sec" id={id}>
      <div className="sec-head"><h2>{title}</h2>{sub ? <p>{sub}</p> : null}</div>
      {children}
    </section>
  );
}

export function Hero({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="hero"><h1>{title}</h1>{sub ? <p>{sub}</p> : null}</div>
  );
}
