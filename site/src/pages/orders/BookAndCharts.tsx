import { useCallback, useMemo } from 'react';
import { useLang } from '../../shared/i18n';
import { T } from './copy';
import { FIN, bookBar, type Ctx, type RunResult, type Tape } from './fin';
import { useCanvas } from './useCanvas';

const LEVELS = 8;
const SWEEP_SIZES = [2_000, 20_000, 100_000];

const bpsVs = (px: number, mid: number, side: Ctx['side']) => (side === 'buy' ? 1 : -1) * (px - mid) / mid * 10_000;

function Book({ tape, ctx, res }: { tape: Tape; ctx: Ctx; res: RunResult }) {
  const { t } = useLang();
  const bar = bookBar(res, ctx);
  const book = useMemo(() => FIN.M.book(tape, bar, LEVELS), [tape, bar]);
  const sweep = useMemo(() => FIN.M.sweep(tape, bar, ctx.side, ctx.qty), [tape, bar, ctx.side, ctx.qty]);
  const draw = useCallback((cv: HTMLCanvasElement) => FIN.Chart.ladder(cv, {
    book, side: ctx.side, consumed: sweep.levels, levels: LEVELS,
  }), [book, ctx.side, sweep.levels]);
  const ref = useCanvas(draw);
  const mid = tape.mid[bar];

  return (
    <aside className="book">
      <div className="pane-title">{t(T.book)} <span className="muted">· {t(T.bookAt)} {bar}</span></div>
      <canvas ref={ref} className="cv-ladder" />
      <p className="hint">{t(T.bookHint)}</p>
      <dl className="readouts">
        <div><dt>{t(T.spread)}</dt><dd>{(tape.ask[bar] - tape.bid[bar]).toFixed(2)}</dd></div>
        <div><dt>{t(T.levels)}</dt><dd>{sweep.levels}</dd></div>
        <div><dt>{t(T.sweepAvg)}</dt><dd>{sweep.px.toFixed(3)}</dd></div>
        <div><dt>{t(T.slipMid)}</dt><dd className="dn">{FIN.M.bps(bpsVs(sweep.px, mid, ctx.side))}</dd></div>
      </dl>
      <table className="mini-table">
        <thead><tr><th>{t(T.size)}</th><th>{t(T.levels)}</th><th>{t(T.slipMid)}</th></tr></thead>
        <tbody>
          {SWEEP_SIZES.map((q) => {
            const s = FIN.M.sweep(tape, bar, ctx.side, q);
            return (
              <tr key={q}>
                <td>{q.toLocaleString('en-US')}</td><td>{s.levels}</td>
                <td className="dn">{FIN.M.bps(bpsVs(s.px, mid, ctx.side))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </aside>
  );
}

/** One combined view: price tape on top, fills below it, the order book docked
 *  beside both (under them on mobile). All three follow the selected order. */
export function BookAndCharts({ tape, ctx, res }: { tape: Tape; ctx: Ctx; res: RunResult }) {
  const { t } = useLang();
  const drawTape = useCallback((cv: HTMLCanvasElement) => FIN.Chart.tape(cv, { tape, res, c: ctx }), [tape, res, ctx]);
  const drawFills = useCallback((cv: HTMLCanvasElement) => FIN.Chart.fills(cv, {
    tape, fills: res.fills, emptyLabel: t(T.noFills),
  }), [tape, res, t]);
  const tapeRef = useCanvas(drawTape);
  const fillsRef = useCanvas(drawFills);

  return (
    <div className="combo">
      <div className="charts">
        <div className="pane-title">{t(T.priceChart)}</div>
        <canvas ref={tapeRef} className="cv-tape" data-testid="tape" />
        <div className="pane-title">{t(T.fillsChart)}</div>
        <canvas ref={fillsRef} className="cv-fills" />
      </div>
      <Book tape={tape} ctx={ctx} res={res} />
    </div>
  );
}
