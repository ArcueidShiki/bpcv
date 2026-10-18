import { useMemo, useState } from 'react';
import { useLang } from '../../../shared/i18n';
import { Section } from '../../../shared/Layout';
import { HISTORY } from '../data/sources';
import { download } from '../lib/download';
import { forecast, historyCsv, lastYears, transformed, unitOf } from '../lib/model';
import { fmt } from '../lib/time';
import { HistoryChart } from './HistoryChart';
import { Scenario } from './Scenario';

const RANGES = [
  { years: 3, label: { en: '3 years', zh: '近 3 年' } },
  { years: 5, label: { en: '5 years', zh: '近 5 年' } },
  { years: 0, label: { en: 'All', zh: '全部' } },
];

export function History() {
  const { t, lang } = useLang();
  const [id, setId] = useState(HISTORY.series[0].id);
  const [years, setYears] = useState(5);
  const series = HISTORY.series.find((s) => s.id === id) ?? HISTORY.series[0];
  const all = useMemo(() => transformed(series), [series]);
  const fc = useMemo(() => forecast(series), [series]);
  const points = lastYears(all, years);
  const latest = all[all.length - 1];
  const unit = t(unitOf(series));

  const saveCsv = () => download(`${series.id}-history.csv`, `﻿${historyCsv(series)}`, 'text/csv;charset=utf-8');

  return (
    <Section id="history" title={t({ en: 'History & baseline forecast', zh: '历史与基准预测' })}
      sub={t({ en: 'Official data; the forecast is a simple 3-period average, not market consensus.', zh: '官方数据；预测是最近三期的简单平均，不是市场一致预期。' })}>
      <div className="cal-tools">
        <select value={id} onChange={(e) => setId(e.target.value)} aria-label={t({ en: 'Series', zh: '数据序列' })}>
          {HISTORY.series.map((s) => <option key={s.id} value={s.id}>{t(s.name)}</option>)}
        </select>
        <select value={years} onChange={(e) => setYears(Number(e.target.value))} aria-label={t({ en: 'Range', zh: '范围' })}>
          {RANGES.map((r) => <option key={r.years} value={r.years}>{t(r.label)}</option>)}
        </select>
        <button className="cal-btn" onClick={saveCsv}>↓ CSV</button>
      </div>
      <div className="panel">
        <div className="hist-head">
          <b>{t(series.name)}</b>
          <span className="muted">{unit} · {series.agency} · <a href={series.url} target="_blank" rel="noopener noreferrer">FRED {series.id} ↗</a></span>
        </div>
        <HistoryChart points={points} series={series} fc={fc} />
        <p className="hist-legend muted">
          <i className="sw line" />{t({ en: 'History', zh: '历史' })}
          <i className="sw band" />{t({ en: 'Middle 50 %', zh: '中间 50%' })}
          <i className="sw fc" />{t({ en: 'Next-period baseline', zh: '下期基准' })}
        </p>
        <div className="stats">
          <div><span>{t({ en: 'Latest', zh: '最新' })} · {latest.date}</span><b>{fmt(latest.value, lang)}</b></div>
          {fc ? (
            <>
              <div><span>{t({ en: 'Baseline', zh: '基准预测' })} · {fc.target}</span><b className="orange">{fmt(fc.prediction, lang)}</b></div>
              <div><span>{t({ en: 'Error range P10–P90', zh: '误差区间 P10–P90' })}</span><b>{fmt(fc.low, lang)} ~ {fmt(fc.high, lang)}</b></div>
              <div><span>{t({ en: 'Avg error vs. last value', zh: '平均误差 vs 沿用前值' })}</span><b>{fmt(fc.mae, lang)} / {fmt(fc.naiveMae, lang)}</b></div>
            </>
          ) : <div><span>{t({ en: 'Baseline', zh: '基准预测' })}</span><b>—</b></div>}
        </div>
        <p className="muted small">{t({ en: `Data retrieved ${HISTORY.retrievedAt}.`, zh: `数据抓取于 ${HISTORY.retrievedAt}。` })}</p>
      </div>
      <Scenario key={series.id} series={series} />
    </Section>
  );
}
