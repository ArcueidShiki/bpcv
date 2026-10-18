/* =============================================================================
   chart.js — every picture on the page, drawn on a 2D canvas.

   Five renderers:
     Chart.payoff(cv, opt)   P/L at expiry + the T+0 mark-to-market curve,
                             strikes, break-evens, spot, shaded profit zones and
                             an optional risk-neutral density underlay.
     Chart.gex(cv, opt)      call / put / net GEX bars + the aggregate curve,
                             gamma flip, call wall, put wall.
     Chart.strikeBars(cv,..) volume-by-strike or OI-by-strike, calls up/puts down.
     Chart.curve(cv, opt)    generic line panel — smile, term structure, IV vs HV.
     Chart.cone(cv, opt)     probability cone with ±1σ / ±2σ bands.

   No external deps, HiDPI-aware, and every renderer is a pure function of its
   options object so the UI can just re-call it.
   ============================================================================= */
(function (root) {
  'use strict';
  var FIN = root.FIN = root.FIN || {};
  var C = FIN.Chart = {};

  var CL = C.colors = {
    bg: '#0E0F13', grid: '#1E2229', axis: '#333A46',
    text: '#99A1AD', text2: '#626A78', text1: '#EAECEF',
    up: '#00B96B', down: '#FA4D56', brand: '#FF7A00', info: '#2E9BFF',
    gold: '#FFC53D', purple: '#B79CFF', teal: '#34D6B4', warn: '#FFA53D'
  };

  function setup(cv) {
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    var w = Math.max(60, Math.round(r.width || cv.clientWidth || 600));
    var h = Math.max(60, Math.round(r.height || cv.clientHeight || 260));
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    var x = cv.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, w, h);
    x.font = '10.5px ui-monospace, SFMono-Regular, Menlo, monospace';
    x.textBaseline = 'middle';
    return { x: x, w: w, h: h };
  }
  C.setup = setup;

  function nice(v, n) {
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'K';
    return v.toFixed(n == null ? 0 : n);
  }
  function ticks(lo, hi, n) {
    if (!(hi > lo)) return [lo];
    var raw = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag, step = mag * (norm >= 5 ? 5 : norm >= 2 ? 2 : 1);
    var out = [], t = Math.ceil(lo / step) * step;
    for (; t <= hi + step * 0.001; t += step) out.push(t);
    return out;
  }

  function frame(x, P, xs, ys, fmtX, fmtY) {
    x.strokeStyle = CL.grid; x.lineWidth = 1;
    x.fillStyle = CL.text2; x.textAlign = 'right';
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
      x.strokeStyle = CL.grid;
      x.beginPath(); x.moveTo(Math.round(px) + 0.5, P.t); x.lineTo(Math.round(px) + 0.5, P.b); x.stroke();
      x.fillText(fmtX(t), px, P.b + 12);
    });
    x.strokeStyle = CL.axis;
    x.beginPath(); x.moveTo(P.l, P.b + 0.5); x.lineTo(P.r, P.b + 0.5); x.stroke();
  }

  function plot(w, h, pad) {
    var l = pad.l, r = w - pad.r, t = pad.t, b = h - pad.b;
    return {
      l: l, r: r, t: t, b: b,
      set: function (x0, x1, y0, y1) {
        this.x0 = x0; this.x1 = x1; this.y0 = y0; this.y1 = y1;
        return this;
      },
      px: function (v) { return l + (v - this.x0) / (this.x1 - this.x0) * (r - l); },
      py: function (v) { return b - (v - this.y0) / (this.y1 - this.y0) * (b - t); }
    };
  }

  function vline(x, P, v, col, label, dash, side, row) {
    var px = P.px(v);
    if (px < P.l || px > P.r) return;
    x.save();
    x.setLineDash(dash || []);
    x.strokeStyle = col; x.lineWidth = 1;
    x.beginPath(); x.moveTo(Math.round(px) + 0.5, P.t); x.lineTo(Math.round(px) + 0.5, P.b); x.stroke();
    x.restore();
    if (label) {
      x.save();
      x.font = '9.5px ui-monospace, Menlo, monospace';
      var tw = x.measureText(label).width + 8;
      var lx = side === 'l' ? px - tw - 2 : px + 3;
      if (lx + tw > P.r) lx = px - tw - 3;
      if (lx < P.l) lx = px + 3;
      var ly = P.t + 2 + (row || 0) * 16;          // stagger so labels never overlap
      x.fillStyle = col; x.globalAlpha = 0.16;
      x.fillRect(lx, ly, tw, 14);
      x.globalAlpha = 1; x.fillStyle = col; x.textAlign = 'left';
      x.fillText(label, lx + 4, ly + 7);
      x.restore();
    }
  }

  /* ------------------------------------------------------------------ payoff */
  /*
     opt = { pos, S, r, q, mult, dte, showT0, showProb, an }
     `an` is the FIN.M.analyse() result (passed in so the UI computes it once).
  */
  C.payoff = function (cv, o) {
    var s = setup(cv), x = s.x, M = FIN.M;
    var P = plot(s.w, s.h, { l: 56, r: 14, t: 14, b: 26 });
    var an = o.an || M.analyse(o.pos, o.S, o.r, o.q, o.mult);
    var xs = M.grid(o.S, an.iv, an.T, 361);
    var cost = M.cost(o.pos, o.S, o.r, o.q);

    var yE = xs.map(function (v) { return M.pl(o.pos, v, an.T, o.r, o.q, 0, cost) * (o.mult || 100); });
    var y0 = xs.map(function (v) { return M.pl(o.pos, v, 0, o.r, o.q, 0, cost) * (o.mult || 100); });

    var lo = Infinity, hi = -Infinity, i;
    for (i = 0; i < xs.length; i++) {
      lo = Math.min(lo, yE[i], o.showT0 === false ? yE[i] : y0[i]);
      hi = Math.max(hi, yE[i], o.showT0 === false ? yE[i] : y0[i]);
    }
    var padY = Math.max((hi - lo) * 0.12, 1);
    P.set(xs[0], xs[xs.length - 1], lo - padY, hi + padY);

    // risk-neutral density underlay — where the market actually thinks it lands
    if (o.showProb !== false && an.T > 0) {
      var sd = an.iv * Math.sqrt(an.T), mu = Math.log(o.S) + (o.r - o.q - an.iv * an.iv / 2) * an.T;
      var peak = 0, dens = xs.map(function (v) {
        var d = Math.exp(-0.5 * Math.pow((Math.log(v) - mu) / sd, 2)) / (v * sd);
        if (d > peak) peak = d; return d;
      });
      x.save(); x.beginPath();
      x.moveTo(P.px(xs[0]), P.b);
      for (i = 0; i < xs.length; i++) x.lineTo(P.px(xs[i]), P.b - dens[i] / peak * (P.b - P.t) * 0.3);
      x.lineTo(P.px(xs[xs.length - 1]), P.b); x.closePath();
      x.fillStyle = 'rgba(46,155,255,0.10)'; x.fill();
      x.restore();
    }

    frame(x, P, ticks(P.x0, P.x1, 6), ticks(P.y0, P.y1, 5),
      function (t) { return t.toFixed(0); },
      function (t) { return nice(t, 0); });

    // zero line
    if (P.y0 < 0 && P.y1 > 0) {
      x.strokeStyle = CL.axis; x.lineWidth = 1;
      x.beginPath(); x.moveTo(P.l, Math.round(P.py(0)) + 0.5); x.lineTo(P.r, Math.round(P.py(0)) + 0.5); x.stroke();
    }

    // shaded expiry P/L, split at zero
    function band(sign, col) {
      x.beginPath();
      var open = false;
      var zy = P.py(Math.max(P.y0, Math.min(P.y1, 0)));
      for (i = 0; i < xs.length; i++) {
        var inb = sign > 0 ? yE[i] > 0 : yE[i] < 0;
        if (inb && !open) { x.moveTo(P.px(xs[i]), zy); open = true; }
        if (inb) x.lineTo(P.px(xs[i]), P.py(yE[i]));
        if (!inb && open) { x.lineTo(P.px(xs[i - 1]), zy); x.closePath(); open = false; }
      }
      if (open) { x.lineTo(P.px(xs[xs.length - 1]), zy); x.closePath(); }
      x.fillStyle = col; x.fill();
    }
    band(1, 'rgba(0,185,107,0.16)');
    band(-1, 'rgba(250,77,86,0.14)');

    // strikes
    var seen = {};
    o.pos.legs.forEach(function (L) {
      if (L.t === 'S' || seen[L.K]) return; seen[L.K] = 1;
      vline(x, P, L.K, 'rgba(255,197,61,0.42)', null, [3, 3]);
    });

    // T+0 curve
    if (o.showT0 !== false) {
      x.save(); x.setLineDash([5, 3]); x.strokeStyle = CL.info; x.lineWidth = 1.4;
      x.beginPath();
      for (i = 0; i < xs.length; i++) (i ? x.lineTo : x.moveTo).call(x, P.px(xs[i]), P.py(y0[i]));
      x.stroke(); x.restore();
    }

    // expiry payoff
    x.strokeStyle = CL.text1; x.lineWidth = 1.9; x.beginPath();
    for (i = 0; i < xs.length; i++) (i ? x.lineTo : x.moveTo).call(x, P.px(xs[i]), P.py(yE[i]));
    x.stroke();

    // break-evens
    an.beps.forEach(function (b) {
      var bx = P.px(b), by = P.py(0);
      if (bx < P.l || bx > P.r) return;
      x.fillStyle = CL.gold;
      x.beginPath(); x.arc(bx, by, 3.4, 0, 6.2832); x.fill();
      x.save(); x.font = '9.5px ui-monospace, Menlo, monospace';
      x.textAlign = 'center'; x.fillStyle = CL.gold;
      x.fillText(b.toFixed(2), Math.max(P.l + 22, Math.min(P.r - 22, bx)), by - 10);
      x.restore();
    });

    // spot
    vline(x, P, o.S, CL.brand, (o.label || 'Spot') + ' ' + o.S.toFixed(2), [], 'r');
    return an;
  };

  /* --------------------------------------------------------------------- GEX */

  C.gex = function (cv, o) {
    var s = setup(cv), x = s.x, M = FIN.M;
    var P = plot(s.w, s.h, { l: 58, r: 58, t: 16, b: 26 });
    var rows = o.gex, ch = o.chain;
    var lo = 0, hi = 0, i;
    for (i = 0; i < rows.length; i++) {
      lo = Math.min(lo, rows[i].put, rows[i].net); hi = Math.max(hi, rows[i].call, rows[i].net);
    }
    var span = Math.max(hi, -lo) * 1.15 || 1;
    var k0 = rows[0].K, k1 = rows[rows.length - 1].K;
    P.set(k0 - ch.step, k1 + ch.step, -span, span);

    frame(x, P, ticks(k0, k1, 6), ticks(-span, span, 4),
      function (t) { return t.toFixed(0); }, function (t) { return nice(t, 0); });

    var bw = Math.max(3, (P.r - P.l) / rows.length * 0.62);
    rows.forEach(function (g) {
      var px = P.px(g.K), zy = P.py(0);
      if (o.mode !== 'net') {
        x.fillStyle = 'rgba(0,185,107,0.85)';
        x.fillRect(px - bw / 2, Math.min(zy, P.py(g.call)), bw, Math.abs(P.py(g.call) - zy));
        x.fillStyle = 'rgba(250,77,86,0.85)';
        x.fillRect(px - bw / 2, Math.min(zy, P.py(g.put)), bw, Math.abs(P.py(g.put) - zy));
      } else {
        x.fillStyle = g.net >= 0 ? 'rgba(0,185,107,0.85)' : 'rgba(250,77,86,0.85)';
        x.fillRect(px - bw / 2, Math.min(zy, P.py(g.net)), bw, Math.abs(P.py(g.net) - zy));
      }
    });

    // aggregate curve on its own right-hand scale
    if (o.agg && o.agg.length) {
      var alo = Infinity, ahi = -Infinity;
      o.agg.forEach(function (a) { alo = Math.min(alo, a.gex); ahi = Math.max(ahi, a.gex); });
      var asp = Math.max(Math.abs(alo), Math.abs(ahi)) * 1.1 || 1;
      var apy = function (v) { return P.b - (v + asp) / (2 * asp) * (P.b - P.t); };
      x.strokeStyle = CL.info; x.lineWidth = 1.6; x.beginPath();
      o.agg.forEach(function (a, i2) { (i2 ? x.lineTo : x.moveTo).call(x, P.px(a.S), apy(a.gex)); });
      x.stroke();
      x.save(); x.textAlign = 'left'; x.fillStyle = CL.text2;
      x.fillText(nice(asp, 0), P.r + 6, P.t + 6);
      x.fillText(nice(-asp, 0), P.r + 6, P.b - 6);
      x.fillText('0', P.r + 6, apy(0));
      x.restore();
    }

    if (o.flip != null) vline(x, P, o.flip, CL.warn, 'Gamma Flip ' + o.flip.toFixed(0), [5, 3], 'r', 1);
    if (ch.callWall) vline(x, P, ch.callWall, CL.up, 'Call Wall', [2, 3], 'r', 0);
    if (ch.putWall) vline(x, P, ch.putWall, CL.down, 'Put Wall', [2, 3], 'l', 0);
    vline(x, P, ch.S, CL.brand, 'Spot ' + ch.S.toFixed(0), [], 'r', 2);
  };

  /* ------------------------------------------------------- volume / OI bars */

  C.strikeBars = function (cv, o) {
    var s = setup(cv), x = s.x;
    var P = plot(s.w, s.h, { l: 56, r: 14, t: 14, b: 26 });
    var rows = o.chain.rows, f = o.field;      // 'vol' | 'oi'
    var hi = 0;
    rows.forEach(function (r2) { hi = Math.max(hi, r2.call[f], r2.put[f]); });
    hi = hi * 1.12 || 1;
    var k0 = rows[0].K, k1 = rows[rows.length - 1].K;
    P.set(k0 - o.chain.step, k1 + o.chain.step, -hi, hi);
    frame(x, P, ticks(k0, k1, 6), ticks(-hi, hi, 4),
      function (t) { return t.toFixed(0); }, function (t) { return nice(Math.abs(t), 0); });

    var bw = Math.max(3, (P.r - P.l) / rows.length * 0.6), zy = P.py(0);
    rows.forEach(function (r2) {
      var px = P.px(r2.K);
      x.fillStyle = 'rgba(0,185,107,0.85)';
      x.fillRect(px - bw / 2, P.py(r2.call[f]), bw, zy - P.py(r2.call[f]));
      x.fillStyle = 'rgba(250,77,86,0.85)';
      x.fillRect(px - bw / 2, zy, bw, P.py(-r2.put[f]) - zy);
    });
    if (o.maxPain) vline(x, P, o.maxPain, CL.gold, 'Max Pain ' + o.maxPain, [4, 3], 'l', 0);
    vline(x, P, o.chain.S, CL.brand, 'Spot ' + o.chain.S.toFixed(0), [], 'r', 1);
  };

  /* ------------------------------------------------------------ generic lines */
  /*
     opt = { series:[{name,color,pts:[[x,y]...],dash}], fmtX, fmtY, hlines:[{v,label,color}] }
  */
  C.curve = function (cv, o) {
    var s = setup(cv), x = s.x;
    var P = plot(s.w, s.h, { l: 54, r: 14, t: 14, b: 26 });
    var xlo = Infinity, xhi = -Infinity, ylo = Infinity, yhi = -Infinity;
    o.series.forEach(function (se) {
      se.pts.forEach(function (p) {
        xlo = Math.min(xlo, p[0]); xhi = Math.max(xhi, p[0]);
        ylo = Math.min(ylo, p[1]); yhi = Math.max(yhi, p[1]);
      });
    });
    (o.hlines || []).forEach(function (h) { ylo = Math.min(ylo, h.v); yhi = Math.max(yhi, h.v); });
    var pad = (yhi - ylo) * 0.12 || 1;
    P.set(xlo, xhi, ylo - pad, yhi + pad);
    frame(x, P, ticks(xlo, xhi, 5), ticks(P.y0, P.y1, 5),
      o.fmtX || function (t) { return t.toFixed(0); },
      o.fmtY || function (t) { return t.toFixed(0); });

    (o.hlines || []).forEach(function (h) {
      x.save(); x.setLineDash([4, 3]); x.strokeStyle = h.color || CL.axis;
      x.beginPath(); x.moveTo(P.l, P.py(h.v)); x.lineTo(P.r, P.py(h.v)); x.stroke(); x.restore();
    });

    o.series.forEach(function (se) {
      x.save();
      if (se.dash) x.setLineDash(se.dash);
      x.strokeStyle = se.color; x.lineWidth = se.width || 1.6;
      x.beginPath();
      se.pts.forEach(function (p, i) { (i ? x.lineTo : x.moveTo).call(x, P.px(p[0]), P.py(p[1])); });
      x.stroke();
      if (se.fill) {
        x.lineTo(P.px(se.pts[se.pts.length - 1][0]), P.py(P.y0));
        x.lineTo(P.px(se.pts[0][0]), P.py(P.y0));
        x.closePath(); x.fillStyle = se.fill; x.fill();
      }
      x.restore();
    });
    if (o.vline != null) vline(x, P, o.vline, CL.brand, o.vlabel || null, [], 'r');
  };

  /* ----------------------------------------------------------- probability cone */

  C.cone = function (cv, o) {
    var s = setup(cv), x = s.x, M = FIN.M;
    var P = plot(s.w, s.h, { l: 56, r: 46, t: 14, b: 26 });
    var days = o.days, one = M.cone(o.S, o.iv, o.r, o.q, days, 1), two = M.cone(o.S, o.iv, o.r, o.q, days, 2);
    var lo = Infinity, hi = -Infinity;
    two.forEach(function (c) { lo = Math.min(lo, c.dn); hi = Math.max(hi, c.up); });
    P.set(0, days[days.length - 1], lo * 0.97, hi * 1.03);
    frame(x, P, ticks(0, days[days.length - 1], 5), ticks(P.y0, P.y1, 5),
      function (t) { return t.toFixed(0) + 'd'; }, function (t) { return t.toFixed(0); });

    function ribbon(cs, fill) {
      x.beginPath();
      cs.forEach(function (c, i) { (i ? x.lineTo : x.moveTo).call(x, P.px(c.d), P.py(c.up)); });
      for (var i = cs.length - 1; i >= 0; i--) x.lineTo(P.px(cs[i].d), P.py(cs[i].dn));
      x.closePath(); x.fillStyle = fill; x.fill();
    }
    ribbon(two, 'rgba(46,155,255,0.09)');
    ribbon(one, 'rgba(46,155,255,0.17)');

    [[one, CL.info, 1.5], [two, 'rgba(46,155,255,0.55)', 1]].forEach(function (t) {
      ['up', 'dn'].forEach(function (k) {
        x.strokeStyle = t[1]; x.lineWidth = t[2]; x.beginPath();
        t[0].forEach(function (c, i) { (i ? x.lineTo : x.moveTo).call(x, P.px(c.d), P.py(c[k])); });
        x.stroke();
      });
    });

    x.save(); x.setLineDash([4, 3]); x.strokeStyle = CL.brand; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(P.l, P.py(o.S)); x.lineTo(P.r, P.py(o.S)); x.stroke(); x.restore();

    x.save(); x.textAlign = 'left'; x.font = '9.5px ui-monospace, Menlo, monospace';
    var last1 = one[one.length - 1], last2 = two[two.length - 1];
    [[last2.up, 'rgba(46,155,255,0.7)'], [last1.up, CL.info], [o.S, CL.brand],
     [last1.dn, CL.info], [last2.dn, 'rgba(46,155,255,0.7)']].forEach(function (t) {
      x.fillStyle = t[1];
      x.fillText(t[0].toFixed(0), P.r + 5, P.py(t[0]));
    });
    x.restore();
  };

  /* --------------------------------------------------------------- mini sparks */

  C.spark = function (cv, vals, col, hl) {
    var s = setup(cv), x = s.x;
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = (hi - lo) * 0.1 || 1;
    var py = function (v) { return s.h - 3 - (v - (lo - pad)) / ((hi + pad) - (lo - pad)) * (s.h - 6); };
    var px = function (i) { return 2 + i / (vals.length - 1) * (s.w - 4); };
    if (hl != null) {
      x.strokeStyle = 'rgba(255,197,61,0.55)'; x.lineWidth = 1;
      x.save(); x.setLineDash([3, 3]);
      x.beginPath(); x.moveTo(0, py(hl)); x.lineTo(s.w, py(hl)); x.stroke(); x.restore();
    }
    x.strokeStyle = col || CL.info; x.lineWidth = 1.3; x.beginPath();
    vals.forEach(function (v, i) { (i ? x.lineTo : x.moveTo).call(x, px(i), py(v)); });
    x.stroke();
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
