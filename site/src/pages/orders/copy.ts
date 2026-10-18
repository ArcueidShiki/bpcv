import type { Bi, Category, Lang } from '../../shared/types';
import type { Group, Param } from './fin';

/** UI copy. Labels and one-line hints only. */
export const T = {
  title: { en: 'Order Types', zh: '订单类型' },
  heroSub: {
    en: 'Market orders buy certainty of a fill; limit orders buy certainty of price. Nothing gives you both.',
    zh: '市价单保证成交，限价单保证价格，没有一种能两者兼得。',
  },
  lab: { en: 'Order lab', zh: '订单实验室' },
  labSub: {
    en: 'Pick an order, tune it, and watch it run on one simulated session.',
    zh: '选一种订单、调好参数，看它在同一段模拟行情上怎么成交。',
  },
  cmp: { en: 'Same ticket, every type', zh: '同一笔委托，所有类型' },
  cmpSub: { en: 'Same side, size and tape. Click a row to load it.', zh: '方向、数量、行情都相同。点击一行载入实验室。' },
  ency: { en: 'Encyclopedia', zh: '百科' },
  side: { en: 'Side', zh: '方向' },
  buy: { en: 'Buy', zh: '买入' },
  sell: { en: 'Sell', zh: '卖出' },
  market: { en: 'Market', zh: '行情' },
  reseed: { en: 'New session', zh: '换一段行情' },
  reset: { en: 'Reset', zh: '重置' },
  priceChart: { en: 'Price, VWAP and order levels', zh: '价格、VWAP 与委托价位' },
  fillsChart: { en: 'Fills per bar', zh: '每根 K 线的成交量' },
  book: { en: 'Order book', zh: '盘口' },
  bookAt: { en: 'bar', zh: 'K 线' },
  bookHint: {
    en: 'Highlighted levels: what a market order of this size would eat.',
    zh: '高亮档位：同样数量的市价单会吃掉的部分。',
  },
  spread: { en: 'Spread', zh: '价差' },
  levels: { en: 'Levels eaten', zh: '吃掉档位' },
  sweepAvg: { en: 'Sweep average', zh: '扫单均价' },
  size: { en: 'Size', zh: '数量' },
  fillRate: { en: 'Filled', zh: '成交率' },
  avgPx: { en: 'Avg price', zh: '成交均价' },
  slipMid: { en: 'Slip vs arrival', zh: '相对下单价滑点' },
  slipVwap: { en: 'vs VWAP', zh: '相对 VWAP' },
  nFills: { en: 'Fills', zh: '成交笔数' },
  bars: { en: 'Bars to finish', zh: '完成用时（K 线）' },
  events: { en: 'Events', zh: '事件' },
  type: { en: 'Order type', zh: '订单类型' },
  filledAll: { en: 'Complete', zh: '全部成交' },
  partial: { en: 'Partial', zh: '部分成交' },
  notFilled: { en: 'Never filled', zh: '未成交' },
  noTrigger: { en: 'Never triggered', zh: '未触发' },
  noFills: { en: 'no fills', zh: '无成交' },
  gapped: { en: 'Gapped through the trigger', zh: '跳空穿过触发价' },
  favGap: { en: 'Gapped in your favour', zh: '跳空对你有利' },
  ambiguous: { en: 'Both legs touched in one bar', zh: '两条腿在同一根 K 线内都被触及' },
  simNote: {
    en: 'Simulated tape, bar-level fills. Shapes are real; numbers are illustrative.',
    zh: '模拟行情、按 K 线成交。形状可信，数字仅作示意。',
  },
} satisfies Record<string, Bi>;

export const GROUP_LABEL: Record<Group, Bi> = {
  basic: { en: 'Both brokers', zh: '两家通用' },
  moomoo: { en: 'moomoo only', zh: 'moomoo 特有' },
  tiger: { en: 'Tiger only', zh: 'Tiger 特有' },
};

export const CATS: Category[] = [
  { id: 'basic', label: { en: 'Both brokers', zh: '两家通用' } },
  { id: 'mechanics', label: { en: 'Mechanics', zh: '成交机制' } },
  { id: 'moomoo', label: { en: 'moomoo only', zh: 'moomoo 特有' } },
  { id: 'tiger', label: { en: 'Tiger only', zh: 'Tiger 特有' } },
];

export const PARAM_LABEL: Record<Param, Bi> = {
  qty: { en: 'Quantity', zh: '数量' },
  window: { en: 'Working window (bars)', zh: '有效时段（K 线）' },
  limit: { en: 'Limit price', zh: '限价' },
  stop: { en: 'Trigger price', zh: '触发价' },
  trail: { en: 'Trail amount', zh: '回撤幅度' },
  limitOffset: { en: 'Limit offset', zh: '限价偏移' },
  display: { en: 'Display size', zh: '显示数量' },
  pov: { en: 'Participation rate', zh: '参与率' },
  slices: { en: 'Child orders', zh: '子单数量' },
  tp: { en: 'Take profit', zh: '止盈价' },
  sl: { en: 'Stop loss', zh: '止损价' },
};

export const MARKET_LABEL = {
  trend: { en: 'Session drift', zh: '当日趋势' },
  sigma: { en: 'Volatility', zh: '波动率' },
  shock: { en: 'Gap', zh: '跳空' },
  adv: { en: 'Liquidity', zh: '流动性' },
} satisfies Record<string, Bi>;

export const KIND_LABEL: Record<string, Bi> = {
  place: { en: 'place', zh: '下单' },
  trigger: { en: 'trigger', zh: '触发' },
  fill: { en: 'fill', zh: '成交' },
  partial: { en: 'partial', zh: '部分' },
  expire: { en: 'expire', zh: '失效' },
  warn: { en: 'warn', zh: '注意' },
};

/** Chip/table label: the entry name up to its first em-dash, or the id. */
export const shortName = (names: Record<string, Bi>, id: string, lang: Lang) =>
  names[id] ? names[id][lang].split(' — ')[0] : id;
