import { useLang } from '../../../shared/i18n';
import type { Series } from '../data/sources';
import { nextPeriod, quantile, type Forecast, type Point } from '../lib/model';
import { fmt } from '../lib/time';

const W = 1000;
const H = 300;
const PAD = { l: 92, r: 36, t: 24, b: 44 };
const DOTS_MAX = 160;

/** History line (gaps stay gaps), the sample's middle 50 % band, and the
 *  next-period baseline with its error range. */
export function HistoryChart({ points, series, fc }: { points: readonly Point[]; series: Series; fc: Forecast | null }) {
  const { t, lang } = useLang();
  const vals = points.flatMap((p) => (p.value === null ? [] : [p.value]));
  if (!vals.length) return null;
  const q25 = quantile(vals, 0.25) ?? 0;
  const q75 = quantile(vals, 0.75) ?? 0;
  const span = [...vals, ...(fc ? [fc.low, fc.high] : [])];
  const pad = (Math.max(...span) - Math.min(...span) || 1) * 0.12;
  const lo = Math.min(...span) - pad;
  const hi = Math.max(...span) + pad;
  const last = points[points.length - 1].date;
  const end = fc ? fc.target : nextPeriod(last, series.freq);
  const t0 = Date.parse(points[0].date);
  const x = (date: string) => PAD.l + (Date.parse(date) - t0) * (W - PAD.l - PAD.r) / (Date.parse(end) - t0 || 1);
  const y = (v: number) => PAD.t + (hi - v) / (hi - lo) * (H - PAD.t - PAD.b);

  const path = points.reduce<{ d: string; open: boolean; prev?: string }>((acc, p) => {
    if (p.value === null) return { ...acc, open: false, prev: p.date };
    const joined = acc.open && acc.prev !== undefined && nextPeriod(acc.prev, series.freq) === p.date;
    return { d: `${acc.d}${joined ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)} `, open: true, prev: p.date };
  }, { d: '', open: false }).d;
  const ticks = [0, 1, 2, 3, 4].map((i) => lo + (hi - lo) * i / 4);
  const showDots = vals.length < DOTS_MAX;

  return (
    <svg className="hist-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(series.name)}>
      <rect className="hist-band" x={PAD.l} y={y(q75)} width={W - PAD.l - PAD.r} height={Math.max(0, y(q25) - y(q75))} />
      {ticks.map((v) => (
        <g key={v}>
          <path className="hist-grid" d={`M${PAD.l},${y(v)} H${W - PAD.r}`} />
          <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end">{fmt(v, lang, 2)}</text>
        </g>
      ))}
      <path className="hist-line" d={path} />
      {showDots ? points.map((p) => (p.value === null ? null : (
        <circle key={p.date} className="hist-dot" cx={x(p.date)} cy={y(p.value)} r={3}>
          <title>{`${p.date}: ${fmt(p.value, lang)}`}</title>
        </circle>
      ))) : null}
      {fc ? (
        <g className="hist-fc">
          <path d={`M${x(fc.target)},${y(fc.low)} V${y(fc.high)} M${x(fc.target) - 7},${y(fc.low)} h14 M${x(fc.target) - 7},${y(fc.high)} h14`} />
          <circle cx={x(fc.target)} cy={y(fc.prediction)} r={5}><title>{`${fc.target}: ${fmt(fc.prediction, lang)}`}</title></circle>
        </g>
      ) : null}
      <text x={PAD.l} y={H - 10}>{points[0].date}</text>
      <text x={x(last)} y={H - 10} textAnchor="end">{last}</text>
    </svg>
  );
}
