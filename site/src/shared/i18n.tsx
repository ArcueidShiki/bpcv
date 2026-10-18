import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Bi, Lang } from './types';

const KEY = 'fin.lang';

/** ?lang= wins (so links from Market Tycoon land in the same language), then the
 *  saved choice, then the browser. Storage can throw in private windows. */
function save(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
}

function initialLang(): Lang {
  const q = new URLSearchParams(location.search).get('lang');
  const fromUrl: Lang | null = q === 'zh' || q === 'cn' ? 'zh' : q === 'en' ? 'en' : null;
  if (fromUrl) { save(fromUrl); return fromUrl; }  // persist so the next page keeps it
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch { /* storage unavailable */ }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

interface LangCtx { lang: Lang; setLang: (l: Lang) => void; t: (b: Bi) => string }
const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    save(l);
  }, []);
  useEffect(() => { document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'; }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t: (b: Bi) => b[lang] }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang must be used inside <LangProvider>');
  return v;
}

/** Set the tab title in the current language. */
export function useTitle(title: Bi) {
  const { t } = useLang();
  useEffect(() => { document.title = t(title); }, [t, title]);
}
