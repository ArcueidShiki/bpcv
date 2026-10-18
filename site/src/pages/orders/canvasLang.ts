import type { Lang } from '../../shared/types';

/* The engines (core.js / chart.js) label events and price levels in English.
   Rather than fork them, every string they draw or report is passed through
   `localize`, which rewrites known English labels into Chinese. Unknown text
   (numbers, tickers) passes through untouched. */

type Rule = [RegExp, (m: RegExpMatchArray) => string];

const ZH: Rule[] = [
  // price-level tags drawn by Chart.tape
  [/^limit (\S+)$/, (m) => `限价 ${m[1]}`],
  [/^trigger (\S+)$/, (m) => `触发 ${m[1]}`],
  [/^TP (\S+)$/, (m) => `止盈 ${m[1]}`],
  [/^SL (\S+)$/, (m) => `止损 ${m[1]}`],
  [/^arrival (\S+)$/, (m) => `下单价 ${m[1]}`],
  // event labels from core.js
  [/^swept (\d+) levels?$/, (m) => `扫过 ${m[1]} 档`],
  [/^resting at (\S+)$/, (m) => `挂单于 ${m[1]}`],
  [/^marketable limit$/, () => '可立即成交的限价'],
  [/^partial$/, () => '部分成交'],
  [/^filled$/, () => '成交'],
  [/^never triggered$/, () => '未触发'],
  [/^stop triggered$/, () => '止损触发'],
  [/^price touched$/, () => '价格触及'],
  [/^trailing stop hit$/, () => '跟踪止损触发'],
  [/^gapped through the stop$/, () => '跳空穿过止损价'],
  [/^gapped in your favour$/, () => '跳空对你有利'],
  [/^market fill$/, () => '市价成交'],
  [/^gapped past the limit$/, () => '跳空越过限价'],
  [/^market gapped past the limit — order left resting$/, () => '跳空越过限价，订单继续挂着'],
  [/^TWAP · (\d+) equal slices$/, (m) => `TWAP · ${m[1]} 个等分子单`],
  [/^VWAP · volume-weighted slices$/, () => 'VWAP · 按成交量分配子单'],
  [/^(\d+) child orders$/, (m) => `${m[1]} 笔子单`],
  [/^participating at (\d+)% of volume$/, (m) => `按成交量 ${m[1]}% 参与`],
  [/^ran out of session with (\d+) left$/, (m) => `收盘仍剩 ${m[1]} 未成交`],
  [/^completed$/, () => '完成'],
  [/^showing (\d+) of (\d+)$/, (m) => `显示 ${m[1]}，共 ${m[2]}`],
  [/^(\d+) unfilled$/, (m) => `${m[1]} 未成交`],
  [/^filled in (\d+) clips$/, (m) => `分 ${m[1]} 次成交`],
  [/^queued for the close$/, () => '排队等待收盘'],
  [/^closing auction print$/, () => '收盘竞价成交'],
  [/^opening auction price$/, () => '开盘竞价价格'],
  [/^crossed inside the limit$/, () => '竞价价在限价以内'],
  [/^auction cleared outside the limit$/, () => '竞价价超出限价'],
  [/^dark session · (\d+)% matched$/, (m) => `暗盘 · 撮合 ${m[1]}%`],
  [/^bracket armed$/, () => '括号单生效'],
  [/^neither leg touched$/, () => '两条腿都未触及'],
  [/^take-profit touched$/, () => '触及止盈'],
  [/^stop-loss touched$/, () => '触及止损'],
  [/^other leg cancelled$/, () => '另一条腿撤销'],
  [/^condition never met$/, () => '条件未满足'],
  [/^condition met on close$/, () => '收盘价满足条件'],
  [/^submitted next bar$/, () => '下一根 K 线提交'],
  [/^parent filled → child armed$/, () => '母单成交 → 子单生效'],
  [/^child still working at the close$/, () => '收盘时子单仍在挂'],
  [/^child filled at (\S+)$/, (m) => `子单成交于 ${m[1]}`],
];

export function localize(text: string, lang: Lang): string {
  if (lang === 'en') return text;
  for (const [re, fn] of ZH) {
    const m = text.match(re);
    if (m) return fn(m);
  }
  return text;
}

type Ctx2D = CanvasRenderingContext2D;
const wrapped = new WeakSet<Ctx2D>();

/** Route a canvas's fillText/measureText through `localize`. Both are wrapped
 *  because chart.js sizes label pills with measureText before drawing them.
 *  The language is read through `getLang` on every call, so wrap once. */
export function localizeCanvas(cv: HTMLCanvasElement, getLang: () => Lang): void {
  const x = cv.getContext('2d');
  if (!x || wrapped.has(x)) return;
  wrapped.add(x);
  const fill = x.fillText.bind(x);
  const measure = x.measureText.bind(x);
  // chart.js also draws raw numbers (axis ticks), so coerce before matching
  const tr = (t: unknown) => localize(String(t), getLang());
  x.fillText = (t: string, px: number, py: number, w?: number) =>
    (w === undefined ? fill(tr(t), px, py) : fill(tr(t), px, py, w));
  x.measureText = (t: string) => measure(tr(t));
}
