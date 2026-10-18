/* =============================================================================
   chart.js — the pictures, on a 2D canvas.

     Chart.tape(cv, o)     the session: price, VWAP, the order's levels, the
                           trailing-stop path, and a marker at every place /
                           trigger / fill event, over a volume sub-panel.
     Chart.ladder(cv, o)   the depth ladder, with the levels a sweep consumed
                           highlighted so the source of slippage is visible.
     Chart.fills(cv, o)    how the quantity actually arrived, bar by bar.

   No external deps, HiDPI-aware, every renderer a pure function of its options.
   ============================================================================= */
(function (root) {
  'use strict';
  var FIN = root.FIN = root.FIN || {};
  var C = FIN.Chart = {};

  var CL = C.colors = {
    grid: '#1E2229', axis: '#333A46', text2: '#626A78', text1: '#EAECEF',
    up: '#00B96B', down: '#FA4D56', brand: '#FF7A00', info: '#2E9BFF',
    gold: '#FFC53D', violet: '#8C6EFF', teal: '#34D6B4', warn: '#FFA53D'
  };

  function setup(cv) {
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    var w = Math.max(60, Math.round(r.width || cv.clientWidth || 600));
    var h = Math.max(60, Math.round(r.height || cv.clientHeight || 240));
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    var x = cv.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, w, h);
    x.font = '10.5px ui-monospace, SFMono-Regular, Menlo, monospace';
    x.textBaseline = 'middle';
    return { x: x, w: w, h: h };
  }

  function ticks(lo, hi, n) {
    if (!(hi > lo)) return [lo];
    var raw = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag, step = mag * (norm >= 5 ? 5 : norm >= 2 ? 2 : 1);
    var out = [], t = Math.ceil(lo / step) * step;
    for (; t <= hi + step * 0.001; t += step) out.push(t);
    return out;
  }
  function nice(v) {
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(0) + 'K';
    return v.toFixed(0);
  }

  function plot(w, h, pad) {
    var l = pad.l, r = w - pad.r, t = pad.t, b = h - pad.b;
    return {
      l: l, r: r, t: t, b: b,
      set: function (x0, x1, y0, y1) { this.x0 = x0; this.x1 = x1; this.y0 = y0; this.y1 = y1; return this; },
      px: function (v) { return l + (v - this.x0) / (this.x1 - this.x0) * (r - l); },
      py: function (v) { return b - (v - this.y0) / (this.y1 - this.y0) * (b - t); }
    };
  }

  function frame(x, P, xs, ys, fmtX, fmtY) {
    x.strokeStyle = CL.grid; x.lineWidth = 1; x.fillStyle = CL.text2; x.textAlign = 'right';
    ys.forEach(function (t) {
      var py = P.py(t);
      if (py < P.t - 1 || py > P.b + 1) return;
      x.beginPath(); x.moveTo(P.l, Math.round(py) + 0.5); x.lineTo(P.r, Math.round(py) + 0.5); x.stroke();
      x.fillText(fmtY(t), P.l - 6, py);
    });
    x.textAlign = 'center';
    xs.forEach(function (t) {
      var px = P.px(t);
      if (px < P.l - 1 || px > P.r + 1) return;
      x.beginPath(); x.moveTo(Math.round(px) + 0.5, P.t); x.lineTo(Math.round(px) + 0.5, P.b); x.stroke();
      x.fillText(fmtX(t), px, P.b + 12);
    });
    x.strokeStyle = CL.axis;
    x.beginPath(); x.moveTo(P.l, P.b + 0.5); x.lineTo(P.r, P.b + 0.5); x.stroke();
  }

  function hline(x, P, v, col, label, dash) {
    var py = P.py(v);
    if (py < P.t - 1 || py > P.b + 1) return;
    x.save(); x.setLineDash(dash || []); x.strokeStyle = col; x.lineWidth = 1;
    x.beginPath(); x.moveTo(P.l, Math.round(py) + 0.5); x.lineTo(P.r, Math.round(py) + 0.5); x.stroke();
    x.restore();
    if (label) {
      x.save(); x.font = '9.5px ui-monospace, Menlo, monospace';
      var tw = x.measureText(label).width + 8;
      x.fillStyle = col; x.globalAlpha = 0.17; x.fillRect(P.l + 3, py - 7, tw, 14);
      x.globalAlpha = 1; x.fillStyle = col; x.textAlign = 'left';
      x.fillText(label, P.l + 7, py);
      x.restore();
    }
  }

  /* ------------------------------------------------------------------- tape */
  /*
     o = { tape, res, c (the ctx), showVwap, label }
     `res` is the FIN.M.run() result: fills[], events[], optional trail[].
  */
  C.tape = function (cv, o) {
    var s = setup(cv), x = s.x, tp = o.tape, res = o.res, ctx = o.c;
    var volH = Math.min(58, s.h * 0.24);
    var P = plot(s.w, s.h - volH - 6, { l: 54, r: 62, t: 12, b: 20 });
    var V = plot(s.w, s.h, { l: 54, r: 62, t: s.h - volH, b: 4 });

    var lo = Infinity, hi = -Infinity, i;
    for (i = 0; i < tp.n; i++) { lo = Math.min(lo, tp.l[i]); hi = Math.max(hi, tp.h[i]); }
    // make sure the order's own levels are on screen — an off-screen stop is
    // exactly the thing the reader needs to see
    [ctx && ctx.limit, ctx && ctx.stop, ctx && ctx.tp, ctx && ctx.sl].forEach(function (v) {
      if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    });
    var pad = (hi - lo) * 0.08 || 1;
    P.set(0, tp.n - 1, lo - pad, hi + pad);

    frame(x, P, ticks(0, tp.n - 1, 6), ticks(P.y0, P.y1, 5),
      function (t) { return Math.round(t); },
      function (t) { return t.toFixed(2); });

    // volume sub-panel
    var vmax = 0; for (i = 0; i < tp.n; i++) vmax = Math.max(vmax, tp.vol[i]);
    V.set(0, tp.n - 1, 0, vmax * 1.05);
    var bw = Math.max(0.8, (V.r - V.l) / tp.n * 0.8);
    for (i = 0; i < tp.n; i++) {
      x.fillStyle = tp.c[i] >= tp.o[i] ? 'rgba(0,185,107,0.32)' : 'rgba(250,77,86,0.32)';
      x.fillRect(V.px(i) - bw / 2, V.py(tp.vol[i]), bw, V.b - V.py(tp.vol[i]));
    }
    x.save(); x.fillStyle = CL.text2; x.textAlign = 'right'; x.font = '9px ui-monospace, Menlo, monospace';
    x.fillText(nice(vmax), V.l - 6, V.t + 6); x.restore();

    // the gap, if the tape has one — the single most instructive bar
    if (tp.shockBar != null) {
      var gx = P.px(tp.shockBar);
      x.save(); x.fillStyle = 'rgba(255,165,61,0.13)';
      x.fillRect(gx - 2, P.t, 4, P.b - P.t);
      x.restore();
    }

    // high/low band + close line
    x.beginPath();
    for (i = 0; i < tp.n; i++) x.lineTo(P.px(i), P.py(tp.h[i]));
    for (i = tp.n - 1; i >= 0; i--) x.lineTo(P.px(i), P.py(tp.l[i]));
    x.closePath(); x.fillStyle = 'rgba(234,236,239,0.07)'; x.fill();

    if (o.showVwap !== false) {
      x.save(); x.setLineDash([4, 3]); x.strokeStyle = CL.violet; x.lineWidth = 1.2;
      x.beginPath();
      for (i = 0; i < tp.n; i++) (i ? x.lineTo : x.moveTo).call(x, P.px(i), P.py(tp.vwap[i]));
      x.stroke(); x.restore();
    }

    x.strokeStyle = CL.text1; x.lineWidth = 1.5; x.beginPath();
    for (i = 0; i < tp.n; i++) (i ? x.lineTo : x.moveTo).call(x, P.px(i), P.py(tp.c[i]));
    x.stroke();

    // the trailing-stop ratchet
    if (res && res.trail && res.trail.length) {
      x.save(); x.strokeStyle = CL.warn; x.lineWidth = 1.3; x.setLineDash([2, 2]);
      x.beginPath();
      res.trail.forEach(function (p, k) { (k ? x.lineTo : x.moveTo).call(x, P.px(p.i), P.py(p.stop)); });
      x.stroke(); x.restore();
    }

    // the order's static levels
    if (ctx) {
      if (ctx.limit != null) hline(x, P, ctx.limit, CL.info, 'limit ' + ctx.limit.toFixed(2), [5, 3]);
      if (ctx.stop != null) hline(x, P, ctx.stop, CL.down, 'trigger ' + ctx.stop.toFixed(2), [5, 3]);
      if (ctx.tp != null) hline(x, P, ctx.tp, CL.up, 'TP ' + ctx.tp.toFixed(2), [5, 3]);
      if (ctx.sl != null) hline(x, P, ctx.sl, CL.down, 'SL ' + ctx.sl.toFixed(2), [5, 3]);
      hline(x, P, tp.mid[ctx.start], CL.brand, 'arrival ' + tp.mid[ctx.start].toFixed(2), [1, 3]);
    }

    // fills
    if (res && res.fills) {
      var maxQ = 0; res.fills.forEach(function (f) { maxQ = Math.max(maxQ, f.qty); });
      res.fills.forEach(function (f) {
        var r = 2.4 + 3.4 * Math.sqrt(f.qty / (maxQ || 1));
        x.beginPath(); x.arc(P.px(f.i), P.py(f.px), r, 0, 6.2832);
        x.fillStyle = 'rgba(0,185,107,0.85)'; x.fill();
        x.strokeStyle = '#0E0F13'; x.lineWidth = 1; x.stroke();
      });
    }

    // event flags
    if (res && res.events) {
      var col = { place: CL.info, trigger: CL.warn, fill: CL.up, partial: CL.gold, expire: CL.down, warn: CL.warn };
      res.events.forEach(function (e, k) {
        var px = P.px(e.i), c = col[e.kind] || CL.text2;
        x.save(); x.strokeStyle = c; x.lineWidth = 1; x.setLineDash([2, 3]);
        x.beginPath(); x.moveTo(px, P.t); x.lineTo(px, P.b); x.stroke(); x.restore();
        x.save(); x.font = '9px ui-monospace, Menlo, monospace';
        var lbl = e.label, tw = x.measureText(lbl).width + 8;
        var lx = Math.max(P.l, Math.min(P.r - tw, px + 3));
        var ly = P.t + 2 + (k % 4) * 15;
        x.fillStyle = c; x.globalAlpha = 0.17; x.fillRect(lx, ly, tw, 13);
        x.globalAlpha = 1; x.textAlign = 'left'; x.fillText(lbl, lx + 4, ly + 6.5);
        x.restore();
      });
    }

    // right-edge price labels
    x.save(); x.textAlign = 'left'; x.font = '9.5px ui-monospace, Menlo, monospace';
    x.fillStyle = CL.text1; x.fillText(tp.c[tp.n - 1].toFixed(2), P.r + 5, P.py(tp.c[tp.n - 1]));
    if (o.showVwap !== false) { x.fillStyle = CL.violet; x.fillText('VWAP', P.r + 5, P.py(tp.vwap[tp.n - 1])); }
    x.restore();
  };

  /* ----------------------------------------------------------------- ladder */
  /*
     o = { book, mid, consumed (n levels a sweep ate), side, tick }
     Horizontal depth ladder: asks above, bids below, sizes as bars.
  */
  C.ladder = function (cv, o) {
    var s = setup(cv), x = s.x, bk = o.book;
    var levels = Math.min(o.levels || 8, bk.asks.length);
    var rows = [];
    for (var k = levels - 1; k >= 0; k--) rows.push({ side: 'ask', px: bk.asks[k].px, sz: bk.asks[k].sz, k: k });
    for (k = 0; k < levels; k++) rows.push({ side: 'bid', px: bk.bids[k].px, sz: bk.bids[k].sz, k: k });

    var maxSz = 0; rows.forEach(function (r) { maxSz = Math.max(maxSz, r.sz); });
    var rowH = (s.h - 8) / rows.length;
    var pxCol = 58, szCol = 62, barL = pxCol + 4, barR = s.w - szCol;

    rows.forEach(function (r, i) {
      var y = 4 + i * rowH, mid = y + rowH / 2;
      var eaten = o.consumed != null && r.side === (o.side === 'buy' ? 'ask' : 'bid') && r.k < o.consumed;
      var base = r.side === 'ask' ? [250, 77, 86] : [0, 185, 107];
      var w = (barR - barL) * (r.sz / maxSz);

      x.fillStyle = 'rgba(' + base.join(',') + ',' + (eaten ? 0.55 : 0.2) + ')';
      x.fillRect(barL, y + 1, w, rowH - 2);
      if (eaten) {
        x.strokeStyle = CL.brand; x.lineWidth = 1;
        x.strokeRect(barL + 0.5, y + 1.5, w - 1, rowH - 3);
      }
      x.fillStyle = eaten ? CL.brand : (r.side === 'ask' ? '#FF8A8A' : '#34D399');
      x.textAlign = 'right'; x.fillText(r.px.toFixed(2), pxCol, mid);
      x.fillStyle = eaten ? CL.text1 : CL.text2;
      x.textAlign = 'right'; x.fillText(r.sz.toLocaleString('en-US'), s.w - 6, mid);
    });

    // the touch
    var midY = 4 + levels * rowH;
    x.strokeStyle = CL.axis; x.lineWidth = 1;
    x.beginPath(); x.moveTo(0, Math.round(midY) + 0.5); x.lineTo(s.w, Math.round(midY) + 0.5); x.stroke();
  };

  /* ------------------------------------------------------------------ fills */

  C.fills = function (cv, o) {
    var s = setup(cv), x = s.x, tp = o.tape, fills = o.fills || [];
    var P = plot(s.w, s.h, { l: 50, r: 10, t: 10, b: 18 });
    var byBar = {};
    fills.forEach(function (f) { byBar[f.i] = (byBar[f.i] || 0) + f.qty; });
    var maxQ = 0; Object.keys(byBar).forEach(function (k) { maxQ = Math.max(maxQ, byBar[k]); });
    P.set(0, tp.n - 1, 0, (maxQ || 1) * 1.1);
    frame(x, P, ticks(0, tp.n - 1, 5), ticks(0, P.y1, 3),
      function (t) { return Math.round(t); }, function (t) { return nice(t); });
    var bw = Math.max(2, (P.r - P.l) / tp.n * 0.9);
    Object.keys(byBar).forEach(function (k) {
      var i = +k, q = byBar[k];
      x.fillStyle = 'rgba(0,185,107,0.8)';
      x.fillRect(P.px(i) - bw / 2, P.py(q), bw, P.b - P.py(q));
    });
    if (!fills.length) {
      x.fillStyle = CL.text2; x.textAlign = 'center';
      x.fillText(o.emptyLabel || 'no fills', (P.l + P.r) / 2, (P.t + P.b) / 2);
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
