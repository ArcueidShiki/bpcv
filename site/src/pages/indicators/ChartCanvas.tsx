import { useEffect, useRef } from 'react';
import { useLang } from '../../shared/i18n';
import { FIN, type ChartInstance, type OHLCV } from './fin';
import type { Params } from './useLab';

const sameParams = (a: Params, b: Params) =>
  Object.keys(b).length === Object.keys(a).length && Object.keys(b).every((k) => a[k] === b[k]);

/** Bring the engine's active set in line with React state. The engine keeps
 *  its own mutable list; React state stays the single source of truth. */
function reconcile(chart: ChartInstance, ids: readonly string[], params: Readonly<Record<string, Params>>) {
  const want = new Set(ids);
  chart.active.filter((a) => !want.has(a.id)).forEach((a) => chart.remove(a.id));
  ids.forEach((id) => {
    const p = params[id] ?? {};
    const entry = chart.get(id);
    if (!entry) { chart.add(id, p); return; }
    if (!sameParams(entry.params, p)) {
      entry.params = { ...p };
      chart.compute(entry);
    }
  });
  chart.render();
}

/** Mounts FIN.Chart on a canvas: candles, volume, overlays and one stacked
 *  pane per oscillator, all in one canvas. The engine owns drawing, zoom and
 *  pan; React decides what is on it. `zoomKey` changes reset the zoom. */
export function ChartCanvas({ ids, params, data, zoomKey, compact }: {
  ids: readonly string[]; params: Readonly<Record<string, Params>>; data: OHLCV; zoomKey: number;
  /** The engine's `mini` mode: short date axis, no volume, no wheel/drag.
   *  Fixed for this instance's lifetime; remount (via `key`) to change it. */
  compact: boolean;
}) {
  const { lang } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartInstance | null>(null);

  // Create once. The ref survives StrictMode's dev remount, so the engine
  // (whose listeners cannot be detached) is never bound twice.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartRef.current) return;
    chartRef.current = new FIN.Chart({ canvas, data, mini: compact });
    reconcile(chartRef.current, ids, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { chartRef.current?.setData(data); }, [data]);

  useEffect(() => {
    if (chartRef.current) reconcile(chartRef.current, ids, params);
  }, [ids, params]);

  useEffect(() => { if (zoomKey) chartRef.current?.resetZoom(); }, [zoomKey]);

  // Canvas text is numbers, dates and indicator codes; repaint on a language
  // switch anyway so nothing stale survives the toggle.
  useEffect(() => { chartRef.current?.render(); }, [lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    let lastW = canvas.clientWidth;
    const ro = new ResizeObserver(() => {
      if (canvas.clientWidth === lastW) return;
      lastW = canvas.clientWidth;
      chartRef.current?.render();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return <canvas ref={canvasRef} className="lab-canvas" />;
}
