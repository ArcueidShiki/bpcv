import { useLang } from './i18n';
import { tycoonHref, type Handbook } from './links';
import type { Entry } from './types';

/** Principle, one example, the formula — and a jump into Market Tycoon where
 *  the game has a matching lesson. Collapsed to its title until opened. */
export function EntryCard({ book, entry, open, onToggle }: {
  book: Handbook; entry: Entry; open: boolean; onToggle: () => void;
}) {
  const { lang, t } = useLang();
  const play = tycoonHref(book, entry.id, lang);
  const formula = entry.formula ? t(entry.formula).trim() : '';
  return (
    <article className={`entry${open ? ' open' : ''}`} id={entry.id}>
      <button className="entry-head" onClick={onToggle} aria-expanded={open}>
        <span className="entry-id">{entry.id}</span>
        <span className="entry-name">{t(entry.name)}</span>
        {entry.score != null ? <span className="entry-score">{entry.score.toFixed(1)}</span> : null}
      </button>
      {open ? (
        <div className="entry-body">
          <p className="principle">{t(entry.principle)}</p>
          <p className="example"><b>{t({ en: 'Example', zh: '例子' })}</b>{t(entry.example)}</p>
          {formula ? <pre className="formula">{formula}</pre> : null}
          {play ? (
            <a className="play" href={play}>▶ {t({ en: 'Practise in Market Tycoon', zh: '在股市大亨里练习' })}</a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
