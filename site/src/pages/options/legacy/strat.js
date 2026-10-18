/* =============================================================================
   strat.js — the strategy registry.

   Each entry declares its legs relative to the at-the-money strike. `k` is an
   offset in units of the lab's strike width `w` (a percentage of spot), so one
   registry works at any price level and any width the user drags to.

     t : 'C' call | 'P' put | 'S' the underlying
     q : signed quantity (+ long / − short)
     k : strike offset in units of w   (omitted for 'S')
     e : 'near' (default) | 'far'      — which expiry the leg belongs to

   `bias` mirrors the six outlook tabs a broker's strategy screen shows, so the
   page can be navigated exactly the way the platform is.
   ============================================================================= */
(function (root) {
  'use strict';
  var FIN = root.FIN = root.FIN || {};
  var S = FIN.STRAT = FIN.STRAT || {};

  function def(id, bias, legs, extra) {
    var o = { id: id, bias: bias, legs: legs };
    if (extra) for (var k in extra) o[k] = extra[k];
    S[id] = o;
  }

  /* ------------------------------------------------------- bullish / v.bullish */

  def('LONG_CALL', 'bullish', [{ t: 'C', q: 1, k: 0 }]);
  def('SHORT_PUT', 'bullish', [{ t: 'P', q: -1, k: -1 }]);
  def('CASH_SECURED_PUT', 'bullish', [{ t: 'P', q: -1, k: -1 }], { cashSecured: true });
  def('COVERED_CALL', 'bullish', [{ t: 'S', q: 1 }, { t: 'C', q: -1, k: 1 }]);
  def('LONG_CALL_SPREAD', 'bullish', [{ t: 'C', q: 1, k: 0 }, { t: 'C', q: -1, k: 1 }]);
  def('SHORT_PUT_SPREAD', 'bullish', [{ t: 'P', q: 1, k: -2 }, { t: 'P', q: -1, k: -1 }]);
  def('SYNTHETIC_LONG', 'bullish', [{ t: 'C', q: 1, k: 0 }, { t: 'P', q: -1, k: 0 }]);

  /* ------------------------------------------------------------------ neutral */

  def('SHORT_STRADDLE', 'neutral', [{ t: 'C', q: -1, k: 0 }, { t: 'P', q: -1, k: 0 }]);
  def('SHORT_STRANGLE', 'neutral', [{ t: 'C', q: -1, k: 1 }, { t: 'P', q: -1, k: -1 }]);
  def('LONG_CALL_BFLY', 'neutral', [{ t: 'C', q: 1, k: -1 }, { t: 'C', q: -2, k: 0 }, { t: 'C', q: 1, k: 1 }]);
  def('LONG_PUT_BFLY', 'neutral', [{ t: 'P', q: 1, k: -1 }, { t: 'P', q: -2, k: 0 }, { t: 'P', q: 1, k: 1 }]);
  def('SHORT_IRON_BFLY', 'neutral', [{ t: 'P', q: 1, k: -1 }, { t: 'P', q: -1, k: 0 }, { t: 'C', q: -1, k: 0 }, { t: 'C', q: 1, k: 1 }]);
  def('SHORT_IRON_CONDOR', 'neutral', [{ t: 'P', q: 1, k: -2 }, { t: 'P', q: -1, k: -1 }, { t: 'C', q: -1, k: 1 }, { t: 'C', q: 1, k: 2 }]);

  /* -------------------------------------------------------------- directional */

  def('LONG_STRADDLE', 'directional', [{ t: 'C', q: 1, k: 0 }, { t: 'P', q: 1, k: 0 }]);
  def('LONG_STRANGLE', 'directional', [{ t: 'C', q: 1, k: 1 }, { t: 'P', q: 1, k: -1 }]);
  def('SHORT_CALL_BFLY', 'directional', [{ t: 'C', q: -1, k: -1 }, { t: 'C', q: 2, k: 0 }, { t: 'C', q: -1, k: 1 }]);
  def('SHORT_PUT_BFLY', 'directional', [{ t: 'P', q: -1, k: -1 }, { t: 'P', q: 2, k: 0 }, { t: 'P', q: -1, k: 1 }]);
  def('LONG_IRON_BFLY', 'directional', [{ t: 'P', q: -1, k: -1 }, { t: 'P', q: 1, k: 0 }, { t: 'C', q: 1, k: 0 }, { t: 'C', q: -1, k: 1 }]);
  def('LONG_IRON_CONDOR', 'directional', [{ t: 'P', q: -1, k: -2 }, { t: 'P', q: 1, k: -1 }, { t: 'C', q: 1, k: 1 }, { t: 'C', q: -1, k: 2 }]);

  /* ------------------------------------------------------ bearish / v.bearish */

  def('LONG_PUT', 'bearish', [{ t: 'P', q: 1, k: 0 }]);
  def('SHORT_CALL', 'bearish', [{ t: 'C', q: -1, k: 1 }]);
  def('SHORT_CALL_SPREAD', 'bearish', [{ t: 'C', q: -1, k: 1 }, { t: 'C', q: 1, k: 2 }]);
  def('LONG_PUT_SPREAD', 'bearish', [{ t: 'P', q: 1, k: 0 }, { t: 'P', q: -1, k: -1 }]);
  def('SYNTHETIC_SHORT', 'bearish', [{ t: 'P', q: 1, k: 0 }, { t: 'C', q: -1, k: 0 }]);

  /* ------------------------------------------------------------------ basics */

  def('IRON_CONDOR', 'basics', [{ t: 'P', q: 1, k: -2 }, { t: 'P', q: -1, k: -1 }, { t: 'C', q: -1, k: 1 }, { t: 'C', q: 1, k: 2 }]);
  def('IRON_BUTTERFLY', 'basics', [{ t: 'P', q: 1, k: -1 }, { t: 'P', q: -1, k: 0 }, { t: 'C', q: -1, k: 0 }, { t: 'C', q: 1, k: 1 }]);
  def('SYNTHETIC_PUT', 'basics', [{ t: 'S', q: -1 }, { t: 'C', q: 1, k: 0 }]);
  def('PROTECTIVE_PUT', 'basics', [{ t: 'S', q: 1 }, { t: 'P', q: 1, k: -1 }]);

  /* ---------------------------------------------------------------- advanced */

  def('COLLAR', 'advanced', [{ t: 'S', q: 1 }, { t: 'P', q: 1, k: -1 }, { t: 'C', q: -1, k: 1 }]);
  def('CALENDAR_SPREAD', 'advanced', [{ t: 'C', q: -1, k: 0, e: 'near' }, { t: 'C', q: 1, k: 0, e: 'far' }]);
  def('DIAGONAL_SPREAD', 'advanced', [{ t: 'C', q: -1, k: 1, e: 'near' }, { t: 'C', q: 1, k: -1, e: 'far' }]);

  /* --------------------------------------------------------------- materialise */
  /*
     Turn a declaration into a concrete position at the current lab settings.
     Strikes snap to the chain's tick so the numbers read like a real ticket,
     and each leg gets its own implied vol from the smile — a strangle priced
     with one flat vol would understate the downside put every time.
  */
  FIN.build = function (id, o) {
    var spec = S[id];
    if (!spec) return null;
    var Sp = o.S, w = o.w, tick = o.tick || 5;
    var smile = o.smile !== false;
    var snap = function (x) { return Math.max(tick, Math.round(x / tick) * tick); };
    var Tn = o.dte / 365, Tf = (o.dteFar || o.dte * 3) / 365;

    var legs = spec.legs.map(function (L) {
      if (L.t === 'S') return { t: 'S', q: L.q * 100, K: null, T: 0, v: 0 };
      var K = snap(Sp * (1 + L.k * w));
      var T = L.e === 'far' ? Tf : Tn;
      var v = o.iv;
      if (smile) {
        var m = Math.log(K / Sp);
        v = Math.max(0.05, o.iv * (1 - 0.85 * m + 1.15 * m * m));
        // Far-dated legs sit lower on a normal (contango) term structure.
        if (L.e === 'far') v *= 0.88;
      }
      return { t: L.t, q: L.q, K: K, T: T, v: v };
    });
    return { id: id, bias: spec.bias, legs: legs, cashSecured: !!spec.cashSecured };
  };

  // Human-readable ticket line, e.g. "Long 860P · Short 910C".
  FIN.ticket = function (pos, lang) {
    var LO = lang === 'zh' ? '买入' : 'Long', SH = lang === 'zh' ? '卖出' : 'Short';
    return pos.legs.map(function (L) {
      if (L.t === 'S') return (L.q > 0 ? LO : SH) + ' ' + (lang === 'zh' ? '正股' : 'Stock') + ' ×' + Math.abs(L.q);
      var n = Math.abs(L.q) > 1 ? ' ×' + Math.abs(L.q) : '';
      return (L.q > 0 ? LO : SH) + ' ' + L.K + L.t + n;
    }).join(' · ');
  };

  FIN.BIASES = ['bullish', 'neutral', 'directional', 'bearish', 'basics', 'advanced'];

})(typeof globalThis !== 'undefined' ? globalThis : this);
