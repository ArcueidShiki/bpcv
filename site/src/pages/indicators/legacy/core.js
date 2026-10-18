/* =========================================================================
   core.js — deterministic dummy market data + indicator math helpers
   Runs unmodified in both Node (validation) and the browser (delivery).
   ========================================================================= */
(function (root) {
  'use strict';

  /* ---------------- seeded PRNG (mulberry32) ---------------------------
     A seeded generator means every reload — and every validation run in
     Node — draws the exact same candles. Indicator output is therefore
     reproducible and diffable, which is what makes automated checking of
     146 separate calc() functions possible at all.                       */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Box-Muller on top of the seeded uniform stream.
  function gaussian(rnd) {
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---------------- synthetic OHLCV -----------------------------------
     Shaped deliberately: a rally, a distribution top, a decline, a base,
     and a fresh advance. Real regime changes are what make trend,
     oscillator and volatility indicators all show something interesting
     on one shared dataset.                                               */
  function genOHLCV(n, seed) {
    n = n || 400;
    const rnd = mulberry32(seed == null ? 20260725 : seed);
    const t = [], o = [], h = [], l = [], c = [], v = [];
    let price = 100;
    // Regime drift schedule expressed as fractions of the series length.
    const regimes = [
      { to: 0.18, drift: 0.0016, vol: 0.011 },  // quiet accumulation
      { to: 0.38, drift: 0.0052, vol: 0.014 },  // strong advance
      { to: 0.50, drift: 0.0002, vol: 0.019 },  // choppy distribution top
      { to: 0.68, drift: -0.0048, vol: 0.021 }, // decline
      { to: 0.82, drift: 0.0000, vol: 0.010 },  // basing
      { to: 1.01, drift: 0.0044, vol: 0.015 }   // new advance
    ];
    const startMs = Date.UTC(2024, 0, 2);
    let day = 0;
    for (let i = 0; i < n; i++) {
      const frac = i / n;
      let reg = regimes[regimes.length - 1];
      for (let r = 0; r < regimes.length; r++) {
        if (frac < regimes[r].to) { reg = regimes[r]; break; }
      }
      // Skip weekends so the x-axis reads like a real trading calendar.
      let d = new Date(startMs + day * 86400000);
      while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
        day++; d = new Date(startMs + day * 86400000);
      }
      t.push(d.getTime());
      day++;

      const open = price;
      const shock = gaussian(rnd) * reg.vol;
      // Mild mean reversion keeps the series from wandering off-scale.
      const close = open * (1 + reg.drift + shock);
      const range = Math.abs(close - open) + open * reg.vol * (0.35 + rnd() * 0.9);
      const high = Math.max(open, close) + range * rnd() * 0.55;
      const low = Math.min(open, close) - range * rnd() * 0.55;

      o.push(round2(open));
      h.push(round2(high));
      l.push(round2(Math.max(low, 1)));
      c.push(round2(close));

      // Volume rises with range and on down days — the usual empirical shape.
      const base = 1.0e6 * (0.75 + rnd() * 0.5);
      const rangeBoost = 1 + (Math.abs(close - open) / open) * 22;
      const downBoost = close < open ? 1.22 : 1.0;
      v.push(Math.round(base * rangeBoost * downBoost));

      price = close;
    }
    return { t: t, o: o, h: h, l: l, c: c, v: v, n: n };
  }

  function round2(x) { return Math.round(x * 100) / 100; }

  /* =====================================================================
     Helper library `H` — the vocabulary every indicator calc() speaks.
     Every function returns a NEW array of the same length as its input,
     using null for the warm-up region rather than 0 or NaN. Null is what
     the renderer treats as "no data here"; 0 would draw a misleading
     line down to the axis.
     ===================================================================== */
  const H = {};

  H.NA = null;
  H.len = function (a) { return a ? a.length : 0; };
  H.fill = function (n, val) { const r = new Array(n); for (let i = 0; i < n; i++) r[i] = val; return r; };
  H.num = function (x) { return typeof x === 'number' && isFinite(x); };

  /** Element-wise binary op that propagates null. */
  function zip(a, b, fn) {
    const n = Math.max(H.len(a), H.len(b));
    const r = new Array(n);
    const aIsNum = typeof a === 'number';
    const bIsNum = typeof b === 'number';
    for (let i = 0; i < n; i++) {
      const x = aIsNum ? a : a[i];
      const y = bIsNum ? b : b[i];
      r[i] = (H.num(x) && H.num(y)) ? fn(x, y) : null;
    }
    return r;
  }
  H.zip = zip;
  H.add = function (a, b) { return zip(a, b, function (x, y) { return x + y; }); };
  H.sub = function (a, b) { return zip(a, b, function (x, y) { return x - y; }); };
  H.mul = function (a, b) { return zip(a, b, function (x, y) { return x * y; }); };
  H.div = function (a, b) { return zip(a, b, function (x, y) { return y === 0 ? null : x / y; }); };
  H.maxOf = function (a, b) { return zip(a, b, function (x, y) { return Math.max(x, y); }); };
  H.minOf = function (a, b) { return zip(a, b, function (x, y) { return Math.min(x, y); }); };
  H.map = function (a, fn) { return a.map(function (x, i) { return H.num(x) ? fn(x, i) : null; }); };
  H.abs = function (a) { return H.map(a, Math.abs); };
  H.neg = function (a) { return H.map(a, function (x) { return -x; }); };
  H.scale = function (a, k) { return H.map(a, function (x) { return x * k; }); };
  H.offset = function (a, k) { return H.map(a, function (x) { return x + k; }); };
  H.const_ = function (n, k) { return H.fill(n, k); };

  /** ref(a, k): value k bars ago (k>0 = backward). */
  H.ref = function (a, k) {
    k = k || 1;
    const n = H.len(a), r = new Array(n);
    for (let i = 0; i < n; i++) { const j = i - k; r[i] = (j >= 0 && j < n) ? a[j] : null; }
    return r;
  };
  /** Shift forward (into the future) — used by Ichimoku cloud displacement. */
  H.shiftFwd = function (a, k) { return H.ref(a, -k); };

  H.change = function (a, k) { return H.sub(a, H.ref(a, k || 1)); };

  /** Simple moving average. */
  H.sma = function (a, n) {
    n = Math.max(1, Math.round(n));
    const len = H.len(a), r = new Array(len);
    let sum = 0, cnt = 0;
    for (let i = 0; i < len; i++) {
      const x = a[i];
      if (H.num(x)) { sum += x; cnt++; }
      if (i >= n) { const out = a[i - n]; if (H.num(out)) { sum -= out; cnt--; } }
      r[i] = (i >= n - 1 && cnt === n) ? sum / n : null;
    }
    return r;
  };

  /** Exponential MA, alpha = 2/(n+1), seeded with the first SMA. */
  H.ema = function (a, n) {
    n = Math.max(1, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    const k = 2 / (n + 1);
    let prev = null, sum = 0, cnt = 0;
    for (let i = 0; i < len; i++) {
      const x = a[i];
      if (!H.num(x)) { r[i] = prev; continue; }
      if (prev === null) {
        sum += x; cnt++;
        if (cnt === n) { prev = sum / n; r[i] = prev; }
      } else {
        prev = x * k + prev * (1 - k);
        r[i] = prev;
      }
    }
    return r;
  };

  /** Wilder / running MA (a.k.a. SMMA, RMA). alpha = m/n, default m=1. */
  H.smma = function (a, n, m) {
    n = Math.max(1, Math.round(n));
    m = m == null ? 1 : m;
    const len = H.len(a), r = new Array(len).fill(null);
    const k = m / n;
    let prev = null, sum = 0, cnt = 0;
    for (let i = 0; i < len; i++) {
      const x = a[i];
      if (!H.num(x)) { r[i] = prev; continue; }
      if (prev === null) {
        sum += x; cnt++;
        if (cnt === n) { prev = sum / n; r[i] = prev; }
      } else {
        prev = x * k + prev * (1 - k);
        r[i] = prev;
      }
    }
    return r;
  };
  H.rma = H.smma;

  /** Linearly weighted MA. */
  H.wma = function (a, n) {
    n = Math.max(1, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    const denom = (n * (n + 1)) / 2;
    for (let i = n - 1; i < len; i++) {
      let s = 0, ok = true;
      for (let j = 0; j < n; j++) {
        const x = a[i - j];
        if (!H.num(x)) { ok = false; break; }
        s += x * (n - j);
      }
      r[i] = ok ? s / denom : null;
    }
    return r;
  };

  /** Hull MA. */
  H.hma = function (a, n) {
    n = Math.max(2, Math.round(n));
    const raw = H.sub(H.scale(H.wma(a, Math.round(n / 2)), 2), H.wma(a, n));
    return H.wma(raw, Math.max(1, Math.round(Math.sqrt(n))));
  };

  H.dema = function (a, n) {
    const e1 = H.ema(a, n), e2 = H.ema(e1, n);
    return H.sub(H.scale(e1, 2), e2);
  };
  H.tema = function (a, n) {
    const e1 = H.ema(a, n), e2 = H.ema(e1, n), e3 = H.ema(e2, n);
    return H.add(H.sub(H.scale(e1, 3), H.scale(e2, 3)), e3);
  };

  /** Population standard deviation over n bars (matches most charting apps). */
  H.stdp = function (a, n) {
    n = Math.max(1, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    for (let i = n - 1; i < len; i++) {
      let s = 0, ok = true;
      for (let j = 0; j < n; j++) { const x = a[i - j]; if (!H.num(x)) { ok = false; break; } s += x; }
      if (!ok) continue;
      const m = s / n;
      let q = 0;
      for (let j = 0; j < n; j++) { const d = a[i - j] - m; q += d * d; }
      r[i] = Math.sqrt(q / n);
    }
    return r;
  };
  /** Sample standard deviation (n-1) — used by volatility annualisation. */
  H.std = function (a, n) {
    n = Math.max(2, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    for (let i = n - 1; i < len; i++) {
      let s = 0, ok = true;
      for (let j = 0; j < n; j++) { const x = a[i - j]; if (!H.num(x)) { ok = false; break; } s += x; }
      if (!ok) continue;
      const m = s / n;
      let q = 0;
      for (let j = 0; j < n; j++) { const d = a[i - j] - m; q += d * d; }
      r[i] = Math.sqrt(q / (n - 1));
    }
    return r;
  };

  H.highest = function (a, n) {
    n = Math.max(1, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    for (let i = n - 1; i < len; i++) {
      let m = -Infinity, ok = true;
      for (let j = 0; j < n; j++) { const x = a[i - j]; if (!H.num(x)) { ok = false; break; } if (x > m) m = x; }
      r[i] = ok ? m : null;
    }
    return r;
  };
  H.lowest = function (a, n) {
    n = Math.max(1, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    for (let i = n - 1; i < len; i++) {
      let m = Infinity, ok = true;
      for (let j = 0; j < n; j++) { const x = a[i - j]; if (!H.num(x)) { ok = false; break; } if (x < m) m = x; }
      r[i] = ok ? m : null;
    }
    return r;
  };
  /** Bars since the highest/lowest value within the lookback (0 = this bar). */
  H.highestBars = function (a, n) {
    n = Math.max(1, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    for (let i = n - 1; i < len; i++) {
      let m = -Infinity, idx = 0, ok = true;
      for (let j = 0; j < n; j++) { const x = a[i - j]; if (!H.num(x)) { ok = false; break; } if (x > m) { m = x; idx = j; } }
      r[i] = ok ? idx : null;
    }
    return r;
  };
  H.lowestBars = function (a, n) {
    n = Math.max(1, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    for (let i = n - 1; i < len; i++) {
      let m = Infinity, idx = 0, ok = true;
      for (let j = 0; j < n; j++) { const x = a[i - j]; if (!H.num(x)) { ok = false; break; } if (x < m) { m = x; idx = j; } }
      r[i] = ok ? idx : null;
    }
    return r;
  };

  H.sum = function (a, n) {
    n = Math.max(1, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    let s = 0, cnt = 0;
    for (let i = 0; i < len; i++) {
      const x = a[i];
      if (H.num(x)) { s += x; cnt++; }
      if (i >= n) { const out = a[i - n]; if (H.num(out)) { s -= out; cnt--; } }
      r[i] = (i >= n - 1 && cnt === n) ? s : null;
    }
    return r;
  };
  /** Running cumulative sum, nulls treated as 0 contribution. */
  H.cum = function (a) {
    const len = H.len(a), r = new Array(len);
    let s = 0;
    for (let i = 0; i < len; i++) { if (H.num(a[i])) s += a[i]; r[i] = s; }
    return r;
  };

  /** True range. */
  H.tr = function (d) {
    const n = d.c.length, r = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      if (i === 0) { r[i] = d.h[i] - d.l[i]; continue; }
      const pc = d.c[i - 1];
      r[i] = Math.max(d.h[i] - d.l[i], Math.abs(d.h[i] - pc), Math.abs(d.l[i] - pc));
    }
    return r;
  };
  H.atr = function (d, n) { return H.smma(H.tr(d), n, 1); };

  H.hl2 = function (d) { return d.h.map(function (x, i) { return (x + d.l[i]) / 2; }); };
  H.hlc3 = function (d) { return d.h.map(function (x, i) { return (x + d.l[i] + d.c[i]) / 3; }); };
  H.ohlc4 = function (d) { return d.h.map(function (x, i) { return (d.o[i] + x + d.l[i] + d.c[i]) / 4; }); };

  /** Linear-regression value at the current bar over n periods. */
  H.linreg = function (a, n, offset) {
    n = Math.max(2, Math.round(n));
    offset = offset || 0;
    const len = H.len(a), r = new Array(len).fill(null);
    const sumX = (n - 1) * n / 2;
    const sumX2 = (n - 1) * n * (2 * n - 1) / 6;
    const denom = n * sumX2 - sumX * sumX;
    for (let i = n - 1; i < len; i++) {
      let sumY = 0, sumXY = 0, ok = true;
      for (let j = 0; j < n; j++) {
        const x = a[i - n + 1 + j];
        if (!H.num(x)) { ok = false; break; }
        sumY += x; sumXY += j * x;
      }
      if (!ok) continue;
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;
      r[i] = intercept + slope * (n - 1 + offset);
    }
    return r;
  };
  /** Slope of the n-period linear regression. */
  H.linregSlope = function (a, n) {
    n = Math.max(2, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    const sumX = (n - 1) * n / 2;
    const sumX2 = (n - 1) * n * (2 * n - 1) / 6;
    const denom = n * sumX2 - sumX * sumX;
    for (let i = n - 1; i < len; i++) {
      let sumY = 0, sumXY = 0, ok = true;
      for (let j = 0; j < n; j++) {
        const x = a[i - n + 1 + j];
        if (!H.num(x)) { ok = false; break; }
        sumY += x; sumXY += j * x;
      }
      if (!ok) continue;
      r[i] = (n * sumXY - sumX * sumY) / denom;
    }
    return r;
  };

  /** Pearson correlation of a vs b over n bars. */
  H.correl = function (a, b, n) {
    n = Math.max(2, Math.round(n));
    const len = Math.min(H.len(a), H.len(b)), r = new Array(len).fill(null);
    for (let i = n - 1; i < len; i++) {
      let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, ok = true;
      for (let j = 0; j < n; j++) {
        const x = a[i - j], y = b[i - j];
        if (!H.num(x) || !H.num(y)) { ok = false; break; }
        sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
      }
      if (!ok) continue;
      const num = n * sxy - sx * sy;
      const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
      r[i] = den === 0 ? null : num / den;
    }
    return r;
  };

  /** iff(cond, a, b) — element-wise ternary; cond is an array of truthy values. */
  H.iff = function (cond, a, b) {
    const n = H.len(cond), r = new Array(n);
    const aNum = typeof a === 'number', bNum = typeof b === 'number';
    const aStr = typeof a === 'string', bStr = typeof b === 'string';
    for (let i = 0; i < n; i++) {
      const pick = cond[i] ? a : b;
      if (cond[i]) r[i] = aNum || aStr ? a : (a ? a[i] : null);
      else r[i] = bNum || bStr ? b : (b ? b[i] : null);
      void pick;
    }
    return r;
  };
  H.gt = function (a, b) { return zip(a, b, function (x, y) { return x > y ? 1 : 0; }); };
  H.lt = function (a, b) { return zip(a, b, function (x, y) { return x < y ? 1 : 0; }); };

  /** crossUp(a,b): 1 on the bar a crosses above b. */
  H.crossUp = function (a, b) {
    const pa = H.ref(a, 1), pb = H.ref(b, 1);
    const n = H.len(a), r = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const av = typeof a === 'number' ? a : a[i], bv = typeof b === 'number' ? b : b[i];
      const pav = pa[i], pbv = pb[i];
      if (H.num(av) && H.num(bv) && H.num(pav) && H.num(pbv)) r[i] = (pav <= pbv && av > bv) ? 1 : 0;
    }
    return r;
  };
  H.crossDn = function (a, b) { return H.crossUp(b, a); };

  /** Count of bars in the last n where cond was true. */
  H.countTrue = function (cond, n) {
    return H.sum(cond.map(function (x) { return x ? 1 : 0; }), n);
  };

  /** Percentile rank of the last value within the trailing n-bar window. */
  H.percentRank = function (a, n) {
    n = Math.max(2, Math.round(n));
    const len = H.len(a), r = new Array(len).fill(null);
    for (let i = n - 1; i < len; i++) {
      const cur = a[i];
      if (!H.num(cur)) continue;
      let below = 0, cnt = 0;
      for (let j = 1; j < n; j++) {
        const x = a[i - j];
        if (!H.num(x)) continue;
        cnt++; if (x <= cur) below++;
      }
      r[i] = cnt ? (below / cnt) * 100 : null;
    }
    return r;
  };

  /** Rescale a series into [lo, hi] over its finite range — used for
      illustrative synthetic series so they sit in a readable band. */
  H.rescale = function (a, lo, hi) {
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < a.length; i++) { const x = a[i]; if (H.num(x)) { if (x < mn) mn = x; if (x > mx) mx = x; } }
    if (!isFinite(mn) || mx === mn) return a.map(function (x) { return H.num(x) ? (lo + hi) / 2 : null; });
    return a.map(function (x) { return H.num(x) ? lo + ((x - mn) / (mx - mn)) * (hi - lo) : null; });
  };

  /** Deterministic pseudo-random walk keyed to an id string. Used only for
      indicators that genuinely need data we do not have (market breadth,
      options open interest, order-flow tape). Always rendered with a
      "simulated" badge so nothing is presented as a real computation. */
  H.synth = function (n, key, opts) {
    opts = opts || {};
    let seed = 2166136261;
    for (let i = 0; i < key.length; i++) { seed ^= key.charCodeAt(i); seed = Math.imul(seed, 16777619); }
    const rnd = mulberry32(seed >>> 0);
    const persistence = opts.persistence == null ? 0.86 : opts.persistence;
    const out = new Array(n);
    let x = 0;
    for (let i = 0; i < n; i++) {
      x = x * persistence + gaussian(rnd) * (1 - persistence) * 3;
      out[i] = x;
    }
    return H.rescale(out, opts.lo == null ? -1 : opts.lo, opts.hi == null ? 1 : opts.hi);
  };

  /** Fundamental step series aligned to the price calendar.

      Financial-statement figures (revenue, ROE, margins…) are not derivable
      from OHLCV and only change on reporting dates, so they render as a flat
      line that steps at each fiscal-period boundary. This mirrors how a real
      terminal overlays quarterly/annual fundamentals under a daily price
      chart. Deterministic per `key`, and always shown with a "simulated"
      badge — it is illustrative shape, not a real filing.

      opts:
        period    'FQ' (quarterly, 4 steps/yr) | 'FY' (annual, 1 step/yr)
        base      value at the first reported period
        growth    compound annual growth applied across reports
        vol       per-report multiplicative noise (FQ noisier than FY)
        seasonal  FQ-only sinusoidal amplitude (retail Q4 bumps, etc.)
        floor/cap optional clamp — for ratios/margins that cannot go silly
        decimals  rounding for display                                       */
  H.fundamental = function (d, key, opts) {
    opts = opts || {};
    const period = opts.period === 'FY' ? 'FY' : 'FQ';
    const base = opts.base == null ? 100 : opts.base;
    const growth = opts.growth == null ? 0.10 : opts.growth;
    const vol = opts.vol == null ? (period === 'FQ' ? 0.07 : 0.04) : opts.vol;
    const seasonal = opts.seasonal == null ? 0 : opts.seasonal;
    let seed = 2166136261;
    for (let i = 0; i < key.length; i++) { seed ^= key.charCodeAt(i); seed = Math.imul(seed, 16777619); }
    const rnd = mulberry32(seed >>> 0);
    const perYear = period === 'FY' ? 1 : 4;
    const n = d.n, out = new Array(n).fill(null);
    let curKey = null, curVal = null, reportIdx = 0;
    for (let i = 0; i < n; i++) {
      const dt = new Date(d.t[i]);
      const y = dt.getUTCFullYear();
      const q = Math.floor(dt.getUTCMonth() / 3);
      const pk = period === 'FY' ? y : (y * 4 + q);
      if (pk !== curKey) {
        curKey = pk;
        const yearsElapsed = reportIdx / perYear;
        let val = base * Math.pow(1 + growth, yearsElapsed);
        val *= (1 + gaussian(rnd) * vol);
        if (period === 'FQ' && seasonal) val *= (1 + seasonal * Math.sin((q / 4) * 2 * Math.PI));
        if (opts.floor != null) val = Math.max(opts.floor, val);
        if (opts.cap != null) val = Math.min(opts.cap, val);
        const dp = opts.decimals == null ? 2 : opts.decimals;
        const m = Math.pow(10, dp);
        curVal = Math.round(val * m) / m;
        reportIdx++;
      }
      out[i] = curVal;
    }
    return out;
  };

  /** Heikin-Ashi transform, returned as a data-like object. */
  H.heikin = function (d) {
    const n = d.c.length;
    const ho = new Array(n), hh = new Array(n), hl = new Array(n), hc = new Array(n);
    for (let i = 0; i < n; i++) {
      hc[i] = (d.o[i] + d.h[i] + d.l[i] + d.c[i]) / 4;
      ho[i] = i === 0 ? (d.o[i] + d.c[i]) / 2 : (ho[i - 1] + hc[i - 1]) / 2;
      hh[i] = Math.max(d.h[i], ho[i], hc[i]);
      hl[i] = Math.min(d.l[i], ho[i], hc[i]);
    }
    return { o: ho, h: hh, l: hl, c: hc, v: d.v, t: d.t };
  };

  root.FIN = root.FIN || {};
  root.FIN.mulberry32 = mulberry32;
  root.FIN.genOHLCV = genOHLCV;
  root.FIN.H = H;

})(typeof globalThis !== 'undefined' ? globalThis : this);
