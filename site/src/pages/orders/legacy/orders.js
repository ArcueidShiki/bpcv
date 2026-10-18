/* =============================================================================
   orders.js — the order registry.

   Maps each encyclopedia entry to an execution engine in core.js, declares the
   controls the lab should show for it, and supplies sensible defaults derived
   from the current tape so a newly-selected order type is immediately runnable
   rather than starting in an invalid state.

     engine   key into FIN.M.ENGINE
     group    basic | moomoo | tiger  (the three availability buckets)
     side     'buy' | 'sell' — the direction the structure is normally used in
     params   which sliders/inputs the lab shows
     defaults (tape, side) -> partial ctx
   ============================================================================= */
(function (root) {
  'use strict';
  var FIN = root.FIN = root.FIN || {};
  var O = FIN.ORD = FIN.ORD || {};

  function def(id, o) { O[id] = o; }

  var pctOf = function (tp, i, p) { return tp.mid[i] * (1 + p / 100); };

  /* ------------------------------------------------------- common everywhere */

  def('MARKET', {
    engine: 'MKT', group: 'basic', side: 'buy', params: ['qty'],
    defaults: function () { return {}; }
  });

  def('LIMIT', {
    engine: 'LMT', group: 'basic', side: 'buy', params: ['qty', 'limit', 'window'],
    // Priced below the market so the entry actually rests and the queue
    // mechanics are visible rather than instantly marketable.
    defaults: function (tp, side, i) { return { limit: +pctOf(tp, i, side === 'buy' ? -0.35 : 0.35).toFixed(2) }; }
  });

  def('STOP', {
    engine: 'STP', group: 'basic', side: 'sell', params: ['qty', 'stop', 'window'],
    defaults: function (tp, side, i) { return { stop: +pctOf(tp, i, side === 'sell' ? -0.8 : 0.8).toFixed(2) }; }
  });

  def('STOP_LIMIT', {
    engine: 'STL', group: 'basic', side: 'sell', params: ['qty', 'stop', 'limit', 'window'],
    defaults: function (tp, side, i) {
      var s = +pctOf(tp, i, side === 'sell' ? -0.8 : 0.8).toFixed(2);
      return { stop: s, limit: +(s + (side === 'sell' ? -0.15 : 0.15)).toFixed(2) };
    }
  });

  def('TRAILING_STOP', {
    engine: 'TS', group: 'basic', side: 'sell', params: ['qty', 'trail', 'window'],
    defaults: function (tp) { return { trail: +(tp.S0 * 0.008).toFixed(2) }; }
  });

  def('TRAILING_STOP_LIMIT', {
    engine: 'TSL', group: 'basic', side: 'sell', params: ['qty', 'trail', 'limitOffset', 'window'],
    defaults: function (tp) { return { trail: +(tp.S0 * 0.008).toFixed(2), limitOffset: +(tp.S0 * 0.0015).toFixed(2) }; }
  });

  def('TWAP', {
    engine: 'TWAP', group: 'basic', side: 'buy', params: ['qty', 'slices', 'window'],
    defaults: function () { return { slices: 12 }; }
  });

  def('VWAP', {
    engine: 'VWAP', group: 'basic', side: 'buy', params: ['qty', 'slices', 'window'],
    defaults: function () { return { slices: 12 }; }
  });

  def('BRACKET_OCO', {
    engine: 'OCO', group: 'basic', side: 'sell', params: ['qty', 'tp', 'sl', 'window'],
    // A long already on: take-profit above, stop-loss below.
    defaults: function (tp, side, i) {
      return { tp: +pctOf(tp, i, 1.2).toFixed(2), sl: +pctOf(tp, i, -0.9).toFixed(2) };
    }
  });

  /* ------------------------------------------------------------ moomoo-only */

  def('MOC', {
    engine: 'MOC', group: 'moomoo', side: 'buy', params: ['qty'],
    defaults: function () { return {}; }
  });

  def('MIT', {
    engine: 'MIT', group: 'moomoo', side: 'buy', params: ['qty', 'stop', 'window'],
    // Buy if touched sits BELOW the market — the mirror image of a buy stop.
    defaults: function (tp, side, i) { return { stop: +pctOf(tp, i, side === 'buy' ? -0.7 : 0.7).toFixed(2) }; }
  });

  def('LIT', {
    engine: 'LIT', group: 'moomoo', side: 'buy', params: ['qty', 'stop', 'limit', 'window'],
    defaults: function (tp, side, i) {
      var s = +pctOf(tp, i, side === 'buy' ? -0.7 : 0.7).toFixed(2);
      return { stop: s, limit: +(s + (side === 'buy' ? 0.1 : -0.1)).toFixed(2) };
    }
  });

  def('POV', {
    engine: 'POV', group: 'moomoo', side: 'buy', params: ['qty', 'pov', 'window'],
    defaults: function () { return { pov: 10 }; }
  });

  /* ------------------------------------------------------------- tiger-only */

  def('HK_AUCTION_MKT', {
    engine: 'AUCTION_MKT', group: 'tiger', side: 'buy', params: ['qty'],
    defaults: function () { return {}; }
  });

  def('HK_AUCTION_LMT', {
    engine: 'AUCTION_LMT', group: 'tiger', side: 'buy', params: ['qty', 'limit'],
    defaults: function (tp, side, i) { return { limit: +pctOf(tp, i, side === 'buy' ? 0.25 : -0.25).toFixed(2) }; }
  });

  def('DARK_POOL', {
    engine: 'DARK', group: 'tiger', side: 'buy', params: ['qty'],
    defaults: function () { return {}; }
  });

  def('CONDITIONAL', {
    engine: 'CONDITIONAL', group: 'tiger', side: 'buy', params: ['qty', 'stop', 'window'],
    defaults: function (tp, side, i) { return { stop: +pctOf(tp, i, side === 'buy' ? 0.6 : -0.6).toFixed(2) }; }
  });

  def('ATTACHED', {
    engine: 'ATTACHED', group: 'tiger', side: 'buy', params: ['qty', 'tp', 'window'],
    defaults: function (tp, side, i) { return { tp: +pctOf(tp, i, 1.1).toFixed(2) }; }
  });

  def('ICEBERG', {
    engine: 'ICEBERG', group: 'tiger', side: 'buy', params: ['qty', 'limit', 'display', 'window'],
    defaults: function (tp, side, i) {
      return { limit: +pctOf(tp, i, side === 'buy' ? -0.15 : 0.15).toFixed(2), display: 2000 };
    }
  });

  FIN.GROUPS = ['basic', 'moomoo', 'tiger'];

  /* Build a runnable context for an order id at the current lab settings. */
  FIN.ctx = function (id, lab, tape) {
    var spec = O[id];
    if (!spec) return null;
    var side = lab.side || spec.side;
    var start = Math.min(lab.start || 0, tape.n - 2);
    var end = Math.min(tape.n - 1, start + (lab.window || tape.n));
    var d = spec.defaults(tape, side, start) || {};
    var c = {
      tape: tape, side: side, qty: lab.qty, start: start, end: end,
      limit: d.limit, stop: d.stop, trail: d.trail, limitOffset: d.limitOffset,
      display: d.display, pov: d.pov, slices: d.slices, tp: d.tp, sl: d.sl
    };
    // user overrides win, but only for parameters this order type actually uses
    spec.params.forEach(function (p) {
      if (p === 'qty' || p === 'window') return;
      if (lab.over && lab.over[p] != null) c[p] = lab.over[p];
    });
    if (d.pov != null && c.pov == null) c.pov = d.pov;
    if (d.slices != null && c.slices == null) c.slices = d.slices;
    return c;
  };

  /* A human-readable ticket line, e.g. "BUY 10,000 · limit 99.65 · GTC". */
  FIN.ticket = function (id, c, lang) {
    var spec = O[id];
    var buy = lang === 'zh' ? '买入' : 'BUY', sell = lang === 'zh' ? '卖出' : 'SELL';
    var bits = [(c.side === 'buy' ? buy : sell) + ' ' + c.qty.toLocaleString('en-US')];
    var lbl = {
      limit: lang === 'zh' ? '限价' : 'limit',
      stop: lang === 'zh' ? '触发价' : 'trigger',
      trail: lang === 'zh' ? '回撤' : 'trail',
      limitOffset: lang === 'zh' ? '限价偏移' : 'offset',
      display: lang === 'zh' ? '显示量' : 'display',
      pov: lang === 'zh' ? '参与率' : 'POV',
      slices: lang === 'zh' ? '子单数' : 'slices',
      tp: lang === 'zh' ? '止盈' : 'TP',
      sl: lang === 'zh' ? '止损' : 'SL'
    };
    spec.params.forEach(function (p) {
      if (p === 'qty' || p === 'window' || c[p] == null) return;
      var v = p === 'pov' ? c[p] + '%' : p === 'display' || p === 'slices' ? c[p] : c[p].toFixed(2);
      bits.push(lbl[p] + ' ' + v);
    });
    return bits.join(' · ');
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
