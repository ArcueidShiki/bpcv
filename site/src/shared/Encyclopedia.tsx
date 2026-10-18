import { useEffect, useMemo, useState } from 'react';
import { EntryCard } from './EntryCard';
import { useLang } from './i18n';
import type { Handbook } from './links';
import type { Category, Entry } from './types';

const hashId = () => decodeURIComponent(location.hash.slice(1));

/** Searchable, category-filtered list of entries. `#ID` in the URL opens and
 *  scrolls to that entry, which is how Market Tycoon links back here. */
export function Encyclopedia({ book, entries, cats }: { book: Handbook; entries: Entry[]; cats: Category[] }) {
  const { lang, t } = useLang();
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set([hashId()].filter(Boolean)));

  useEffect(() => {
    const go = () => {
      const id = hashId();
      if (!id) return;
      setCat(''); setQ('');
      setOpen((s) => new Set(s).add(id));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
    };
    go();
    addEventListener('hashchange', go);
    return () => removeEventListener('hashchange', go);
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => (!cat || e.cat === cat) && (!needle ||
      [e.id, e.name.en, e.name.zh].some((s) => s.toLowerCase().includes(needle))));
  }, [entries, cat, q]);

  const toggle = (id: string) => setOpen((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <div className="ency">
      <div className="ency-tools">
        <input className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
               placeholder={t({ en: 'Search name or code…', zh: '搜索名称或代码…' })} />
        <div className="chips">
          <button className={cat === '' ? 'chip on' : 'chip'} onClick={() => setCat('')}>
            {t({ en: 'All', zh: '全部' })} · {entries.length}
          </button>
          {cats.map((c) => (
            <button key={c.id} className={cat === c.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>
              {t(c.label)} · {entries.filter((e) => e.cat === c.id).length}
            </button>
          ))}
        </div>
      </div>
      <div className="ency-list" lang={lang}>
        {shown.map((e) => (
          <EntryCard key={e.id} book={book} entry={e} open={open.has(e.id)} onToggle={() => toggle(e.id)} />
        ))}
        {shown.length === 0 ? <p className="muted">{t({ en: 'No matches.', zh: '没有匹配项。' })}</p> : null}
      </div>
    </div>
  );
}
