/* =========================================================================
   strings.js — families, category labels and the short UI copy for the
   indicators page. Every pair is shown one language at a time.
   ========================================================================= */
(function (root) {
  'use strict';
  const FIN = root.FIN = root.FIN || {};

  /* Technicals come from price and volume; fundamentals from the statements. */
  FIN.FAMILIES = {
    technical: { en: 'Technical', zh: '技术面', accent: '#FF7A00' },
    fundamental: { en: 'Fundamental', zh: '基本面', accent: '#2E9BFF' }
  };

  /* Insertion order is display order. */
  FIN.CATS = {
    trend: { family: 'technical', en: 'Trend', zh: '趋势' },
    strength: { family: 'technical', en: 'Momentum', zh: '强弱动量' },
    pressure_support: { family: 'technical', en: 'Support & Resistance', zh: '压力支撑' },
    price_volume: { family: 'technical', en: 'Price & Volume', zh: '量价' },
    money_flow: { family: 'technical', en: 'Money Flow', zh: '资金流' },
    breadth: { family: 'technical', en: 'Breadth', zh: '市场广度' },
    other: { family: 'technical', en: 'Other', zh: '其他' },
    income_statement: { family: 'fundamental', en: 'Income Statement', zh: '利润表' },
    balance_sheet: { family: 'fundamental', en: 'Balance Sheet', zh: '资产负债表' },
    cash_flow: { family: 'fundamental', en: 'Cash Flow', zh: '现金流量表' },
    key_indicators: { family: 'fundamental', en: 'Key Ratios', zh: '关键比率' }
  };

  FIN.T = {
    subtitle: { en: 'Pick indicators, see them on one chart, read what each one means.', zh: '选指标、看图表、读含义。' },
    all: { en: 'All', zh: '全部' },
    lab: { en: 'Chart lab', zh: '图表实验室' },
    labHint: { en: 'Overlays sit on the candles; oscillators get their own pane.', zh: '主图指标叠在 K 线上，副图指标各占一格。' },
    search: { en: 'Find indicator…', zh: '查找指标…' },
    data: { en: 'Data', zh: '数据' },
    newData: { en: 'Random', zh: '随机' },
    resetZoom: { en: 'Reset zoom', zh: '重置缩放' },
    clearAll: { en: 'Clear', zh: '清空' },
    none: { en: 'Pick an indicator from the list.', zh: '从列表中选择指标。' },
    noMatch: { en: 'No matches.', zh: '没有匹配项。' },
    main: { en: 'Main', zh: '主图' },
    sub: { en: 'Sub', zh: '副图' },
    simulated: { en: 'Illustrative data', zh: '示意数据' },
    remove: { en: 'Remove', zh: '移除' },
    encyclopedia: { en: 'Encyclopedia', zh: '指标百科' },
    encHint: { en: 'Each indicator: the idea and one example.', zh: '每个指标：原理加一个例子。' },
    disclaimer: { en: 'For learning only. All price data here is synthetic.', zh: '仅供学习。本页行情均为合成数据。' }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
