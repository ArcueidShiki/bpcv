/* =============================================================================
   plot.js — a very small 2D plotting layer.

   One Frame maps a maths domain onto a canvas with device-pixel-ratio aware
   sizing, then exposes X()/Y() so every renderer below can think in maths
   coordinates and never in pixels.
   ============================================================================= */
(function (root) {
  'use strict';
  var MF = root.MF = root.MF || {};
  var P = MF.P = {};

  var CSS = getComputedStyle(document.documentElement);
  P.col = function (name) { return CSS.getPropertyValue(name).trim() || '#888'; };

  /* Resize the backing store to match CSS pixels × DPR. Returns a context
     already scaled so that 1 unit = 1 CSS pixel. */
  function fit(cv) {
    var r = cv.getBoundingClientRect();
    var dpr = root.devicePixelRatio || 1;
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== w * dpr || cv.height !== h * dpr) {
      cv.width = w * dpr; cv.height = h * dpr;
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }
  P.fit = fit;

  /* A Frame is a linear map from [x0,x1]×[y0,y1] onto the canvas minus padding. */
  P.frame = function (cv, x0, x1, y0, y1, pad) {
    var f = fit(cv);
    pad = pad || {};
    var l = pad.l == null ? 38 : pad.l, r = pad.r == null ? 12 : pad.r,
        t = pad.t == null ? 12 : pad.t, b = pad.b == null ? 26 : pad.b;
    var iw = Math.max(1, f.w - l - r), ih = Math.max(1, f.h - t - b);
    var sx = iw / (x1 - x0 || 1), sy = ih / (y1 - y0 || 1);
    return {
      ctx: f.ctx, w: f.w, h: f.h, l: l, r: r, t: t, b: b, iw: iw, ih: ih,
      x0: x0, x1: x1, y0: y0, y1: y1,
      X: function (x) { return l + (x - x0) * sx; },
      Y: function (y) { return t + ih - (y - y0) * sy; }
    };
  };

  /* Grid + axes + tick labels. `fmtX`/`fmtY` are optional formatters. */
  P.grid = function (F, opt) {
    opt = opt || {};
    var ctx = F.ctx, i, v, px, py;
    var nx = opt.nx || 8, ny = opt.ny || 5;
    ctx.save();
    ctx.strokeStyle = P.col('--line');
    ctx.fillStyle = P.col('--text-3');
    ctx.lineWidth = 1;
    ctx.font = '10px ' + P.col('--mono');
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (i = 0; i <= nx; i++) {
      v = F.x0 + (F.x1 - F.x0) * i / nx; px = Math.round(F.X(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(px, F.t); ctx.lineTo(px, F.t + F.ih); ctx.stroke();
      if (opt.fmtX !== false) ctx.fillText((opt.fmtX || function (a) { return a.toFixed(1); })(v), px, F.t + F.ih + 6);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (i = 0; i <= ny; i++) {
      v = F.y0 + (F.y1 - F.y0) * i / ny; py = Math.round(F.Y(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(F.l, py); ctx.lineTo(F.l + F.iw, py); ctx.stroke();
      if (opt.fmtY !== false) ctx.fillText((opt.fmtY || function (a) { return a.toFixed(1); })(v), F.l - 6, py);
    }
    /* zero axes drawn heavier when they fall inside the view */
    ctx.strokeStyle = P.col('--line-2'); ctx.lineWidth = 1.4;
    if (F.y0 < 0 && F.y1 > 0) { py = Math.round(F.Y(0)) + 0.5; ctx.beginPath(); ctx.moveTo(F.l, py); ctx.lineTo(F.l + F.iw, py); ctx.stroke(); }
    if (F.x0 < 0 && F.x1 > 0) { px = Math.round(F.X(0)) + 0.5; ctx.beginPath(); ctx.moveTo(px, F.t); ctx.lineTo(px, F.t + F.ih); ctx.stroke(); }
    ctx.restore();
  };

  /* Plot y = fn(x) by sampling. Values that are non-finite or far outside the
     view break the path rather than drawing a spurious vertical line. */
  P.fn = function (F, fn, col, opt) {
    opt = opt || {};
    var ctx = F.ctx, n = opt.n || 480, i, x, y, up = false;
    var lim = (F.y1 - F.y0) * 6;
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = opt.w || 2;
    if (opt.dash) ctx.setLineDash(opt.dash);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (i = 0; i <= n; i++) {
      x = F.x0 + (F.x1 - F.x0) * i / n;
      y = fn(x);
      if (!isFinite(y) || y > F.y1 + lim || y < F.y0 - lim) { up = false; continue; }
      if (!up) { ctx.moveTo(F.X(x), F.Y(y)); up = true; } else { ctx.lineTo(F.X(x), F.Y(y)); }
    }
    ctx.stroke();
    ctx.restore();
  };

  /* Polyline through explicit points [[x,y],…]. */
  P.line = function (F, pts, col, opt) {
    opt = opt || {};
    var ctx = F.ctx, i;
    if (!pts.length) return;
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = opt.w || 2;
    if (opt.dash) ctx.setLineDash(opt.dash);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(F.X(pts[0][0]), F.Y(pts[0][1]));
    for (i = 1; i < pts.length; i++) ctx.lineTo(F.X(pts[i][0]), F.Y(pts[i][1]));
    if (opt.close) ctx.closePath();
    if (opt.fill) { ctx.fillStyle = opt.fill; ctx.fill(); }
    if (opt.w !== 0) ctx.stroke();
    ctx.restore();
  };

  P.dot = function (F, x, y, col, r) {
    var ctx = F.ctx;
    ctx.save(); ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(F.X(x), F.Y(y), r || 4, 0, 6.2832); ctx.fill();
    ctx.restore();
  };

  P.vline = function (F, x, col, opt) {
    opt = opt || {};
    var ctx = F.ctx, px = Math.round(F.X(x)) + 0.5;
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = opt.w || 1.2;
    ctx.setLineDash(opt.dash || [4, 4]);
    ctx.beginPath(); ctx.moveTo(px, F.t); ctx.lineTo(px, F.t + F.ih); ctx.stroke();
    if (opt.label) {
      ctx.setLineDash([]); ctx.fillStyle = col;
      ctx.font = '10px ' + P.col('--mono');
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(opt.label, px, F.t + 2);
    }
    ctx.restore();
  };

  P.label = function (F, x, y, text, col, opt) {
    opt = opt || {};
    var ctx = F.ctx;
    ctx.save();
    ctx.fillStyle = col;
    ctx.font = (opt.size || 10) + 'px ' + P.col('--mono');
    ctx.textAlign = opt.align || 'left'; ctx.textBaseline = opt.base || 'bottom';
    ctx.fillText(text, F.X(x) + (opt.dx || 0), F.Y(y) + (opt.dy || 0));
    ctx.restore();
  };

  P.bars = function (F, xs, ys, col, opt) {
    opt = opt || {};
    var ctx = F.ctx, i, bw = Math.max(1, (F.iw / xs.length) * (opt.frac || 0.6));
    ctx.save(); ctx.fillStyle = col;
    for (i = 0; i < xs.length; i++) {
      var x = F.X(xs[i]), y0 = F.Y(0), y1 = F.Y(ys[i]);
      ctx.fillRect(x - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0));
    }
    ctx.restore();
  };

  /* ---- shared maths helpers ---- */
  P.ncdf = function (x) {
    var b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937,
        b4 = -1.821255978, b5 = 1.330274429, p = 0.2316419, c = 0.39894228, t;
    if (x >= 0) { t = 1 / (1 + p * x); return 1 - c * Math.exp(-x * x / 2) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1); }
    t = 1 / (1 - p * x); return c * Math.exp(-x * x / 2) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  };
  P.npdf = function (x) { return 0.3989422804014327 * Math.exp(-x * x / 2); };

  /* Mulberry32 — small, seedable, good enough for teaching pictures. */
  P.rng = function (seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  /* Box-Muller on top of the above. */
  P.gauss = function (rnd) {
    var u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307179586 * v);
  };

  P.fmt = function (x, d) {
    if (!isFinite(x)) return '—';
    return x.toFixed(d == null ? 2 : d);
  };
}(globalThis));
