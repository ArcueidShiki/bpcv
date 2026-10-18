import type { Bi, Category } from '../../shared/types';
import type { Bias } from './fin';

/** Display names for every structure in FIN.STRAT. Kept here (not read from
 *  content.json) so the lab never depends on encyclopedia wording. */
export const STRAT_NAMES: Record<string, Bi> = {
  LONG_CALL: { en: 'Long Call', zh: '买入看涨' },
  SHORT_PUT: { en: 'Short Put', zh: '卖出看跌' },
  CASH_SECURED_PUT: { en: 'Cash-Secured Put', zh: '现金担保看跌' },
  COVERED_CALL: { en: 'Covered Call', zh: '备兑看涨' },
  LONG_CALL_SPREAD: { en: 'Bull Call Spread', zh: '看涨牛市价差' },
  SHORT_PUT_SPREAD: { en: 'Bull Put Spread', zh: '看跌牛市价差' },
  SYNTHETIC_LONG: { en: 'Synthetic Long', zh: '合成多头' },
  SHORT_STRADDLE: { en: 'Short Straddle', zh: '卖出跨式' },
  SHORT_STRANGLE: { en: 'Short Strangle', zh: '卖出宽跨式' },
  LONG_CALL_BFLY: { en: 'Long Call Butterfly', zh: '买入看涨蝶式' },
  LONG_PUT_BFLY: { en: 'Long Put Butterfly', zh: '买入看跌蝶式' },
  SHORT_IRON_BFLY: { en: 'Short Iron Butterfly', zh: '卖出铁蝶式' },
  SHORT_IRON_CONDOR: { en: 'Short Iron Condor', zh: '卖出铁鹰式' },
  LONG_STRADDLE: { en: 'Long Straddle', zh: '买入跨式' },
  LONG_STRANGLE: { en: 'Long Strangle', zh: '买入宽跨式' },
  SHORT_CALL_BFLY: { en: 'Short Call Butterfly', zh: '卖出看涨蝶式' },
  SHORT_PUT_BFLY: { en: 'Short Put Butterfly', zh: '卖出看跌蝶式' },
  LONG_IRON_BFLY: { en: 'Long Iron Butterfly', zh: '买入铁蝶式' },
  LONG_IRON_CONDOR: { en: 'Long Iron Condor', zh: '买入铁鹰式' },
  LONG_PUT: { en: 'Long Put', zh: '买入看跌' },
  SHORT_CALL: { en: 'Naked Short Call', zh: '裸卖看涨' },
  SHORT_CALL_SPREAD: { en: 'Bear Call Spread', zh: '看涨熊市价差' },
  LONG_PUT_SPREAD: { en: 'Bear Put Spread', zh: '看跌熊市价差' },
  SYNTHETIC_SHORT: { en: 'Synthetic Short', zh: '合成空头' },
  IRON_CONDOR: { en: 'Iron Condor', zh: '铁鹰式' },
  IRON_BUTTERFLY: { en: 'Iron Butterfly', zh: '铁蝶式' },
  SYNTHETIC_PUT: { en: 'Synthetic Put', zh: '合成看跌' },
  PROTECTIVE_PUT: { en: 'Protective Put', zh: '保护性看跌' },
  COLLAR: { en: 'Collar', zh: '领口' },
  CALENDAR_SPREAD: { en: 'Calendar Spread', zh: '日历价差' },
  DIAGONAL_SPREAD: { en: 'Diagonal Spread', zh: '对角价差' },
};

export const stratName = (id: string): Bi => STRAT_NAMES[id] ?? { en: id, zh: id };

export const BIAS_LABEL: Record<Bias, Bi> = {
  bullish: { en: 'Bullish', zh: '看涨' },
  neutral: { en: 'Neutral', zh: '中性' },
  directional: { en: 'Big move', zh: '大幅波动' },
  bearish: { en: 'Bearish', zh: '看跌' },
  basics: { en: 'Basics', zh: '基础' },
  advanced: { en: 'Advanced', zh: '进阶' },
};

/** Encyclopedia categories, in reading order. */
export const CATS: Category[] = [
  { id: 'greeks', label: { en: 'Greeks', zh: '希腊字母' } },
  { id: 'metrics', label: { en: 'Trade metrics', zh: '交易指标' } },
  { id: 'pricing', label: { en: 'Pricing & vol', zh: '定价与波动率' } },
  { id: 'contract', label: { en: 'Contract terms', zh: '合约参数' } },
  { id: 'chain', label: { en: 'Chain flow', zh: '期权链流量' } },
  { id: 'analysis', label: { en: 'Positioning', zh: '持仓分析' } },
  { id: 'concepts', label: { en: 'Core concepts', zh: '核心概念' } },
  { id: 'strat-bullish', label: { en: 'Bullish', zh: '看涨策略' } },
  { id: 'strat-bearish', label: { en: 'Bearish', zh: '看跌策略' } },
  { id: 'strat-neutral', label: { en: 'Neutral', zh: '中性策略' } },
  { id: 'strat-directional', label: { en: 'Big move', zh: '大幅波动' } },
  { id: 'strat-basics', label: { en: 'Basic structures', zh: '基础结构' } },
  { id: 'strat-advanced', label: { en: 'Advanced', zh: '进阶结构' } },
];
