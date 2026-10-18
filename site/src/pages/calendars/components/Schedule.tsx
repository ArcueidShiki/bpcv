import { useMemo, useState } from 'react';
import { useLang } from '../../../shared/i18n';
import { Section } from '../../../shared/Layout';
import { indicatorById, KEY_IDS, type CatId } from '../data/indicators';
import { EVENTS, VERIFIED } from '../data/sources';
import { download } from '../lib/download';
import { makeIcs } from '../lib/ics';
import { dateKey, dateLabel, monthLabel, ZONES } from '../lib/time';
import { CatChips } from './Chips';

const ZONE_KEY = 'macro-timezone';
const ET = 'America/New_York';

function savedZone(): string {
  try {
    const z = localStorage.getItem(ZONE_KEY);
    if (z && ZONES.some((x) => x.id === z)) return z;
  } catch { /* storage unavailable */ }
  return ET;
}

const MONTHS = [...new Set(EVENTS.map((e) => dateKey(e.at, ET).slice(0, 7)))].sort();

function initialMonth(): string {
  const now = dateKey(new Date(), ET).slice(0, 7);
  return MONTHS.includes(now) ? now : 'all';
}

export function Schedule() {
  const { t, lang } = useLang();
  const [month, setMonth] = useState(initialMonth);
  const [zone, setZoneState] = useState(savedZone);
  const [cat, setCat] = useState<CatId | ''>('');
  const [q, setQ] = useState('');
  const [keyOnly, setKeyOnly] = useState(false);

  const setZone = (z: string) => {
    setZoneState(z);
    try { localStorage.setItem(ZONE_KEY, z); } catch { /* storage unavailable */ }
  };

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return EVENTS.flatMap((e) => {
      const r = indicatorById(e.id);
      if (!r) return [];
      const ok = (!cat || r.cat === cat) && (!keyOnly || KEY_IDS.includes(r.id))
        && (month === 'all' || dateKey(e.at, zone).startsWith(month))
        && (!needle || [r.id, r.abbr, r.name.en, r.name.zh].some((s) => s.toLowerCase().includes(needle)));
      return ok ? [{ e, r }] : [];
    });
  }, [q, cat, keyOnly, month, zone]);

  const exportIcs = () => {
    const ics = makeIcs(rows.map(({ e, r }) => ({
      event: e,
      summary: `${r.abbr} · ${t(r.name)}`,
      description: `${t(e.period)} · ${t({ en: `Verified ${VERIFIED}; recheck the official calendar.`, zh: `核实于 ${VERIFIED}，请以官方日历为准。` })}`,
    })));
    download(`macro-calendar-${month}-${lang}.ics`, ics, 'text/calendar;charset=utf-8');
  };

  const now = Date.now();
  return (
    <Section id="schedule" title={t({ en: 'Release schedule', zh: '发布日程' })}
      sub={t({ en: `Verified against official calendars on ${VERIFIED}; dates can change.`, zh: `已于 ${VERIFIED} 对照官方日历核实，日程可能调整。` })}>
      <div className="cal-tools">
        <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label={t({ en: 'Month', zh: '月份' })}>
          {MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m, lang)}</option>)}
          <option value="all">{t({ en: 'All months', zh: '全部月份' })}</option>
        </select>
        <select value={zone} onChange={(e) => setZone(e.target.value)} aria-label={t({ en: 'Time zone', zh: '时区' })}>
          {ZONES.map((z) => <option key={z.id} value={z.id}>{t(z.label)}</option>)}
        </select>
        <input className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
               placeholder={t({ en: 'Search CPI, jobs…', zh: '搜索 CPI、就业…' })} />
        <label className="cal-check">
          <input type="checkbox" checked={keyOnly} onChange={(e) => setKeyOnly(e.target.checked)} />
          {t({ en: 'Key only', zh: '仅看重点' })}
        </label>
        <button className="cal-btn" onClick={exportIcs} disabled={!rows.length}>↓ .ics</button>
      </div>
      <CatChips value={cat} onChange={setCat} />
      <div className="cal-list" role="list">
        {rows.map(({ e, r }) => (
          <div key={`${e.id}-${e.at}`} role="listitem" className={Date.parse(e.at) < now ? 'cal-row past' : 'cal-row'}>
            <span className="cal-when">{dateLabel(e.at, zone, lang)}</span>
            <span className="cal-what">
              <b>{r.abbr}</b> {t(r.name)} <small className="muted">· {t(e.period)}</small>
            </span>
            {KEY_IDS.includes(r.id) ? <span className="cal-key">{t({ en: 'Key', zh: '重点' })}</span> : <span />}
            <a href={e.url} target="_blank" rel="noopener noreferrer">{t({ en: 'Source ↗', zh: '来源 ↗' })}</a>
          </div>
        ))}
        {rows.length === 0 ? <p className="muted">{t({ en: 'No releases match.', zh: '没有匹配的日程。' })}</p> : null}
      </div>
    </Section>
  );
}
