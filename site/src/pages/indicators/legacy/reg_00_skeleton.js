/* ---- reg_00_skeleton.js ---- */
/* =========================================================================
   reg_00_skeleton.js — reference implementations proving the registry
   contract. Every other batch follows exactly this shape.

   CONTRACT
   --------
   FIN.REG['<ID>'] = {
     pane:   'main' | 'sub',       // main = overlaid on price, sub = own pane
     params: [{k:'n', d:20, min:1, max:250}],   // user-tunable, d = default
     series: [{k:'MA20', type:'line'|'hist'|'dots'|'band', color:'#rrggbb',
               colorBy:'sign'?, width:1?, dash:[4,3]?, fillTo:'<otherKey>'? }],
     hlines: [{v:0, color:'#666', dash:[3,3], label:'0'}],   // optional
     zeroBase: true?,              // sub-pane forced to include 0
     range: [0,100]?,              // fixed y-range for the sub pane
     simulated: true?,             // data is illustrative, not derivable
     calc: function (d, p, H) { return { MA20: [...] }; }
   }
   `d` = {t,o,h,l,c,v,n}; `p` = resolved params; `H` = helper library.
   calc MUST return one array per declared series key, each of length d.n,
   using null (never NaN/0) for warm-up bars.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* --- Main-chart overlay, multi-series, user params ------------------- */
  R['MA'] = {
    pane: 'main',
    params: [{ k: 'n1', d: 5 }, { k: 'n2', d: 10 }, { k: 'n3', d: 20 }, { k: 'n4', d: 60 }],
    series: [
      { k: 'MA1', type: 'line', color: '#FF8D1E' },
      { k: 'MA2', type: 'line', color: '#0CAEE6' },
      { k: 'MA3', type: 'line', color: '#E970DC' },
      { k: 'MA4', type: 'line', color: '#9BE564' }
    ],
    calc: function (d, p, H) {
      return {
        MA1: H.sma(d.c, p.n1), MA2: H.sma(d.c, p.n2),
        MA3: H.sma(d.c, p.n3), MA4: H.sma(d.c, p.n4)
      };
    }
  };

  /* --- Main-chart band with a shaded envelope -------------------------- */
  R['BOLL'] = {
    pane: 'main',
    params: [{ k: 'sd', d: 20 }, { k: 'width', d: 2, step: 0.1 }],
    series: [
      { k: 'UPPER', type: 'line', color: '#FFC90E' },
      { k: 'MID', type: 'line', color: '#FFAEC9' },
      { k: 'LOWER', type: 'line', color: '#0CAEE6', fillTo: 'UPPER', fill: 'rgba(12,174,230,0.07)' }
    ],
    calc: function (d, p, H) {
      const dis = H.stdp(d.c, p.sd);
      const mid = H.sma(d.c, p.sd);
      return {
        MID: mid,
        UPPER: H.add(mid, H.scale(dis, p.width)),
        LOWER: H.sub(mid, H.scale(dis, p.width))
      };
    }
  };

  /* --- Sub-pane, line + signed histogram -------------------------------- */
  R['MACD'] = {
    pane: 'sub',
    params: [{ k: 'fast', d: 12 }, { k: 'slow', d: 26 }, { k: 'signal', d: 9 }],
    series: [
      { k: 'MACD', type: 'hist', colorBy: 'sign' },
      { k: 'DIF', type: 'line', color: '#FF8D1E' },
      { k: 'DEA', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0 }],
    zeroBase: true,
    calc: function (d, p, H) {
      const dif = H.sub(H.ema(d.c, p.fast), H.ema(d.c, p.slow));
      const dea = H.ema(dif, p.signal);
      return { DIF: dif, DEA: dea, MACD: H.scale(H.sub(dif, dea), 2) };
    }
  };

  /* --- Sub-pane, bounded 0..100 with reference lines -------------------- */
  R['RSI'] = {
    pane: 'sub',
    params: [{ k: 'n1', d: 6 }, { k: 'n2', d: 12 }, { k: 'n3', d: 24 }],
    series: [
      { k: 'RSI1', type: 'line', color: '#FF8D1E' },
      { k: 'RSI2', type: 'line', color: '#0CAEE6' },
      { k: 'RSI3', type: 'line', color: '#E970DC' }
    ],
    hlines: [{ v: 80, label: '80' }, { v: 50, label: '50' }, { v: 20, label: '20' }],
    range: [0, 100],
    calc: function (d, p, H) {
      function rsi(n) {
        const lc = H.ref(d.c, 1);
        const diff = H.sub(d.c, lc);
        const up = H.map(diff, function (x) { return Math.max(x, 0); });
        return H.scale(H.div(H.smma(up, n, 1), H.smma(H.abs(diff), n, 1)), 100);
      }
      return { RSI1: rsi(p.n1), RSI2: rsi(p.n2), RSI3: rsi(p.n3) };
    }
  };

  /* --- Simulated data: needs the full index constituent set ------------- */
  R['ADR_SPX'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'ADR_SPX', type: 'line', color: '#0CAEE6' }],
    hlines: [{ v: 1, label: '1.0' }],
    calc: function (d, p, H) {
      // Breadth loosely tracks price momentum, so the illustrative series is
      // anchored to 10-bar price change plus an independent seeded wobble.
      const mom = H.rescale(H.change(d.c, 10), -0.8, 0.8);
      const noise = H.synth(d.n, 'ADR_SPX', { lo: -0.5, hi: 0.5, persistence: 0.7 });
      return { ADR_SPX: H.map(H.add(mom, noise), function (x) { return Math.max(0.15, 1 + x * 0.75); }) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_01_trend_ma.js ---- */
/* =========================================================================
   reg_01_trend_ma.js — the moving-average family (category: trend)

   EMA WMA DEMA TEMA HMA LSMA VWMA TWAP BBI GMMA

   All ten are declared main-chart in their Python sources
   (indicator('ID', '...', True)), so every entry here is pane:'main'.
   Formulas are ported one-for-one from
   /domain-knowledge/indicators/technicals/trend/<ID>.py
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* --- EMA: six exponential averages, α = 2/(n+1) ---------------------- */
  R['EMA'] = {
    pane: 'main',
    params: [
      { k: 'n1', d: 5 }, { k: 'n2', d: 10 }, { k: 'n3', d: 20 },
      { k: 'n4', d: 60 }, { k: 'n5', d: 120 }, { k: 'n6', d: 250 }
    ],
    series: [
      { k: 'EMA1', type: 'line', color: '#FF8D1E' },
      { k: 'EMA2', type: 'line', color: '#0CAEE6' },
      { k: 'EMA3', type: 'line', color: '#E970DC' },
      { k: 'EMA4', type: 'line', color: '#7C9CFF' },
      { k: 'EMA5', type: 'line', color: '#9BE564' },
      { k: 'EMA6', type: 'line', color: '#FF6B6B', width: 1.6 }
    ],
    calc: function (d, p, H) {
      return {
        EMA1: H.ema(d.c, p.n1), EMA2: H.ema(d.c, p.n2), EMA3: H.ema(d.c, p.n3),
        EMA4: H.ema(d.c, p.n4), EMA5: H.ema(d.c, p.n5), EMA6: H.ema(d.c, p.n6)
      };
    }
  };

  /* --- WMA: linear (triangular) weights, newest bar weighted n --------- */
  R['WMA'] = {
    pane: 'main',
    params: [{ k: 'n', d: 9 }],
    series: [{ k: 'WMA_LINE', type: 'line', color: '#FFC90E' }],
    calc: function (d, p, H) {
      return { WMA_LINE: H.wma(d.c, p.n) };
    }
  };

  /* --- DEMA: 2·EMA − EMA(EMA), a one-step lag correction ---------------- */
  R['DEMA'] = {
    pane: 'main',
    params: [{ k: 'n', d: 9 }],
    series: [{ k: 'DEMA', type: 'line', color: '#FF8D1E' }],
    calc: function (d, p, H) {
      // Written out rather than calling H.dema so the correction term is visible.
      const e1 = H.ema(d.c, p.n);
      const e2 = H.ema(e1, p.n);
      return { DEMA: H.sub(H.scale(e1, 2), e2) };
    }
  };

  /* --- TEMA: 3·(EMA − EMA²) + EMA³, a second-order lag correction ------- */
  R['TEMA'] = {
    pane: 'main',
    params: [{ k: 'n', d: 9 }],
    series: [{ k: 'TEMA', type: 'line', color: '#C77DFF' }],
    calc: function (d, p, H) {
      const e1 = H.ema(d.c, p.n);
      const e2 = H.ema(e1, p.n);
      const e3 = H.ema(e2, p.n);
      return { TEMA: H.add(H.scale(H.sub(e1, e2), 3), e3) };
    }
  };

  /* --- HMA: WMA of (2·WMA(n/2) − WMA(n)), smoothed over √n -------------
     The Python truncates both derived periods with int(), not round(),
     so floor() is used here to reproduce it exactly (n=9 → 4 and 3).     */
  R['HMA'] = {
    pane: 'main',
    params: [{ k: 'n', d: 9 }],
    series: [{ k: 'HMA', type: 'line', color: '#4ECDC4', width: 1.6 }],
    calc: function (d, p, H) {
      const half = Math.max(1, Math.floor(p.n / 2));
      const rootN = Math.max(1, Math.floor(Math.sqrt(p.n)));
      const raw = H.sub(H.scale(H.wma(d.c, half), 2), H.wma(d.c, p.n));
      return { HMA: H.wma(raw, rootN) };
    }
  };

  /* --- LSMA: endpoint of the n-bar least-squares fit --------------------
     Python: close().forcast(n) − close().slope(n). forcast() projects the
     regression one bar ahead (intercept + slope·n); subtracting one slope
     lands on the current bar (intercept + slope·(n−1)), which is exactly
     H.linreg(..., offset 0).                                              */
  R['LSMA'] = {
    pane: 'main',
    params: [{ k: 'n', d: 25 }],
    series: [{ k: 'LSMA', type: 'line', color: '#E970DC', width: 1.6 }],
    calc: function (d, p, H) {
      return { LSMA: H.linreg(d.c, p.n, 0) };
    }
  };

  /* --- VWMA: Σ(C·V) / Σ(V) over n bars ---------------------------------- */
  R['VWMA'] = {
    pane: 'main',
    params: [{ k: 'n', d: 20 }],
    series: [{ k: 'VWMA', type: 'line', color: '#FF8D1E', width: 1.6 }],
    calc: function (d, p, H) {
      const pv = H.sum(H.mul(d.c, d.v), p.n);
      const vv = H.sum(d.v, p.n);
      return { VWMA: H.div(pv, vv) };   // H.div returns null on zero volume
    }
  };

  /* --- TWAP: anchored running mean of the close -------------------------
     The Python anchors on a calendar change (year change for day/week/
     month/quarter/year bars, day change for intraday bars) and then
     averages every close since that anchor. This dataset is daily, so the
     year anchor is used: TWAP is the year-to-date average close.          */
  R['TWAP'] = {
    pane: 'main',
    params: [],
    series: [{ k: 'TWAP', type: 'line', color: '#4ECDC4', width: 1.6 }],
    calc: function (d, p, H) {
      const out = new Array(d.n).fill(null);
      let sum = 0, cnt = 0, prevYear = null;
      for (let i = 0; i < d.n; i++) {
        const year = new Date(d.t[i]).getUTCFullYear();
        if (prevYear === null || year !== prevYear) { sum = 0; cnt = 0; }
        prevYear = year;
        const c = d.c[i];
        if (!H.num(c)) { out[i] = cnt ? sum / cnt : null; continue; }
        sum += c; cnt++;
        out[i] = sum / cnt;
      }
      return { TWAP: out };
    }
  };

  /* --- BBI: the flat average of four SMAs ------------------------------- */
  R['BBI'] = {
    pane: 'main',
    params: [{ k: 'm1', d: 3 }, { k: 'm2', d: 6 }, { k: 'm3', d: 12 }, { k: 'm4', d: 24 }],
    series: [{ k: 'BBI', type: 'line', color: '#FF8D1E', width: 1.6 }],
    calc: function (d, p, H) {
      const s = H.add(H.add(H.sma(d.c, p.m1), H.sma(d.c, p.m2)),
                      H.add(H.sma(d.c, p.m3), H.sma(d.c, p.m4)));
      return { BBI: H.scale(s, 0.25) };
    }
  };

  /* --- GMMA: Guppy's two EMA ribbons -----------------------------------
     Six short EMAs (traders' group) and six long EMAs (investors' group),
     deliberately drawn in two colours only — the information is in the
     width of each band and the gap between them, not in any single line. */
  R['GMMA'] = {
    pane: 'main',
    params: [
      { k: 'n1', d: 3 }, { k: 'n2', d: 5 }, { k: 'n3', d: 8 },
      { k: 'n4', d: 10 }, { k: 'n5', d: 12 }, { k: 'n6', d: 15 },
      { k: 'n7', d: 30 }, { k: 'n8', d: 35 }, { k: 'n9', d: 40 },
      { k: 'n10', d: 45 }, { k: 'n11', d: 50 }, { k: 'n12', d: 60 }
    ],
    series: [
      { k: 'ST1', type: 'line', color: '#0CAEE6', width: 1.1 },
      { k: 'ST2', type: 'line', color: '#0CAEE6', width: 1.1 },
      { k: 'ST3', type: 'line', color: '#0CAEE6', width: 1.1 },
      { k: 'ST4', type: 'line', color: '#0CAEE6', width: 1.1 },
      { k: 'ST5', type: 'line', color: '#0CAEE6', width: 1.1 },
      { k: 'ST6', type: 'line', color: '#0CAEE6', width: 1.1 },
      { k: 'LT1', type: 'line', color: '#FF8D1E', width: 1.1 },
      { k: 'LT2', type: 'line', color: '#FF8D1E', width: 1.1 },
      { k: 'LT3', type: 'line', color: '#FF8D1E', width: 1.1 },
      { k: 'LT4', type: 'line', color: '#FF8D1E', width: 1.1 },
      { k: 'LT5', type: 'line', color: '#FF8D1E', width: 1.1 },
      { k: 'LT6', type: 'line', color: '#FF8D1E', width: 1.1 }
    ],
    calc: function (d, p, H) {
      return {
        ST1: H.ema(d.c, p.n1), ST2: H.ema(d.c, p.n2), ST3: H.ema(d.c, p.n3),
        ST4: H.ema(d.c, p.n4), ST5: H.ema(d.c, p.n5), ST6: H.ema(d.c, p.n6),
        LT1: H.ema(d.c, p.n7), LT2: H.ema(d.c, p.n8), LT3: H.ema(d.c, p.n9),
        LT4: H.ema(d.c, p.n10), LT5: H.ema(d.c, p.n11), LT6: H.ema(d.c, p.n12)
      };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_02_trend_dm.js ---- */
/* =========================================================================
   reg_02_trend_dm.js — directional-movement & trend-strength family
   ADX, DMI, DDI, AROON, SI, MI, TRIX, DMA, PRICEOSC, FO
   Every formula is a direct port of technicals/trend/<ID>.py.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* --- ADX — Wilder's directional movement, smoothed the original way ----
     up      = H − H₋₁ ;  down = L₋₁ − L
     +DM     = (up > down and up > 0)   ? up   : 0
     −DM     = (down > up and down > 0) ? down : 0
     ATR'    = SMMA(TR, diLen)
     +DI     = 100 × SMMA(+DM, diLen) / ATR'
     DX      = |+DI − −DI| / (+DI + −DI)          (0 when the sum is 0)
     ADX     = 100 × SMMA(DX, adxLen)                                     */
  R['ADX'] = {
    pane: 'sub',
    params: [{ k: 'diLen', d: 14 }, { k: 'adxLen', d: 14 }],
    series: [
      { k: 'ADX', type: 'line', color: '#FF6B6B', width: 1.8 },
      { k: 'PDI', type: 'line', color: '#0CAEE6' },
      { k: 'MDI', type: 'line', color: '#FFC90E' }
    ],
    hlines: [{ v: 50, label: '50' }, { v: 25, label: '25' }, { v: 20, label: '20' }],
    calc: function (d, p, H) {
      const n = d.n;
      const plusDm = new Array(n).fill(null);
      const minusDm = new Array(n).fill(null);
      for (let i = 1; i < n; i++) {
        const up = d.h[i] - d.h[i - 1];
        const dn = d.l[i - 1] - d.l[i];
        plusDm[i] = (up > dn && up > 0) ? up : 0;
        minusDm[i] = (dn > up && dn > 0) ? dn : 0;
      }
      const atr = H.smma(H.tr(d), p.diLen, 1);
      const plus = H.scale(H.div(H.smma(plusDm, p.diLen, 1), atr), 100);
      const minus = H.scale(H.div(H.smma(minusDm, p.diLen, 1), atr), 100);

      const dx = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        if (!H.num(plus[i]) || !H.num(minus[i])) continue;
        const tot = plus[i] + minus[i];
        dx[i] = tot === 0 ? 0 : Math.abs(plus[i] - minus[i]) / tot;
      }
      return { PDI: plus, MDI: minus, ADX: H.scale(H.smma(dx, p.adxLen, 1), 100) };
    }
  };

  /* --- DMI — the rolling-sum variant, plus ADXR ---------------------------
     TR₍ₙ₎ = Σⁿ max(H−L, |H−C₋₁|, |L−C₋₁|)
     HD    = H − H₋₁ ;  LD = L₋₁ − L
     DMP   = Σⁿ (HD > 0 and HD > LD ? HD : 0)
     DMM   = Σⁿ (LD > 0 and LD > HD ? LD : 0)
     PDI   = 100 × DMP / TR₍ₙ₎ ;  MDI = 100 × DMM / TR₍ₙ₎
     ADX   = SMA(|MDI − PDI| / (MDI + PDI) × 100, m)
     ADXR  = (ADX + ADX₋ₘ) / 2                                             */
  R['DMI'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 14 }, { k: 'm', d: 6 }],
    series: [
      { k: 'PDI', type: 'line', color: '#FF8D1E' },
      { k: 'MDI', type: 'line', color: '#E970DC' },
      { k: 'ADX', type: 'line', color: '#FFC90E', width: 1.8 },
      { k: 'ADXR', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 50, label: '50' }, { v: 20, label: '20' }],
    calc: function (d, p, H) {
      const n = d.n;
      const hd = new Array(n).fill(null);
      const ld = new Array(n).fill(null);
      for (let i = 1; i < n; i++) {
        const a = d.h[i] - d.h[i - 1];
        const b = d.l[i - 1] - d.l[i];
        hd[i] = (a > 0 && a > b) ? a : 0;
        ld[i] = (b > 0 && b > a) ? b : 0;
      }
      const tr1 = H.sum(H.tr(d), p.n);
      const pdi = H.scale(H.div(H.sum(hd, p.n), tr1), 100);
      const mdi = H.scale(H.div(H.sum(ld, p.n), tr1), 100);
      const dx = H.scale(H.div(H.abs(H.sub(mdi, pdi)), H.add(mdi, pdi)), 100);
      const adx = H.sma(dx, p.m);
      const adxr = H.scale(H.add(adx, H.ref(adx, p.m)), 0.5);
      return { PDI: pdi, MDI: mdi, ADX: adx, ADXR: adxr };
    }
  };

  /* --- DDI — normalised directional deviation ----------------------------
     mid  = H + L ;  midPrev = H₋₁ + L₋₁
     span = max(|H − H₋₁|, |L − L₋₁|)
     DMZ  = mid  > midPrev ? span : 0        (upward deviation)
     DMF  = mid  < midPrev ? span : 0        (downward deviation)
     DIZ  = Σⁿ DMZ / (Σⁿ DMZ + Σⁿ DMF) ;  DIF = 1 − DIZ
     DDI  = DIZ − DIF                        ← bounded −1 … +1
     ADDI = SMMA(DDI, n1, m)   with α = m/n1
     AD   = SMA(ADDI, m1)                                                  */
  R['DDI'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 13 }, { k: 'n1', d: 30 }, { k: 'm', d: 10 }, { k: 'm1', d: 5 }],
    series: [
      { k: 'DDI', type: 'line', color: '#FF8D1E' },
      { k: 'ADDI', type: 'line', color: '#0CAEE6' },
      { k: 'AD', type: 'line', color: '#E970DC' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const n = d.n;
      const dmz = new Array(n).fill(null);
      const dmf = new Array(n).fill(null);
      for (let i = 1; i < n; i++) {
        const mid = d.h[i] + d.l[i];
        const prev = d.h[i - 1] + d.l[i - 1];
        const span = Math.max(Math.abs(d.h[i] - d.h[i - 1]), Math.abs(d.l[i] - d.l[i - 1]));
        dmz[i] = (mid <= prev) ? 0 : span;
        dmf[i] = (mid >= prev) ? 0 : span;
      }
      const sz = H.sum(dmz, p.n);
      const sf = H.sum(dmf, p.n);
      const tot = H.add(sz, sf);
      const diz = H.div(sz, tot);
      const dif = H.div(sf, tot);
      const ddi = H.sub(diz, dif);
      const addi = H.smma(ddi, p.n1, p.m);
      return { DDI: ddi, ADDI: addi, AD: H.sma(addi, p.m1) };
    }
  };

  /* --- AROON — how long since the extreme -------------------------------
     UP   = (n − barsSinceHighest(H, n)) / n × 100
     DOWN = (n − barsSinceLowest(L, n)) / n × 100
     A fresh n-bar high today ⇒ UP = 100.                                  */
  R['AROON'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 14 }],
    series: [
      { k: 'AROON_UP', type: 'line', color: '#FFC90E' },
      { k: 'AROON_DOWN', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 70, label: '70' }, { v: 50, label: '50' }, { v: 30, label: '30' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const hb = H.highestBars(d.h, p.n);
      const lb = H.lowestBars(d.l, p.n);
      const k = 100 / p.n;
      return {
        AROON_UP: H.map(hb, function (x) { return (p.n - x) * k; }),
        AROON_DOWN: H.map(lb, function (x) { return (p.n - x) * k; })
      };
    }
  };

  /* --- SI — Wilder's Swing Index (single-bar) ----------------------------
     A = |H − C₋₁| ;  B = |L − C₋₁| ;  RNG = H − L ;  D = |C₋₁ − O₋₁|
     X = (C − C₋₁) + 0.5(C − O) + 0.25(C₋₁ − O₋₁)
     K = max(A, B) ;  M = max(K, RNG)
     R = A = M ? A − 0.5B + 0.25D
       : B = M ? B − 0.5A + 0.25D
       :         RNG + 0.25D
     SI = 50 × X × K / (R × n)      ← n is the limit-move divisor          */
  R['SI'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 3 }],
    series: [{ k: 'SI', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const n = d.n;
      const out = new Array(n).fill(null);
      for (let i = 1; i < n; i++) {
        const pc = d.c[i - 1], po = d.o[i - 1];
        const aa = Math.abs(d.h[i] - pc);
        const bb = Math.abs(d.l[i] - pc);
        const rng = d.h[i] - d.l[i];
        const dd = Math.abs(pc - po);
        const x = (d.c[i] - pc) + 0.5 * (d.c[i] - d.o[i]) + 0.25 * (pc - po);
        const k = Math.max(aa, bb);
        const m = Math.max(k, rng);
        let r;
        if (aa === m) r = aa - 0.5 * bb + 0.25 * dd;
        else if (bb === m) r = bb - 0.5 * aa + 0.25 * dd;
        else r = rng + 0.25 * dd;
        const den = r * p.n;
        out[i] = den === 0 ? null : (50 * x * k) / den;
      }
      return { SI: out };
    }
  };

  /* --- MI — raw m-bar momentum plus its Wilder average -------------------
     DIFF = C − C₋ₘ
     MI   = SMMA(DIFF, m)   with α = 1/m                                   */
  R['MI'] = {
    pane: 'sub',
    params: [{ k: 'm', d: 12 }],
    series: [
      { k: 'DIFF', type: 'line', color: '#FF8D1E' },
      { k: 'MI', type: 'line', color: '#0CAEE6', width: 1.8 }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const diff = H.sub(d.c, H.ref(d.c, p.m));
      return { DIFF: diff, MI: H.smma(diff, p.m, 1) };
    }
  };

  /* --- TRIX — triple-smoothed rate of change ----------------------------
     TR₃  = EMA(EMA(EMA(C, p), p), p)
     TRIX = (TR₃ − TR₃₋₁) / TR₃₋₁ × 100
     TRMA = SMA(TRIX, n)                                                   */
  R['TRIX'] = {
    pane: 'sub',
    params: [{ k: 'p', d: 12 }, { k: 'n', d: 20 }],
    series: [
      { k: 'TRIX', type: 'line', color: '#FF8D1E', width: 1.8 },
      { k: 'TRMA', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const t3 = H.ema(H.ema(H.ema(d.c, p.p), p.p), p.p);
      const prev = H.ref(t3, 1);
      const trix = H.scale(H.div(H.sub(t3, prev), prev), 100);
      return { TRIX: trix, TRMA: H.sma(trix, p.n) };
    }
  };

  /* --- DMA — absolute spread of two SMAs --------------------------------
     D   = SMA(C, short) − SMA(C, long)
     DMA = SMA(D, m)                                                       */
  R['DMA'] = {
    pane: 'sub',
    params: [{ k: 'short', d: 10 }, { k: 'long', d: 50 }, { k: 'm', d: 10 }],
    series: [
      { k: 'D', type: 'line', color: '#FFC90E', width: 1.8 },
      { k: 'DMA', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const dd = H.sub(H.sma(d.c, p.short), H.sma(d.c, p.long));
      return { D: dd, DMA: H.sma(dd, p.m) };
    }
  };

  /* --- PRICEOSC — the same spread, normalised by the fast MA ------------
     PRICEOSC = (SMA(C, short) − SMA(C, long)) / SMA(C, short) × 100       */
  R['PRICEOSC'] = {
    pane: 'sub',
    params: [{ k: 'short', d: 12 }, { k: 'long', d: 26 }],
    series: [{ k: 'PRICEOSC', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const ms = H.sma(d.c, p.short);
      const ml = H.sma(d.c, p.long);
      return { PRICEOSC: H.scale(H.div(H.sub(ms, ml), ms), 100) };
    }
  };

  /* --- FO — price versus yesterday's regression forecast ----------------
     TSF  = value of the n-bar least-squares fit at the current bar
     FOSC = (C − TSF₋₁) / C × 100
     SIG  = SMA(FOSC, m)                                                   */
  R['FO'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 5 }, { k: 'm', d: 3 }],
    series: [
      { k: 'FOSC', type: 'line', color: '#4ECDC4' },
      { k: 'SIG', type: 'line', color: '#FF6B6B', width: 1.8 }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const tsf = H.linreg(d.c, p.n, 0);
      const fosc = H.scale(H.div(H.sub(d.c, H.ref(tsf, 1)), d.c), 100);
      return { FOSC: fosc, SIG: H.sma(fosc, p.m) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_03_trend_sys.js ---- */
/* =========================================================================
   reg_03_trend_sys.js — self-contained trend systems and signal generators.

   SAR          Parabolic Stop and Reverse      (stateful AF loop)
   SUPER_TREND  Supertrend                      (stateful ATR-band flip loop)
   ALLIGAT      Williams Alligator              (three displaced SMMAs)
   TSF          Time Series Forecast            (linreg endpoint + slope × k)
   TOWER        Tower Line / 宝塔线
   HADIFF       Heikin Ashi Difference
   SQUEEZE      TTM Squeeze
   FISHER       Fisher Transform
   AO           Awesome Oscillator
   EWO          Elliott Wave Oscillator
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* --- SAR: stateful parabolic stop, ported line-for-line from SAR.py ---
     Note this platform's variant: the acceleration factor is signed, the
     candidate stop is clamped by the two previous bars' extremes, and on a
     flip the stop jumps straight to the tracked extreme. */
  R['SAR'] = {
    pane: 'main',
    params: [{ k: 't', d: 4 }, { k: 'af', d: 2 }, { k: 'ep', d: 20 }],
    series: [{ k: 'SAR', type: 'dots', color: '#FF8D1E' }],
    calc: function (d, p, H) {
      const n = d.n;
      const out = new Array(n).fill(null);
      const t = Math.max(3, Math.round(p.t));
      const af = p.af / 100;
      const epMax = p.ep / 100;
      if (n < t + 1) return { SAR: out };

      let highest = -Infinity, lowest = Infinity, netBody = 0;
      for (let i = 0; i < t; i++) {
        netBody += d.c[i] - d.o[i];
        if (d.h[i] > highest) highest = d.h[i];
        if (d.l[i] < lowest) lowest = d.l[i];
      }
      let bullish = netBody >= 0;
      out[t - 1] = bullish ? lowest : highest;
      let acc = bullish ? af : -af;
      highest = d.h[t - 1];
      lowest = d.l[t - 1];

      for (let i = t; i < n; i++) {
        const prev = out[i - 1];
        if (bullish) {
          let s = prev + Math.abs(acc) * (highest - prev);
          s = Math.min(s, d.l[i - 1], d.l[i - 2]);
          out[i] = s;
        } else {
          let s = prev + Math.abs(acc) * (lowest - prev);
          s = Math.max(s, d.h[i - 1], d.h[i - 2]);
          out[i] = s;
        }
        if (d.h[i] > highest) {
          if (bullish) acc = Math.min(acc + af, epMax);
          highest = d.h[i];
        }
        if (d.l[i] < lowest) {
          if (!bullish) acc = Math.max(acc - af, -epMax);
          lowest = d.l[i];
        }
        if (bullish && out[i] > d.l[i]) {
          bullish = false; out[i] = highest; acc = -af;
          highest = d.h[i]; lowest = d.l[i];
        } else if (!bullish && out[i] < d.h[i]) {
          bullish = true; out[i] = lowest; acc = af;
          highest = d.h[i]; lowest = d.l[i];
        }
      }
      return { SAR: out };
    }
  };

  /* --- SUPER_TREND: ATR band that ratchets one way and flips on a close
     through it. The Python uses a SIMPLE average of TR, not Wilder's. --- */
  R['SUPER_TREND'] = {
    pane: 'main',
    params: [{ k: 'atrLen', d: 10 }, { k: 'factor', d: 3, step: 0.1 }],
    series: [{ k: 'SUPERTREND', type: 'line', color: '#FF8D1E', width: 2 }],
    calc: function (d, p, H) {
      const n = d.n;
      const L = Math.max(2, Math.round(p.atrLen));
      const out = new Array(n).fill(null);
      if (n < L + 1) return { SUPERTREND: out };

      const atr = H.sma(H.tr(d), L);
      const mid = H.hl2(d);
      const upper = H.add(mid, H.scale(atr, p.factor));
      const lower = H.sub(mid, H.scale(atr, p.factor));

      const dir = new Array(n).fill(null);
      out[L - 1] = upper[L - 1];
      dir[L - 1] = 1;                       // 1 = riding the upper band
      for (let i = L; i < n; i++) {
        const ps = out[i - 1], pd = dir[i - 1];
        if (!H.num(ps) || !H.num(upper[i]) || !H.num(lower[i])) { out[i] = ps; dir[i] = pd; continue; }
        if (pd === 1) {
          if (d.c[i] > ps) { out[i] = lower[i]; dir[i] = -1; }
          else { out[i] = Math.min(upper[i], ps); dir[i] = 1; }
        } else {
          if (d.c[i] < ps) { out[i] = upper[i]; dir[i] = 1; }
          else { out[i] = Math.max(lower[i], ps); dir[i] = -1; }
        }
      }
      return { SUPERTREND: out };
    }
  };

  /* --- ALLIGAT: three Wilder-smoothed midpoints, each displaced.
     `plot(..., ref=k)` in this platform means "the value k bars ago",
     the same convention as close().ref(1), so H.ref is the faithful port. */
  R['ALLIGAT'] = {
    pane: 'main',
    params: [
      { k: 'jawN', d: 13 }, { k: 'jawS', d: 8 },
      { k: 'teethN', d: 8 }, { k: 'teethS', d: 5 },
      { k: 'lipN', d: 5 }, { k: 'lipS', d: 3 }
    ],
    series: [
      { k: 'JAW', type: 'line', color: '#7C9CFF' },
      { k: 'TEETH', type: 'line', color: '#FF6B6B' },
      { k: 'LIPS', type: 'line', color: '#9BE564' }
    ],
    calc: function (d, p, H) {
      const mid = H.hl2(d);
      return {
        JAW: H.ref(H.smma(mid, p.jawN, 1), p.jawS),
        TEETH: H.ref(H.smma(mid, p.teethN, 1), p.teethS),
        LIPS: H.ref(H.smma(mid, p.lipN, 1), p.lipS)
      };
    }
  };

  /* --- TSF: the endpoint of the n-bar least-squares line, then extended
     forward by k more bars along the same slope. --- */
  R['TSF'] = {
    pane: 'main',
    params: [{ k: 'n', d: 9 }, { k: 'fwd', d: 6 }],
    series: [
      { k: 'TSF', type: 'line', color: '#FFC90E', width: 1.6 },
      { k: 'LREG', type: 'line', color: '#0CAEE6', dash: [4, 3] }
    ],
    calc: function (d, p, H) {
      const y = H.linreg(d.c, p.n);
      const sl = H.linregSlope(d.c, p.n);
      return { TSF: H.add(y, H.scale(sl, p.fwd)), LREG: y };
    }
  };

  /* --- TOWER (宝塔线): the six plot_stickline calls reduce to one colour
     rule. Working all six branches through:
       prior-up  (C₋₁ ≥ C₋₂): red while C ≥ C₋₂, green only once C < C₋₂
       prior-dn  (C₋₁ < C₋₂): green while C < C₋₂, red only once C ≥ C₋₂
     i.e. the tower colour is exactly sign(C − C₋₂). Plotting the 2-bar net
     change with colorBy:'sign' therefore reproduces the Python's colour
     state faithfully — which sign(C − C₋₁) would NOT have done. --- */
  R['TOWER'] = {
    pane: 'sub',
    params: [],
    series: [{ k: 'TOWER', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      return { TOWER: H.sub(d.c, H.ref(d.c, 2)) };
    }
  };

  /* --- HADIFF: Heikin-Ashi close minus Heikin-Ashi open, plus its MA.
     H.heikin's open recursion (ho = (ho₋₁ + hc₋₁)/2) is exactly the
     Python's hac.ref(1).tma(0.5, 0.5). --- */
  R['HADIFF'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 3 }],
    series: [
      { k: 'HADIFF', type: 'hist', colorBy: 'sign' },
      { k: 'HADMA', type: 'line', color: '#FFC90E' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const ha = H.heikin(d);
      const diff = H.sub(ha.c, ha.o);
      return { HADIFF: diff, HADMA: H.sma(diff, p.n) };
    }
  };

  /* --- SQUEEZE (TTM): OSC = linear-regression of price minus the mean of
     the n-bar midrange and the n-bar SMA. DIFF = Bollinger upper minus
     Keltner upper; DIFF < 0 is the squeeze (bands inside the channel). */
  R['SQUEEZE'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 20 }, { k: 'w1', d: 2, step: 0.1 }, { k: 'w2', d: 1, step: 0.1 }],
    series: [
      { k: 'OSC', type: 'hist', colorBy: 'sign' },
      { k: 'DIFF', type: 'line', color: '#C77DFF' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const midRange = H.scale(H.add(H.highest(d.h, p.n), H.lowest(d.l, p.n)), 0.5);
      const e1 = H.add(midRange, H.sma(d.c, p.n));
      const osc = H.linreg(H.sub(d.c, H.scale(e1, 0.5)), p.n);
      const bbUp = H.add(H.sma(d.c, p.n), H.scale(H.stdp(d.c, p.n), p.w1));
      const kcUp = H.add(H.ema(d.c, p.n), H.scale(H.ema(H.tr(d), p.n), p.w2));
      return { OSC: osc, DIFF: H.sub(bbUp, kcUp) };
    }
  };

  /* --- FISHER: squash HL2 into 0..1 over n bars, smooth, clamp, then apply
     the inverse hyperbolic tangent so the tails are stretched. --- */
  R['FISHER'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 9 }],
    series: [
      { k: 'FISHER', type: 'line', color: '#0CAEE6', width: 1.6 },
      { k: 'TRIGGER', type: 'line', color: '#FF8D1E' }
    ],
    hlines: [{ v: 1.5, label: '1.5' }, { v: 0.75, label: '0.75' }, { v: 0, label: '0' },
             { v: -0.75, label: '-0.75' }, { v: -1.5, label: '-1.5' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const n = d.n;
      const mid = H.hl2(d);
      const lo = H.lowest(mid, p.n);
      const hi = H.highest(mid, p.n);
      const span = H.sub(hi, lo);
      // Two distinct cases, deliberately NOT collapsed together:
      //   span null  → the n-bar window is not full yet: warm-up, emit null.
      //   span === 0 → a genuinely flat window: this is what the Python's
      //                replace_na(0.0) catches, so z = 0 and the filters run.
      const z = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        const s = span[i];
        if (!H.num(s) || !H.num(lo[i])) continue;   // warm-up
        z[i] = s === 0 ? 0 : (mid[i] - lo[i]) / s;
      }
      // value = (z - 0.5).tma(0.67, 0.66)  →  v = 0.67·x + 0.66·v₋₁
      const val = new Array(n).fill(null);
      let prev = 0;
      for (let i = 0; i < n; i++) {
        if (z[i] === null) continue;                // stay null through warm-up
        prev = 0.67 * (z[i] - 0.5) + 0.66 * prev;
        val[i] = prev;
      }
      // clamp to ±0.999 so the log stays finite
      const fish = new Array(n).fill(null);
      let f = 0;
      for (let i = 0; i < n; i++) {
        let v = val[i];
        if (!H.num(v)) continue;
        if (v > 0.99) v = 0.999; else if (v < -0.99) v = -0.999;
        f = 0.5 * Math.log((1 + v) / (1 - v)) + 0.5 * f;
        fish[i] = f;
      }
      return { FISHER: fish, TRIGGER: H.ref(fish, 1) };
    }
  };

  /* --- AO: 5/34 SMA spread of the bar midpoint. --- */
  R['AO'] = {
    pane: 'sub',
    params: [{ k: 'p1', d: 5 }, { k: 'p2', d: 34 }],
    series: [{ k: 'AO', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const mid = H.hl2(d);
      return { AO: H.sub(H.sma(mid, p.p1), H.sma(mid, p.p2)) };
    }
  };

  /* --- EWO: same idea as AO but EMA-based and on the close. --- */
  R['EWO'] = {
    pane: 'sub',
    params: [{ k: 'n1', d: 5 }, { k: 'n2', d: 34 }],
    series: [{ k: 'EWO', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      return { EWO: H.sub(H.ema(d.c, p.n1), H.ema(d.c, p.n2)) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_04_trend_vol.js ---- */
/* =========================================================================
   reg_04_trend_vol.js — volatility & efficiency measures (category: trend)

   ATR VOLAT HLVOL CHOP ER RVI RMI SMIE SMIEO VMACD EMV IV IV_RANK IV_PERCENTILE

   Ported from technicals/trend/<ID>.py. Notes where the platform DSL and the
   textbook disagree are inline — the .py file wins every time.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* ---------- shared: natural log-return series ------------------------- */
  function logRet(d, H) {
    return H.map(H.div(d.c, H.ref(d.c, 1)), Math.log);
  }
  /* ---------- shared: annualised realised volatility in % --------------- */
  function realisedVol(d, H, n) {
    return H.scale(H.std(logRet(d, H), n), Math.sqrt(252) * 100);
  }

  /* =======================================================================
     ATR — Average True Range
     Python: tr().sma(m)  → SIMPLE average of TR, not Wilder's RMA.
     Both TR and ATR are plotted by the source, so both are declared.
     ======================================================================= */
  R['ATR'] = {
    pane: 'sub',
    params: [{ k: 'm', d: 14 }],
    series: [
      { k: 'TR', type: 'line', color: '#FF8D1E', width: 1 },
      { k: 'ATR', type: 'line', color: '#0CAEE6', width: 1.6 }
    ],
    zeroBase: true,
    calc: function (d, p, H) {
      const tr = H.tr(d);
      return { TR: tr, ATR: H.sma(tr, p.m) };
    }
  };

  /* =======================================================================
     VOLAT — Historical (realised) Volatility, annualised, in %
     Python: fmath.volat(close(), n) * 100. Implemented as the standard
     close-to-close estimator: σ of log returns × √252.
     ======================================================================= */
  R['VOLAT'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 20 }],
    series: [{ k: 'VOLAT', type: 'line', color: '#0CAEE6', width: 1.5 }],
    hlines: [{ v: 20, label: '20%' }],
    zeroBase: true,
    calc: function (d, p, H) {
      return { VOLAT: realisedVol(d, H, p.n) };
    }
  };

  /* =======================================================================
     HLVOL — High/Low Volatility
     hld = HHV(H,n) − LLV(L,n);  HLV = EMA(hld,n) / EMA(C,n) × 100
     ======================================================================= */
  R['HLVOL'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 9 }],
    series: [{ k: 'HLV', type: 'line', color: '#FF8D1E', width: 1.5 }],
    zeroBase: true,
    calc: function (d, p, H) {
      const hld = H.sub(H.highest(d.h, p.n), H.lowest(d.l, p.n));
      return { HLV: H.scale(H.div(H.ema(hld, p.n), H.ema(d.c, p.n)), 100) };
    }
  };

  /* =======================================================================
     CHOP — Choppiness Index
     100 × log( ΣTR(n) / (HHV(H,n) − LLV(L,n)) ) / log(n)
     Python writes SMA(TR,n)×n which is exactly ΣTR(n); log base cancels.
     ======================================================================= */
  R['CHOP'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 14 }],
    series: [{ k: 'CHOP', type: 'line', color: '#7C9CFF', width: 1.6 }],
    hlines: [{ v: 61.8, label: '61.8' }, { v: 50, label: '50' }, { v: 38.2, label: '38.2' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const sumTR = H.sum(H.tr(d), p.n);
      const rng = H.sub(H.highest(d.h, p.n), H.lowest(d.l, p.n));
      const ratio = H.div(sumTR, rng);
      const lnN = Math.log(Math.max(2, Math.round(p.n)));
      return {
        CHOP: H.map(ratio, function (x) {
          return x > 0 ? (100 * Math.log(x)) / lnN : null;
        })
      };
    }
  };

  /* =======================================================================
     ER — Kaufman Efficiency Ratio
     |C − C[n]| / Σ|C − C[1]|(n)      (Python: SMA(|ΔC|,n) × n = Σ)
     Bounded 0..1 by the triangle inequality.
     ======================================================================= */
  R['ER'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 24 }],
    series: [{ k: 'ER', type: 'line', color: '#FFC90E', width: 1.6 }],
    hlines: [{ v: 0.36, label: '0.36' }],
    range: [0, 1],
    calc: function (d, p, H) {
      const net = H.abs(H.sub(d.c, H.ref(d.c, p.n)));
      const path = H.sum(H.abs(H.sub(d.c, H.ref(d.c, 1))), p.n);
      return { ER: H.div(net, path) };
    }
  };

  /* =======================================================================
     RVI — Relative Volatility Index (Dorsey)
     σ = StdDev(C, p1)
     UP   = EMA( σ where ΔC > 0 else 0 , p2 )
     DOWN = EMA( σ where ΔC ≤ 0 else 0 , p2 )
     RVI  = UP / (UP + DOWN) × 100 ;  RVIMA = SMA(RVI, p3)
     The Python replace_na(0) is dropped in favour of a null warm-up so the
     first bars are not drawn with an artificially depressed σ.
     ======================================================================= */
  R['RVI'] = {
    pane: 'sub',
    params: [{ k: 'p1', d: 10 }, { k: 'p2', d: 14 }, { k: 'p3', d: 14 }],
    series: [
      { k: 'RVI', type: 'line', color: '#0CAEE6', width: 1.6 },
      { k: 'RVIMA', type: 'line', color: '#FF8D1E', width: 1.2 }
    ],
    hlines: [{ v: 60, label: '60' }, { v: 50, label: '50' }, { v: 40, label: '40' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const sd = H.std(d.c, p.p1);
      const ch = H.sub(d.c, H.ref(d.c, 1));
      const up = new Array(d.n).fill(null);
      const dn = new Array(d.n).fill(null);
      for (let i = 0; i < d.n; i++) {
        if (H.num(sd[i]) && H.num(ch[i])) {
          up[i] = ch[i] > 0 ? sd[i] : 0;
          dn[i] = ch[i] > 0 ? 0 : sd[i];
        }
      }
      const u = H.ema(up, p.p2), l = H.ema(dn, p.p2);
      const rvi = H.scale(H.div(u, H.add(u, l)), 100);
      return { RVI: rvi, RVIMA: H.sma(rvi, p.p3) };
    }
  };

  /* =======================================================================
     RMI — Relative Momentum Index
     Identical to RSI except the differencing lag is m bars, not 1, and the
     averaging is a plain SMA rather than Wilder's.
     ======================================================================= */
  R['RMI'] = {
    pane: 'sub',
    params: [{ k: 'm', d: 5 }, { k: 'n', d: 20 }],
    series: [{ k: 'RMI', type: 'line', color: '#FF8D1E', width: 1.6 }],
    hlines: [{ v: 70, label: '70' }, { v: 50, label: '50' }, { v: 30, label: '30' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const mom = H.sub(d.c, H.ref(d.c, p.m));
      const gain = H.map(mom, function (x) { return x > 0 ? x : 0; });
      const total = H.abs(mom);
      return { RMI: H.scale(H.div(H.sma(gain, p.n), H.sma(total, p.n)), 100) };
    }
  };

  /* =======================================================================
     SMIE — SMI Ergodic Indicator (Blau's double-smoothed TSI, unscaled)
     SMI = EMA(EMA(ΔC, f), s) / EMA(EMA(|ΔC|, f), s)      ∈ [-1, 1]
     SIGNAL = EMA(SMI, n)
     Note the nesting order in the source: fast smoothing FIRST, then slow.
     ======================================================================= */
  R['SMIE'] = {
    pane: 'sub',
    params: [{ k: 'f', d: 5 }, { k: 's', d: 20 }, { k: 'n', d: 5 }],
    series: [
      { k: 'SMI', type: 'line', color: '#0CAEE6', width: 1.6 },
      { k: 'SIGNAL', type: 'line', color: '#FF8D1E', width: 1.2 }
    ],
    hlines: [{ v: 0.4, label: '+0.4' }, { v: 0 }, { v: -0.4, label: '-0.4' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const ch = H.sub(d.c, H.ref(d.c, 1));
      const num = H.ema(H.ema(ch, p.f), p.s);
      const den = H.ema(H.ema(H.abs(ch), p.f), p.s);
      const smi = H.div(num, den);
      return { SMI: smi, SIGNAL: H.ema(smi, p.n) };
    }
  };

  /* =======================================================================
     SMIEO — SMI Ergodic Oscillator = SMI − SIGNAL (the SMIE histogram)
     ======================================================================= */
  R['SMIEO'] = {
    pane: 'sub',
    params: [{ k: 'f', d: 5 }, { k: 's', d: 20 }, { k: 'n', d: 5 }],
    series: [{ k: 'SMIEO', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0 }],
    zeroBase: true,
    calc: function (d, p, H) {
      const ch = H.sub(d.c, H.ref(d.c, 1));
      const num = H.ema(H.ema(ch, p.f), p.s);
      const den = H.ema(H.ema(H.abs(ch), p.f), p.s);
      const smi = H.div(num, den);
      return { SMIEO: H.sub(smi, H.ema(smi, p.n)) };
    }
  };

  /* =======================================================================
     VMACD — MACD arithmetic applied to raw volume
     DIFF = EMA(V, fast) − EMA(V, slow);  DEA = EMA(DIFF, signal)
     VMACD = DIFF − DEA        (source draws this as a signed histogram)
     ======================================================================= */
  R['VMACD'] = {
    pane: 'sub',
    params: [{ k: 'fast', d: 12 }, { k: 'slow', d: 26 }, { k: 'signal', d: 9 }],
    series: [
      { k: 'VMACD', type: 'hist', colorBy: 'sign' },
      { k: 'DIFF', type: 'line', color: '#FF8D1E', width: 1.4 },
      { k: 'DEA', type: 'line', color: '#0CAEE6', width: 1.2 }
    ],
    hlines: [{ v: 0 }],
    zeroBase: true,
    calc: function (d, p, H) {
      const diff = H.sub(H.ema(d.v, p.fast), H.ema(d.v, p.slow));
      const dea = H.ema(diff, p.signal);
      return { DIFF: diff, DEA: dea, VMACD: H.sub(diff, dea) };
    }
  };

  /* =======================================================================
     EMV — Ease of Movement Value (Arms)
     vr  = SMA(V,n) / V              (0 when V = 0)
     mid = 100 × ((H+L) − (H+L)[1]) / (H+L)
     EMV = SMA( mid × vr × (H−L) / SMA(H−L, n) , n ) ;  EMVA = SMA(EMV, n1)
     ======================================================================= */
  R['EMV'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 14 }, { k: 'n1', d: 9 }],
    series: [
      { k: 'EMV', type: 'line', color: '#FFC90E', width: 1.5 },
      { k: 'EMVA', type: 'line', color: '#0CAEE6', width: 1.2 }
    ],
    hlines: [{ v: 0 }],
    zeroBase: true,
    calc: function (d, p, H) {
      const hl = H.add(d.h, d.l);
      const mid = H.scale(H.div(H.sub(hl, H.ref(hl, 1)), hl), 100);
      const avgV = H.sma(d.v, p.n);
      const vr = new Array(d.n).fill(null);
      for (let i = 0; i < d.n; i++) {
        if (H.num(avgV[i])) vr[i] = d.v[i] === 0 ? 0 : avgV[i] / d.v[i];
      }
      const rng = H.sub(d.h, d.l);
      const boxRatio = H.div(rng, H.sma(rng, p.n));
      const raw = H.mul(H.mul(mid, vr), boxRatio);
      const emv = H.sma(raw, p.n);
      return { EMV: emv, EMVA: H.sma(emv, p.n1) };
    }
  };

  /* =======================================================================
     IV / IV_RANK / IV_PERCENTILE — SIMULATED.
     These come from fmath.iv / fderivative.*, which read a live options
     chain (strikes, expiries, mid prices) and invert Black-Scholes. None of
     that is derivable from a single instrument's OHLCV, so the series below
     are illustrative: realised volatility as the backbone (real IV does
     track RV) plus a per-indicator seeded variance-premium wobble.
     ======================================================================= */

  /** Illustrative IV level in %, anchored to realised vol. */
  function synthIV(d, H, key) {
    const rv = realisedVol(d, H, 20);
    const wobble = H.synth(d.n, key, { lo: -7, hi: 12, persistence: 0.92 });
    return H.map(H.add(rv, wobble), function (x) { return Math.max(5, x + 4); });
  }

  R['IV'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'IV', type: 'line', color: '#4ECDC4', width: 1.6 }],
    hlines: [{ v: 20, label: '20%' }],
    zeroBase: true,
    calc: function (d, p, H) {
      return { IV: synthIV(d, H, 'IV-atm-implied-vol') };
    }
  };

  R['IV_RANK'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'n', d: 252 }],
    series: [{ k: 'IV_RANK', type: 'line', color: '#7C9CFF', width: 1.6 }],
    hlines: [{ v: 50, label: '50' }, { v: 20, label: '20' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const iv = synthIV(d, H, 'IVRANK-atm-implied-vol');
      const hi = H.highest(iv, p.n), lo = H.lowest(iv, p.n);
      return { IV_RANK: H.scale(H.div(H.sub(iv, lo), H.sub(hi, lo)), 100) };
    }
  };

  R['IV_PERCENTILE'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'n', d: 252 }],
    series: [{ k: 'IV_PCTL', type: 'line', color: '#FF8D1E', width: 1.6 }],
    hlines: [{ v: 80, label: '80' }, { v: 50, label: '50' }, { v: 20, label: '20' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const iv = synthIV(d, H, 'IVPCTL-atm-implied-vol');
      return { IV_PCTL: H.percentRank(iv, p.n) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_05_strength_a.js ---- */
/* =========================================================================
   reg_05_strength_a.js — strength batch A: the stochastic / RSI family.

   KDJ SLOWKD STOCHRSI SRSI CRSI WMSR CCI CMO TSI MFI RVGI BOP VRSI

   Every formula is ported from
   /Users/arcueidpeng/github/finance/domain-knowledge/indicators/technicals/strength/<ID>.py
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* ---------------- local helpers (not part of H) ---------------------- */

  /** Raw stochastic position of close inside the n-bar high/low channel. */
  function rsvOf(d, H, n) {
    const ll = H.lowest(d.l, n);
    const hh = H.highest(d.h, n);
    return H.scale(H.div(H.sub(d.c, ll), H.sub(hh, ll)), 100);
  }

  /** Wilder-style RSI expressed exactly as the Python does it:
      SMMA(up) / SMMA(|move|) × 100. Works on any input series. */
  function rsiOf(H, a, n) {
    const diff = H.sub(a, H.ref(a, 1));
    const up = H.map(diff, function (x) { return Math.max(x, 0); });
    return H.scale(H.div(H.smma(up, n, 1), H.smma(H.abs(diff), n, 1)), 100);
  }

  /** Mean absolute deviation over n bars — the Python `.avedev(n)`. */
  function avedev(H, a, n) {
    n = Math.max(1, Math.round(n));
    const len = a.length, r = new Array(len).fill(null);
    for (let i = n - 1; i < len; i++) {
      let s = 0, ok = true;
      for (let j = 0; j < n; j++) { const x = a[i - j]; if (!H.num(x)) { ok = false; break; } s += x; }
      if (!ok) continue;
      const m = s / n;
      let q = 0;
      for (let j = 0; j < n; j++) q += Math.abs(a[i - j] - m);
      r[i] = q / n;
    }
    return r;
  }

  /** Symmetric weighted MA with the (1,2,2,1)/6 kernel used by RVGI. */
  function swma4(H, a) {
    const len = a.length, r = new Array(len).fill(null);
    for (let i = 3; i < len; i++) {
      const x0 = a[i], x1 = a[i - 1], x2 = a[i - 2], x3 = a[i - 3];
      if (!H.num(x0) || !H.num(x1) || !H.num(x2) || !H.num(x3)) continue;
      r[i] = (x0 + 2 * x1 + 2 * x2 + x3) / 6;
    }
    return r;
  }

  /* ===================================================================== */
  /* KDJ — the Chinese-market default oscillator                           */
  /* ===================================================================== */
  R['KDJ'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 9 }, { k: 'm1', d: 3 }, { k: 'm2', d: 3 }],
    series: [
      { k: 'K', type: 'line', color: '#FF8D1E' },
      { k: 'D', type: 'line', color: '#0CAEE6' },
      { k: 'J', type: 'line', color: '#E970DC' }
    ],
    hlines: [{ v: 100, label: '100' }, { v: 80, label: '80' }, { v: 50, label: '50' }, { v: 20, label: '20' }, { v: 0, label: '0' }],
    calc: function (d, p, H) {
      const rsv = rsvOf(d, H, p.n);
      const k = H.smma(rsv, p.m1, 1);
      const dd = H.smma(k, p.m2, 1);
      const j = H.sub(H.scale(k, 3), H.scale(dd, 2));
      return { K: k, D: dd, J: j };
    }
  };

  /* ===================================================================== */
  /* SLOWKD — RSV smoothed three times, no J line                          */
  /* ===================================================================== */
  R['SLOWKD'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 9 }, { k: 'p1', d: 3 }, { k: 'p2', d: 3 }, { k: 'p3', d: 5 }],
    series: [
      { k: 'K', type: 'line', color: '#FF8D1E' },
      { k: 'D', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 80, label: '80' }, { v: 50, label: '50' }, { v: 20, label: '20' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const rsv = rsvOf(d, H, p.n);
      const fastk = H.smma(rsv, p.p1, 1);
      const k = H.smma(fastk, p.p2, 1);
      const dd = H.smma(k, p.p3, 1);
      return { K: k, D: dd };
    }
  };

  /* ===================================================================== */
  /* STOCHRSI — a stochastic run over RSI instead of over price            */
  /* ===================================================================== */
  R['STOCHRSI'] = {
    pane: 'sub',
    params: [{ k: 'rsilen', d: 14 }, { k: 'stochlen', d: 14 }, { k: 'p1', d: 3 }, { k: 'p2', d: 3 }],
    series: [
      { k: 'K', type: 'line', color: '#0CAEE6' },
      { k: 'D', type: 'line', color: '#FF6B6B' }
    ],
    hlines: [{ v: 80, label: '80' }, { v: 50, label: '50' }, { v: 20, label: '20' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const rsi = rsiOf(H, d.c, p.rsilen);
      const lo = H.lowest(rsi, p.stochlen);
      const hi = H.highest(rsi, p.stochlen);
      const st = H.scale(H.div(H.sub(rsi, lo), H.sub(hi, lo)), 100);
      const k = H.sma(st, p.p1);
      const dd = H.sma(k, p.p2);
      return { K: k, D: dd };
    }
  };

  /* ===================================================================== */
  /* SRSI — "slow RSI": RSI logic applied to (close − EMA) instead of      */
  /*        to bar-to-bar change                                          */
  /* ===================================================================== */
  R['SRSI'] = {
    pane: 'sub',
    params: [{ k: 'el', d: 6 }, { k: 'rl', d: 14 }],
    series: [{ k: 'SLOW_RSI', type: 'line', color: '#C77DFF' }],
    hlines: [{ v: 80, label: 'OB 80' }, { v: 50, label: '50' }, { v: 20, label: 'OS 20' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const em = H.ema(d.c, p.el);
      const dev = H.sub(d.c, em);
      const up = H.map(dev, function (x) { return Math.max(x, 0); });
      const tot = H.abs(dev);
      return { SLOW_RSI: H.scale(H.div(H.sma(up, p.rl), H.sma(tot, p.rl)), 100) };
    }
  };

  /* ===================================================================== */
  /* CRSI — Connors RSI: RSI(3) + streak-RSI(2) + 100-bar ROC rank         */
  /* ===================================================================== */
  R['CRSI'] = {
    pane: 'sub',
    params: [{ k: 'n1', d: 3 }, { k: 'n2', d: 2 }, { k: 'n3', d: 100 }],
    series: [{ k: 'CRSI', type: 'line', color: '#4ECDC4' }],
    hlines: [{ v: 90, label: '90' }, { v: 50, label: '50' }, { v: 10, label: '10' }],
    range: [0, 100],
    calc: function (d, p, H) {
      // 1) short-term RSI of price
      const rsi1 = rsiOf(H, d.c, p.n1);

      // 2) percentile rank of the 1-bar return inside the last n3 returns.
      //    This is what the Python `(lod(ret, n3+1) - 1) / n3 * 100` computes.
      const ret = H.div(H.sub(d.c, H.ref(d.c, 1)), H.ref(d.c, 1));
      const rank = H.percentRank(ret, p.n3 + 1);

      // 3) up/down streak length, then RSI(2) of that streak.
      const ud = new Array(d.n).fill(null);
      let run = 0;
      for (let i = 0; i < d.n; i++) {
        if (i === 0) { ud[i] = 0; continue; }
        const diff = d.c[i] - d.c[i - 1];
        if (diff > 0) run = run > 0 ? run + 1 : 1;
        else if (diff < 0) run = run < 0 ? run - 1 : -1;
        else run = 0;
        ud[i] = run;
      }
      const rsi2 = rsiOf(H, ud, p.n2);

      return { CRSI: H.scale(H.add(H.add(rsi1, rank), rsi2), 1 / 3) };
    }
  };

  /* ===================================================================== */
  /* WMSR — Williams %R, plotted on the −100…0 scale                       */
  /* ===================================================================== */
  R['WMSR'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 14 }],
    series: [{ k: 'WMSR', type: 'line', color: '#0CAEE6' }],
    hlines: [{ v: -20, label: '-20' }, { v: -50, label: '-50' }, { v: -80, label: '-80' }],
    range: [-100, 0],
    calc: function (d, p, H) {
      const hh = H.highest(d.h, p.n);
      const ll = H.lowest(d.l, p.n);
      return { WMSR: H.scale(H.div(H.sub(hh, d.c), H.sub(hh, ll)), -100) };
    }
  };

  /* ===================================================================== */
  /* CCI — deviation from typical price, scaled by mean absolute deviation */
  /* ===================================================================== */
  R['CCI'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 14 }],
    series: [{ k: 'CCI', type: 'line', color: '#FF8D1E' }],
    hlines: [{ v: 100, label: '+100' }, { v: 0, label: '0' }, { v: -100, label: '-100' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const typ = H.hlc3(d);
      const ma = H.sma(typ, p.n);
      const ad = avedev(H, typ, p.n);
      return { CCI: H.div(H.sub(typ, ma), H.scale(ad, 0.015)) };
    }
  };

  /* ===================================================================== */
  /* CMO — Chande Momentum Oscillator, ±100 with no Wilder smoothing       */
  /* ===================================================================== */
  R['CMO'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 9 }],
    series: [{ k: 'CMO', type: 'line', color: '#7C9CFF' }],
    hlines: [{ v: 50, label: '+50' }, { v: 0, label: '0' }, { v: -50, label: '-50' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const diff = H.sub(d.c, H.ref(d.c, 1));
      const up = H.map(diff, function (x) { return Math.max(x, 0); });
      const dn = H.map(diff, function (x) { return Math.abs(Math.min(x, 0)); });
      const su = H.scale(H.sma(up, p.n), p.n);   // == rolling sum of up moves
      const sd = H.scale(H.sma(dn, p.n), p.n);   // == rolling sum of down moves
      return { CMO: H.scale(H.div(H.sub(su, sd), H.add(su, sd)), 100) };
    }
  };

  /* ===================================================================== */
  /* TSI — doubly EMA-smoothed momentum ratio                              */
  /* ===================================================================== */
  R['TSI'] = {
    pane: 'sub',
    params: [{ k: 'p1', d: 13 }, { k: 'p2', d: 25 }, { k: 'n', d: 13 }],
    series: [
      { k: 'TSI', type: 'line', color: '#0CAEE6' },
      { k: 'TSIMA', type: 'line', color: '#FF6B6B' }
    ],
    hlines: [{ v: 25, label: '+25' }, { v: 0, label: '0' }, { v: -25, label: '-25' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const pc = H.sub(d.c, H.ref(d.c, 1));
      const pcds = H.ema(H.ema(pc, p.p2), p.p1);
      const apcds = H.ema(H.ema(H.abs(pc), p.p2), p.p1);
      const tsi = H.scale(H.div(pcds, apcds), 100);
      return { TSI: tsi, TSIMA: H.ema(tsi, p.n) };
    }
  };

  /* ===================================================================== */
  /* MFI — RSI arithmetic applied to typical-price × volume                */
  /* ===================================================================== */
  R['MFI'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 14 }],
    series: [{ k: 'MFI', type: 'line', color: '#FF8D1E' }],
    hlines: [{ v: 80, label: '80' }, { v: 50, label: '50' }, { v: 20, label: '20' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const typ = H.hlc3(d);
      const pt = H.ref(typ, 1);
      const pos = new Array(d.n).fill(0);
      const neg = new Array(d.n).fill(0);
      for (let i = 0; i < d.n; i++) {
        if (!H.num(pt[i])) continue;
        const flow = typ[i] * d.v[i];
        if (typ[i] > pt[i]) pos[i] = flow;
        else if (typ[i] < pt[i]) neg[i] = flow;
      }
      const sp = H.sum(pos, p.n);
      const sn = H.sum(neg, p.n);
      const out = new Array(d.n).fill(null);
      for (let i = 0; i < d.n; i++) {
        if (!H.num(sp[i]) || !H.num(sn[i])) continue;
        if (sn[i] === 0) { out[i] = sp[i] > 0 ? 100 : null; continue; }
        const v1 = sp[i] / sn[i];
        out[i] = 100 - 100 / (1 + v1);
      }
      return { MFI: out };
    }
  };

  /* ===================================================================== */
  /* RVGI — (close−open) vigor normalised by (high−low) range              */
  /* ===================================================================== */
  R['RVGI'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 10 }],
    series: [
      { k: 'RVGI', type: 'line', color: '#9BE564' },
      { k: 'SIG', type: 'line', color: '#FF6B6B' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const co = H.sub(d.c, d.o);
      const hl = H.sub(d.h, d.l);
      const num = H.sma(swma4(H, co), p.n);
      const den = H.sma(swma4(H, hl), p.n);
      const rv = H.div(num, den);
      return { RVGI: rv, SIG: swma4(H, rv) };
    }
  };

  /* ===================================================================== */
  /* BOP — single-bar balance of power, (C−O)/(H−L)                        */
  /* ===================================================================== */
  R['BOP'] = {
    pane: 'sub',
    params: [],
    series: [{ k: 'BOP', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0.5, label: '+0.5' }, { v: 0, label: '0' }, { v: -0.5, label: '-0.5' }],
    range: [-1, 1],
    calc: function (d, p, H) {
      return { BOP: H.div(H.sub(d.c, d.o), H.sub(d.h, d.l)) };
    }
  };

  /* ===================================================================== */
  /* VRSI — the RSI construction applied to volume, not price              */
  /* ===================================================================== */
  R['VRSI'] = {
    pane: 'sub',
    params: [{ k: 'n1', d: 6 }, { k: 'n2', d: 12 }, { k: 'n3', d: 24 }],
    series: [
      { k: 'VRSI1', type: 'line', color: '#FF8D1E' },
      { k: 'VRSI2', type: 'line', color: '#0CAEE6' },
      { k: 'VRSI3', type: 'line', color: '#E970DC' }
    ],
    hlines: [{ v: 80, label: '80' }, { v: 50, label: '50' }, { v: 20, label: '20' }],
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        VRSI1: rsiOf(H, d.v, p.n1),
        VRSI2: rsiOf(H, d.v, p.n2),
        VRSI3: rsiOf(H, d.v, p.n3)
      };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_06_strength_b.js ---- */
/* =========================================================================
   reg_06_strength_b.js — strength batch B: momentum and bias family.
   ROC MTM OSC DPO BIAS B3612 DBCD SRDM RCI MASS VROC ADTM
   Every formula ported from technicals/strength/<ID>.py (BIAS lives in
   BAIS.py but declares indicator('BIAS', ...)).
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* --- ROC: percentage rate of change + its SMA ------------------------ */
  R['ROC'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 12 }, { k: 'm', d: 6 }],
    series: [
      { k: 'ROC', type: 'line', color: '#FF8D1E' },
      { k: 'ROCMA', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const prev = H.ref(d.c, p.n);
      const roc = H.scale(H.div(H.sub(d.c, prev), prev), 100);
      return { ROC: roc, ROCMA: H.sma(roc, p.m) };
    }
  };

  /* --- MTM: absolute n-bar price difference + its SMA ------------------ */
  R['MTM'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 12 }, { k: 'm', d: 6 }],
    series: [
      { k: 'MTM', type: 'line', color: '#0CAEE6' },
      { k: 'MTMMA', type: 'line', color: '#FF8D1E' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const mtm = H.sub(d.c, H.ref(d.c, p.n));
      return { MTM: mtm, MTMMA: H.sma(mtm, p.m) };
    }
  };

  /* --- OSC: 100 x (close - SMA(n)), EMA-smoothed ------------------------
     Note the literal ×100 in the Python: this is an absolute currency
     distance blown up a hundredfold, NOT a percentage.                   */
  R['OSC'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 20 }, { k: 'm', d: 6 }],
    series: [
      { k: 'OSC', type: 'line', color: '#0CAEE6' },
      { k: 'OSCEMA', type: 'line', color: '#FF8D1E' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const osc = H.scale(H.sub(d.c, H.sma(d.c, p.n)), 100);
      return { OSC: osc, OSCEMA: H.ema(osc, p.m) };
    }
  };

  /* --- DPO: close minus the MA displaced back n/2+1 bars ---------------- */
  R['DPO'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 20 }, { k: 'm', d: 6 }],
    series: [
      { k: 'DPO', type: 'line', color: '#FF8D1E' },
      { k: 'MADPO', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const maN = H.sma(d.c, p.n);
      const shift = Math.floor(p.n / 2) + 1;
      const dpo = H.sub(d.c, H.ref(maN, shift));
      return { DPO: dpo, MADPO: H.sma(dpo, p.m) };
    }
  };

  /* --- BIAS (乖离率): percentage distance from three SMAs --------------- */
  R['BIAS'] = {
    pane: 'sub',
    params: [{ k: 'n1', d: 6 }, { k: 'n2', d: 12 }, { k: 'n3', d: 24 }],
    series: [
      { k: 'BIAS1', type: 'line', color: '#0CAEE6' },
      { k: 'BIAS2', type: 'line', color: '#FF8D1E' },
      { k: 'BIAS3', type: 'line', color: '#E970DC' }
    ],
    hlines: [{ v: 6, label: '+6' }, { v: 0, label: '0' }, { v: -6, label: '-6' }],
    zeroBase: true,
    calc: function (d, p, H) {
      function bias(n) {
        const ma = H.sma(d.c, n);
        return H.scale(H.div(H.sub(d.c, ma), ma), 100);
      }
      return { BIAS1: bias(p.n1), BIAS2: bias(p.n2), BIAS3: bias(p.n3) };
    }
  };

  /* --- B3612: MA3-MA6 and MA6-MA12 spreads (absolute, not %) ----------- */
  R['B3612'] = {
    pane: 'sub',
    params: [{ k: 'n1', d: 3 }, { k: 'n2', d: 6 }, { k: 'n3', d: 12 }],
    series: [
      { k: 'B36', type: 'line', color: '#FF8D1E' },
      { k: 'B612', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const m1 = H.sma(d.c, p.n1), m2 = H.sma(d.c, p.n2), m3 = H.sma(d.c, p.n3);
      return { B36: H.sub(m1, m2), B612: H.sub(m2, m3) };
    }
  };

  /* --- DBCD: Wilder-smoothed change in the 5-bar bias ------------------
     bias here carries NO x100 factor, so DBCD lives in raw fractions.    */
  R['DBCD'] = {
    pane: 'sub',
    params: [{ k: 'p', d: 5 }, { k: 'n', d: 16 }, { k: 'w', d: 76 }],
    series: [
      { k: 'DBCD', type: 'line', color: '#FF8D1E' },
      { k: 'MM', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const ma = H.sma(d.c, p.p);
      const bias = H.div(H.sub(d.c, ma), ma);
      const dif = H.sub(bias, H.ref(bias, p.n));
      const dbcd = H.smma(dif, p.w, 1);
      return { DBCD: dbcd, MM: H.sma(dbcd, 5) };
    }
  };

  /* --- SRDM: DMI logic applied to high+low midpoint shifts -------------- */
  R['SRDM'] = {
    pane: 'sub',
    params: [{ k: 'p', d: 30 }],
    series: [
      { k: 'SRDM', type: 'line', color: '#FF8D1E' },
      { k: 'ASRDM', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0.5, label: '+0.5' }, { v: 0, label: '0' }, { v: -0.5, label: '-0.5' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const n = d.n;
      const dmz = new Array(n).fill(null);
      const dmf = new Array(n).fill(null);
      for (let i = 1; i < n; i++) {
        const hlSum = d.h[i] + d.l[i];
        const hlPrev = d.h[i - 1] + d.l[i - 1];
        const move = Math.max(Math.abs(d.h[i] - d.h[i - 1]), Math.abs(d.l[i] - d.l[i - 1]));
        dmz[i] = hlSum <= hlPrev ? 0 : move;
        dmf[i] = hlSum >= hlPrev ? 0 : move;
      }
      const admz = H.sma(dmz, 10);
      const admf = H.sma(dmf, 10);
      const srdm = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        const z = admz[i], f = admf[i];
        if (!H.num(z) || !H.num(f)) continue;
        if (z > f) srdm[i] = z === 0 ? null : (z - f) / z;
        else if (z === f) srdm[i] = 0;
        else srdm[i] = f === 0 ? null : (z - f) / f;
      }
      return { SRDM: srdm, ASRDM: H.smma(srdm, p.p, 1) };
    }
  };

  /* --- RCI: Spearman rank correlation of price rank vs time rank -------- */
  R['RCI'] = {
    pane: 'sub',
    params: [{ k: 'n1', d: 5 }, { k: 'n2', d: 25 }, { k: 'n3', d: 50 }],
    series: [
      { k: 'RCI1', type: 'line', color: '#FF8D1E' },
      { k: 'RCI2', type: 'line', color: '#0CAEE6' },
      { k: 'RCI3', type: 'line', color: '#E970DC' }
    ],
    hlines: [{ v: 80, label: '80' }, { v: 0, label: '0' }, { v: -80, label: '-80' }],
    range: [-100, 100],
    calc: function (d, p, H) {
      function rci(a, n) {
        n = Math.max(1, Math.round(n));
        const len = a.length, out = new Array(len).fill(null);
        const denom = n * (n * n - 1);
        if (denom === 0) return out;
        for (let i = n - 1; i < len; i++) {
          const w = new Array(n);
          let ok = true;
          for (let j = 0; j < n; j++) {
            const x = a[i - n + 1 + j];
            if (!H.num(x)) { ok = false; break; }
            w[j] = x;
          }
          if (!ok) continue;
          // Indices sorted by price, highest first — rank 1 = highest close.
          const idx = new Array(n);
          for (let j = 0; j < n; j++) idx[j] = j;
          idx.sort(function (x, y) { return w[y] - w[x]; });
          const pr = new Array(n);
          let k = 0;
          while (k < n) {
            let e = k;
            while (e + 1 < n && w[idx[e + 1]] === w[idx[k]]) e++;
            const avg = (k + e) / 2 + 1;          // mean rank across the tie group
            for (let q = k; q <= e; q++) pr[idx[q]] = avg;
            k = e + 1;
          }
          let sd = 0;
          for (let j = 0; j < n; j++) {
            // time rank: newest bar (j = n-1) gets 1, oldest gets n
            const dd = pr[j] - (n - j);
            sd += dd * dd;
          }
          out[i] = (1 - 6 * sd / denom) * 100;
        }
        return out;
      }
      return { RCI1: rci(d.c, p.n1), RCI2: rci(d.c, p.n2), RCI3: rci(d.c, p.n3) };
    }
  };

  /* --- MASS: Donchian's Mass Index (m-bar sum of EMA1/EMA2) ------------
     With the default m = 10 the line oscillates around 10, not around the
     textbook 25-bar value of ~25.                                        */
  R['MASS'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 9 }, { k: 'm', d: 10 }],
    series: [{ k: 'MI', type: 'line', color: '#0CAEE6' }],
    hlines: [{ v: 10, label: '10 (neutral)' }, { v: 10.8, label: '10.8 (bulge)' }],
    calc: function (d, p, H) {
      const span = H.sub(d.h, d.l);
      const e1 = H.ema(span, p.n);
      const e2 = H.ema(e1, p.n);
      return { MI: H.sum(H.div(e1, e2), p.m) };
    }
  };

  /* --- VROC: percentage rate of change of volume ------------------------ */
  R['VROC'] = {
    pane: 'sub',
    params: [{ k: 'm', d: 12 }],
    series: [{ k: 'VROC', type: 'line', color: '#FF8D1E' }],
    hlines: [{ v: 100, label: '+100%' }, { v: 0, label: '0' }, { v: -50, label: '-50%' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const prev = H.ref(d.v, p.m);
      return { VROC: H.scale(H.div(H.sub(d.v, prev), prev), 100) };
    }
  };

  /* --- ADTM (动态买卖气): open-anchored up/down thrust, normalised ------ */
  R['ADTM'] = {
    pane: 'sub',
    params: [{ k: 'p', d: 23 }, { k: 'n', d: 8 }],
    series: [
      { k: 'ADTM', type: 'line', color: '#FF8D1E' },
      { k: 'ADTM_MA', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0.5, label: '+0.5' }, { v: 0, label: '0' }, { v: -0.5, label: '-0.5' }],
    range: [-1, 1],
    calc: function (d, p, H) {
      const n = d.n;
      const dtm = new Array(n).fill(null);
      const dbm = new Array(n).fill(null);
      for (let i = 1; i < n; i++) {
        const o = d.o[i], op = d.o[i - 1];
        dtm[i] = o <= op ? 0 : Math.max(d.h[i] - o, o - op);
        dbm[i] = o >= op ? 0 : Math.max(o - d.l[i], o - op);
      }
      const stm = H.sum(dtm, p.p);
      const sbm = H.sum(dbm, p.p);
      const adtm = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        const a = stm[i], b = sbm[i];
        if (!H.num(a) || !H.num(b)) continue;
        if (a > b) adtm[i] = a === 0 ? null : (a - b) / a;
        else if (a === b) adtm[i] = 0;
        else adtm[i] = b === 0 ? null : (a - b) / b;
      }
      return { ADTM: adtm, ADTM_MA: H.sma(adtm, p.n) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_07_pressure.js ---- */
/* =========================================================================
   reg_07_pressure.js — channels, envelopes and pivot level systems
   (category: pressure_support)

   BBIBOLL  BBW  CDP  CKS  DC  ENE  KC  MIKE  PPSW

   Ported from technicals/pressure_support/<ID>.py. Where the platform DSL
   and the textbook disagree, the .py file wins — deviations are noted
   inline. BOLL itself lives in reg_00_skeleton.js and is not redefined here.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* =======================================================================
     BBIBOLL — Bullish-Bear Bollinger
     Python: bbi = (SMA3 + SMA6 + SMA12 + SMA24) / 4
             upr = bbi + m * bbi.std(n);  dwn = bbi - m * bbi.std(n)
     Note `.std()` (sample, n−1) here — NOT `.stdp()` as plain BOLL uses.
     The default multiplier is 6, not 2: σ of the already four-times-smoothed
     BBI is tiny, so a large multiplier is needed to produce a usable band.
     ======================================================================= */
  R['BBIBOLL'] = {
    pane: 'main',
    params: [{ k: 'n', d: 11 }, { k: 'm', d: 6 }],
    series: [
      { k: 'UPR', type: 'line', color: '#FFC90E' },
      { k: 'BBIBOLL', type: 'line', color: '#E970DC', width: 1.6 },
      { k: 'DWN', type: 'line', color: '#0CAEE6', fillTo: 'UPR', fill: 'rgba(12,174,230,0.07)' }
    ],
    calc: function (d, p, H) {
      const bbi = H.scale(
        H.add(H.add(H.sma(d.c, 3), H.sma(d.c, 6)),
              H.add(H.sma(d.c, 12), H.sma(d.c, 24))), 0.25);
      const sd = H.std(bbi, p.n);
      return {
        BBIBOLL: bbi,
        UPR: H.add(bbi, H.scale(sd, p.m)),
        DWN: H.sub(bbi, H.scale(sd, p.m))
      };
    }
  };

  /* =======================================================================
     BBW — Bollinger Band Width  (the one sub-chart in this batch)
     Python: dis = stdp(C, sd); mid = SMA(C, sd)
             BBW = ((mid + w·dis) − (mid − w·dis)) / mid = 2·w·dis / mid
     A pure ratio, so it is comparable across instruments and across time.
     ======================================================================= */
  R['BBW'] = {
    pane: 'sub',
    params: [{ k: 'sd', d: 20 }, { k: 'width', d: 2, step: 0.1 }],
    series: [{ k: 'BBW', type: 'line', color: '#FF8D1E', width: 1.5 }],
    zeroBase: true,
    calc: function (d, p, H) {
      const dis = H.stdp(d.c, p.sd);
      const mid = H.sma(d.c, p.sd);
      return { BBW: H.div(H.scale(dis, 2 * p.width), mid) };
    }
  };

  /* =======================================================================
     CDP — Contrarian Direction Predictor (逆势操作系统)
     Everything is built from the PREVIOUS bar, so each level is a flat step
     that holds for exactly one bar — that is the design, not a bug.
       CH = H₋₁, CL = L₋₁, CC = C₋₁
       CDP = (CH + CL + CC) / 3
       AH  = CDP + (CH − CL)        AL = CDP − (CH − CL)
       NH  = 2·CDP − CL             NL = 2·CDP − CH
     ======================================================================= */
  R['CDP'] = {
    pane: 'main',
    params: [],
    series: [
      { k: 'AH', type: 'line', color: '#FF6B6B', width: 1 },
      { k: 'NH', type: 'line', color: '#FFC90E', width: 1 },
      { k: 'CDP', type: 'line', color: '#E970DC', width: 1.6 },
      { k: 'NL', type: 'line', color: '#4ECDC4', width: 1 },
      { k: 'AL', type: 'line', color: '#0CAEE6', width: 1 }
    ],
    calc: function (d, p, H) {
      const ch = H.ref(d.h, 1), cl = H.ref(d.l, 1), cc = H.ref(d.c, 1);
      const cdp = H.scale(H.add(H.add(ch, cl), cc), 1 / 3);
      const rng = H.sub(ch, cl);
      return {
        CDP: cdp,
        AH: H.add(cdp, rng),
        AL: H.sub(cdp, rng),
        NH: H.sub(H.scale(cdp, 2), cl),
        NL: H.sub(H.scale(cdp, 2), ch)
      };
    }
  };

  /* =======================================================================
     CKS — Chande Kroll Stop
     Python: atr1 = SMMA(TR, p)                       ← Wilder smoothing
             firstHighStop = HHV(H, p) − x·atr1
             firstLowStop  = LLV(L, p) + x·atr1
             STOP_SHORT = HHV(firstHighStop, q)
             STOP_LONG  = LLV(firstLowStop,  q)
     The second HHV/LLV pass is what makes the stops ratchet rather than
     jitter. Two independent stop rails, so no envelope fill.
     ======================================================================= */
  R['CKS'] = {
    pane: 'main',
    params: [{ k: 'p', d: 10 }, { k: 'q', d: 9 }, { k: 'x', d: 1, step: 0.1 }],
    series: [
      { k: 'STOP_SHORT', type: 'line', color: '#FF8D1E', width: 1.4 },
      { k: 'STOP_LONG', type: 'line', color: '#0CAEE6', width: 1.4 }
    ],
    calc: function (d, p, H) {
      const atr1 = H.smma(H.tr(d), p.p, 1);
      const firstHigh = H.sub(H.highest(d.h, p.p), H.scale(atr1, p.x));
      const firstLow = H.add(H.lowest(d.l, p.p), H.scale(atr1, p.x));
      return {
        STOP_SHORT: H.highest(firstHigh, p.q),
        STOP_LONG: H.lowest(firstLow, p.q)
      };
    }
  };

  /* =======================================================================
     DC — Donchian Channel
     UP = HHV(H, n);  DOWN = LLV(L, n);  MIDDLE = (UP + DOWN) / 2
     No smoothing, no statistics — literally the extreme of the last n bars.
     ======================================================================= */
  R['DC'] = {
    pane: 'main',
    params: [{ k: 'n', d: 20 }],
    series: [
      { k: 'UP', type: 'line', color: '#0CAEE6' },
      { k: 'MIDDLE', type: 'line', color: '#FFC90E', dash: [4, 3] },
      { k: 'DOWN', type: 'line', color: '#0CAEE6', fillTo: 'UP', fill: 'rgba(12,174,230,0.07)' }
    ],
    calc: function (d, p, H) {
      const up = H.highest(d.h, p.n);
      const dn = H.lowest(d.l, p.n);
      return { UP: up, DOWN: dn, MIDDLE: H.scale(H.add(up, dn), 0.5) };
    }
  };

  /* =======================================================================
     ENE — Moving Average Envelopes
     Python: ma = SMA(C, m)
             UPPER = (1 + m1/100)·ma      ← m1 = 11 by default
             LOWER = (1 − m2/100)·ma      ← m2 = 9  by default
             ENE   = (UPPER + LOWER) / 2  ← NOT the raw MA; the asymmetric
                                            defaults tilt the midline up.
     ======================================================================= */
  R['ENE'] = {
    pane: 'main',
    params: [{ k: 'm1', d: 11 }, { k: 'm2', d: 9 }, { k: 'm', d: 10 }],
    series: [
      { k: 'UPPER', type: 'line', color: '#FF6B6B' },
      { k: 'ENE', type: 'line', color: '#FFC90E', width: 1.6 },
      { k: 'LOWER', type: 'line', color: '#9BE564', fillTo: 'UPPER', fill: 'rgba(155,229,100,0.07)' }
    ],
    calc: function (d, p, H) {
      const ma = H.sma(d.c, p.m);
      const upper = H.scale(ma, 1 + p.m1 / 100);
      const lower = H.scale(ma, 1 - p.m2 / 100);
      return { UPPER: upper, LOWER: lower, ENE: H.scale(H.add(upper, lower), 0.5) };
    }
  };

  /* =======================================================================
     KC — Keltner Channel
     Python: ML = EMA(C, p1)
             TR = max(H−L, |C₋₁−H|, |C₋₁−L|)
             ATR = SMA(TR, m)              ← simple average, NOT Wilder
             UB = ML + 2·ATR;  LB = ML − 2·ATR   ← multiplier hardcoded at 2
     Volatility measured from the true range rather than from σ of closes,
     which is why KC keeps expanding through a gap where BOLL over-reacts.
     ======================================================================= */
  R['KC'] = {
    pane: 'main',
    params: [{ k: 'p1', d: 20 }, { k: 'm', d: 14 }],
    series: [
      { k: 'UB', type: 'line', color: '#4ECDC4' },
      { k: 'ML', type: 'line', color: '#FFC90E', width: 1.6 },
      { k: 'LB', type: 'line', color: '#4ECDC4', fillTo: 'UB', fill: 'rgba(78,205,196,0.08)' }
    ],
    calc: function (d, p, H) {
      const ml = H.ema(d.c, p.p1);
      const atr1 = H.sma(H.tr(d), p.m);
      return {
        ML: ml,
        UB: H.add(ml, H.scale(atr1, 2)),
        LB: H.sub(ml, H.scale(atr1, 2))
      };
    }
  };

  /* =======================================================================
     MIKE — MIKE Base (麦克支撑压力)
     TYP = (H + L + C) / 3;  HH = HHV(H, m);  LL = LLV(L, m)
       WR = TYP + (TYP − LL)      WS = TYP − (HH − TYP)
       MR = TYP + (HH − LL)       MS = TYP − (HH − LL)
       SR = 2·HH − LL             SS = 2·LL − HH
     Six lines, three pressure and three support, at "weak/medium/strong"
     distances. No fill — the outer pair spans far more than the trading range.
     ======================================================================= */
  R['MIKE'] = {
    pane: 'main',
    params: [{ k: 'm', d: 12 }],
    series: [
      { k: 'SR', type: 'line', color: '#FF6B6B', width: 1 },
      { k: 'MR', type: 'line', color: '#FF8D1E', width: 1 },
      { k: 'WR', type: 'line', color: '#FFC90E', width: 1 },
      { k: 'WS', type: 'line', color: '#9BE564', width: 1 },
      { k: 'MS', type: 'line', color: '#4ECDC4', width: 1 },
      { k: 'SS', type: 'line', color: '#0CAEE6', width: 1 }
    ],
    calc: function (d, p, H) {
      const typ = H.hlc3(d);
      const hh = H.highest(d.h, p.m);
      const ll = H.lowest(d.l, p.m);
      const span = H.sub(hh, ll);
      return {
        WR: H.sub(H.scale(typ, 2), ll),
        MR: H.add(typ, span),
        SR: H.sub(H.scale(hh, 2), ll),
        WS: H.sub(H.scale(typ, 2), hh),
        MS: H.sub(typ, span),
        SS: H.sub(H.scale(ll, 2), hh)
      };
    }
  };

  /* =======================================================================
     PPSW — Pivot Points Standard, Woodie variant
     The Python source resolves the aggregation window from the chart's bar
     type via W_RANGE_DICT (K_DAY → 5, i.e. one trading week). We have no
     period() here, so `w` is exposed as a parameter defaulting to that same
     5 and the higher-timeframe candle is rebuilt as a ROLLING window:
       wH = HHV(H, w), wL = LLV(L, w), wO = O[w−1 bars ago]  ← window open
     then, exactly as the source has it (prior window's range, current open):
       PP = (wH₋₁ + wL₋₁ + 2·wO) / 4          ← Woodie double-weights the open
       R1 = 2·PP − wL₋₁        S1 = 2·PP − wH₋₁
       R2 = PP + (wH₋₁ − wL₋₁) S2 = PP − (wH₋₁ − wL₋₁)
       R3 = wH₋₁ + 2·(PP − wL₋₁)
       S3 = wL₋₁ − 2·(wH₋₁ − PP)
       R4 = R3 + (wH₋₁ − wL₋₁) S4 = S3 − (wH₋₁ − wL₋₁)
     ======================================================================= */
  R['PPSW'] = {
    pane: 'main',
    params: [{ k: 'w', d: 5 }],
    series: [
      { k: 'R4', type: 'line', color: '#C77DFF', width: 1 },
      { k: 'R3', type: 'line', color: '#FF6B6B', width: 1 },
      { k: 'R2', type: 'line', color: '#FF8D1E', width: 1 },
      { k: 'R1', type: 'line', color: '#FFC90E', width: 1 },
      { k: 'PP', type: 'line', color: '#E970DC', width: 1.8 },
      { k: 'S1', type: 'line', color: '#9BE564', width: 1 },
      { k: 'S2', type: 'line', color: '#4ECDC4', width: 1 },
      { k: 'S3', type: 'line', color: '#0CAEE6', width: 1 },
      { k: 'S4', type: 'line', color: '#7C9CFF', width: 1 }
    ],
    calc: function (d, p, H) {
      const w = Math.max(1, Math.round(p.w));
      const wh1 = H.ref(H.highest(d.h, w), 1);
      const wl1 = H.ref(H.lowest(d.l, w), 1);
      const wo = H.ref(d.o, w - 1);
      const pp = H.scale(H.add(H.add(wh1, wl1), H.scale(wo, 2)), 0.25);
      const span = H.sub(wh1, wl1);
      const r3 = H.add(wh1, H.scale(H.sub(pp, wl1), 2));
      const s3 = H.sub(wl1, H.scale(H.sub(wh1, pp), 2));
      return {
        PP: pp,
        R1: H.sub(H.scale(pp, 2), wl1),
        S1: H.sub(H.scale(pp, 2), wh1),
        R2: H.add(pp, span),
        S2: H.sub(pp, span),
        R3: r3,
        S3: s3,
        R4: H.add(r3, span),
        S4: H.sub(s3, span)
      };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_08_pv_volume.js ---- */
/* =========================================================================
   reg_08_pv_volume.js — raw volume and turnover family
   VOL MAVOL AVGVOL NVOL RVOL VSTD VOSC AMOUNT TOR VOLTDX PER

   Ported from technicals/price_volume/<ID>.py. Everything here except TOR
   and PER is pure OHLCV arithmetic. TOR needs shares outstanding and PER
   needs trailing earnings — neither exists in an OHLCV bar, so those two
   carry simulated:true with their own H.synth keys.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* --- VOL: raw volume, split up/down so the histogram is readable ------
     vola() plotted as Line.histogram. A signed colourBy is meaningless on a
     strictly positive series, so the bar is routed into an "up" or a "down"
     series by the sign of the close-to-close change instead.               */
  R['VOL'] = {
    pane: 'sub',
    params: [],
    series: [
      { k: 'VOLUP', type: 'hist', color: '#9BE564' },
      { k: 'VOLDN', type: 'hist', color: '#FF6B6B' }
    ],
    // zeroBase is REQUIRED on every volume/turnover histogram in this file.
    // A registry sub-pane is kind:'ind' in chart.js, so its y-range comes from
    // the generic branch: without zeroBase the pane floor becomes min(series)
    // and drawHist() bases the bars there. A 0.77m bar next to a 2.69m bar
    // would then render in roughly a 1:13 ratio instead of the true 1:3.5 —
    // a truncated-axis histogram, which is exactly the misreading this page
    // teaches against. Volume bars must be measured from zero.
    zeroBase: true,
    calc: function (d, p, H) {
      const up = new Array(d.n).fill(null);
      const dn = new Array(d.n).fill(null);
      for (let i = 0; i < d.n; i++) {
        const prev = i > 0 ? d.c[i - 1] : d.o[i];
        if (!H.num(d.v[i]) || !H.num(prev)) continue;
        if (d.c[i] >= prev) up[i] = d.v[i]; else dn[i] = d.v[i];
      }
      return { VOLUP: up, VOLDN: dn };
    }
  };

  /* --- MAVOL: volume histogram + three simple volume averages ----------- */
  R['MAVOL'] = {
    pane: 'sub',
    params: [{ k: 'n1', d: 5 }, { k: 'n2', d: 10 }, { k: 'n3', d: 20 }],
    series: [
      { k: 'VOLA', type: 'hist', color: '#7C9CFF' },
      { k: 'MAVOL1', type: 'line', color: '#FF8D1E' },
      { k: 'MAVOL2', type: 'line', color: '#0CAEE6' },
      { k: 'MAVOL3', type: 'line', color: '#E970DC' }
    ],
    zeroBase: true,               // see VOL — histogram must be measured from 0
    calc: function (d, p, H) {
      return {
        VOLA: d.v.slice(),
        MAVOL1: H.sma(d.v, p.n1),
        MAVOL2: H.sma(d.v, p.n2),
        MAVOL3: H.sma(d.v, p.n3)
      };
    }
  };

  /* --- AVGVOL: SMA of volume EXCLUDING the current bar ------------------
     Python: vol().ref(1).sma(n) — the average the current bar is measured
     against, so today's own volume cannot inflate its own benchmark.       */
  R['AVGVOL'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 50 }],
    series: [
      { k: 'VOL', type: 'hist', color: '#7C9CFF' },
      { k: 'VOLUMEAVG', type: 'line', color: '#FF8D1E' }
    ],
    zeroBase: true,               // see VOL — histogram must be measured from 0
    calc: function (d, p, H) {
      return { VOL: d.v.slice(), VOLUMEAVG: H.sma(H.ref(d.v, 1), p.n) };
    }
  };

  /* --- NVOL: signed volume ---------------------------------------------
     sign(C − C₋₁) × V. Naturally signed, so colourBy:'sign' is correct.    */
  R['NVOL'] = {
    pane: 'sub',
    params: [],
    series: [{ k: 'NVOL', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const ch = H.sub(d.c, H.ref(d.c, 1));
      const sgn = H.map(ch, function (x) { return x > 0 ? 1 : (x < 0 ? -1 : 0); });
      return { NVOL: H.mul(sgn, d.v) };
    }
  };

  /* --- RVOL: today's volume as a multiple of the prior n-bar average ---- */
  R['RVOL'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 14 }],
    series: [{ k: 'RVOL', type: 'line', color: '#0CAEE6' }],
    hlines: [{ v: 2, label: '2.0' }, { v: 1, label: '1.0' }, { v: 0.5, label: '0.5' }],
    calc: function (d, p, H) {
      return { RVOL: H.div(d.v, H.sma(H.ref(d.v, 1), p.n)) };
    }
  };

  /* --- VSTD: sample standard deviation of volume ------------------------
     Python uses .std() (sample, n−1), not .stdp().                          */
  R['VSTD'] = {
    pane: 'sub',
    params: [{ k: 'm', d: 10 }],
    series: [{ k: 'VSTD', type: 'line', color: '#FF8D1E' }],
    zeroBase: true,
    calc: function (d, p, H) {
      return { VSTD: H.std(d.v, p.m) };
    }
  };

  /* --- VOSC: volume oscillator -----------------------------------------
     Note the source normalises by the SHORT average, not the long one:
     (MA_s − MA_l) / MA_s × 100. Ported literally.                          */
  R['VOSC'] = {
    pane: 'sub',
    params: [{ k: 'short', d: 12 }, { k: 'long', d: 26 }],
    series: [{ k: 'VOSC', type: 'line', color: '#FF8D1E' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const ms = H.sma(d.v, p.short);
      const ml = H.sma(d.v, p.long);
      return { VOSC: H.scale(H.div(H.sub(ms, ml), ms), 100) };
    }
  };

  /* --- AMOUNT: cash turnover ------------------------------------------
     amount() is exchange-reported value traded. Reconstructed as
     close × volume, which is genuine arithmetic on the bar (it differs from
     the true figure only by intrabar VWAP-vs-close drift).                 */
  R['AMOUNT'] = {
    pane: 'sub',
    params: [{ k: 'ma', d: 20 }],
    series: [
      { k: 'AMOUNT', type: 'hist', color: '#4ECDC4' },
      { k: 'MAAMT', type: 'line', color: '#FF8D1E' }
    ],
    zeroBase: true,               // see VOL — histogram must be measured from 0
    calc: function (d, p, H) {
      const amt = H.mul(d.c, d.v);
      return { AMOUNT: amt, MAAMT: H.sma(amt, p.ma) };
    }
  };

  /* --- TOR: turnover ratio (%) -----------------------------------------
     turnover_rate() × 100 = volume / free-float shares. Free float is a
     corporate-action figure, not price data, so the denominator is a
     slow synthetic share count and the pair is flagged simulated.          */
  R['TOR'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 5 }],
    series: [
      { k: 'TOR', type: 'line', color: '#0CAEE6' },
      { k: 'MATOR', type: 'line', color: '#FF8D1E' }
    ],
    hlines: [{ v: 3, label: '3%' }, { v: 1, label: '1%' }],
    calc: function (d, p, H) {
      // Free float drifts slowly (buybacks, placements, lock-up releases).
      const wob = H.synth(d.n, 'TOR_FLOAT_SHARES', { lo: 0.88, hi: 1.14, persistence: 0.985 });
      const flt = H.map(wob, function (x) { return 6.0e7 * x; });
      const tor = H.scale(H.div(d.v, flt), 100);
      return { TOR: tor, MATOR: H.sma(tor, p.ma) };
    }
  };

  /* --- VOLTDX: TDX "virtual volume" ------------------------------------
     voltdx() extrapolates the partially-filled bar to a full session:
     VVOL = V_sofar × (T + 3) / (t + 3), and plot_stickline gates it on
     curr_bars_count(vol()) == 0 — i.e. the bar currently forming ONLY.
     On any closed historical candle the gate is false and the projection
     factor is 1, so what remains on screen is exactly the volume histogram
     plus two volume MAs. That is what is plotted here; inventing a
     mid-session elapsed time for closed bars would draw a fiction.         */
  R['VOLTDX'] = {
    pane: 'sub',
    params: [{ k: 'm1', d: 5 }, { k: 'm2', d: 10 }],
    series: [
      { k: 'VOL', type: 'hist', color: '#7C9CFF' },
      { k: 'MAVOL1', type: 'line', color: '#4ECDC4' },
      { k: 'MAVOL2', type: 'line', color: '#FFC90E' }
    ],
    zeroBase: true,               // see VOL — histogram must be measured from 0
    calc: function (d, p, H) {
      return {
        VOL: d.v.slice(),
        MAVOL1: H.sma(d.v, p.m1),
        MAVOL2: H.sma(d.v, p.m2)
      };
    }
  };

  /* --- PER: price / trailing earnings ----------------------------------
     pe_ratio() needs reported EPS, which no OHLCV feed carries. Price is
     real; the earnings denominator is a slow synthetic series that steps
     like a quarterly reporting cycle. Flagged simulated.                   */
  R['PER'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 60 }],
    series: [
      { k: 'PE', type: 'line', color: '#C77DFF' },
      { k: 'MAPE', type: 'line', color: '#FF8D1E', dash: [4, 3] }
    ],
    hlines: [{ v: 40, label: '40×' }, { v: 25, label: '25×' }],
    calc: function (d, p, H) {
      const wob = H.synth(d.n, 'PER_TTM_EPS', { lo: 0.78, hi: 1.30, persistence: 0.99 });
      const eps = H.map(wob, function (x) { return 5.0 * x; });
      const pe = H.div(d.c, eps);
      return { PE: pe, MAPE: H.sma(pe, p.ma) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_09_pv_flow.js ---- */
/* =========================================================================
   reg_09_pv_flow.js — price/volume interaction batch
   OBV VWAP VWAP_BAND EFI KO WVAD CR ARBR PSY VR CYC

   Notes on the ports
   ------------------
   * The platform DSL exposes `amount()` / `total_amount()` (turnover in
     currency). Our dummy feed carries only OHLCV, so turnover is
     reconstructed as hlc3 x volume — the standard proxy. VWAP therefore
     reduces to the textbook anchored form  Σ(hlc3·V) / Σ(V).
   * CYC's `capital()` (free-float share count) is not available either.
     It enters the formula only as a scale constant inside the turnover
     weight, so it is exposed as a user parameter `turn` (assumed average
     daily turnover, in percent) instead of being faked.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* ---- shared: turnover proxy + anchored VWAP ------------------------- */
  function amountOf(d, H) { return H.mul(H.hlc3(d), d.v); }

  function anchoredVWAP(d, H, resetEvery) {
    const tp = H.hlc3(d);
    const out = new Array(d.n).fill(null);
    const reset = Math.max(0, Math.round(resetEvery || 0));
    let cp = 0, cv = 0;
    for (let i = 0; i < d.n; i++) {
      if (reset > 0 && i % reset === 0) { cp = 0; cv = 0; }
      const v = H.num(d.v[i]) ? d.v[i] : 0;
      if (H.num(tp[i])) { cp += tp[i] * v; cv += v; }
      out[i] = cv > 0 ? cp / cv : null;
    }
    return out;
  }

  /* =====================================================================
     OBV — On Balance Volume
     va   = V on an up close, −V on a down close, 0 on an unchanged close
     OBV  = running total of va
     ===================================================================== */
  R['OBV'] = {
    pane: 'sub',
    params: [{ k: 'm', d: 30 }],
    series: [
      { k: 'OBV', type: 'line', color: '#FFC90E', width: 1.6 },
      { k: 'OBVMA', type: 'line', color: '#7C9CFF', dash: [4, 3] }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const lc = H.ref(d.c, 1);
      const va = new Array(d.n).fill(0);
      for (let i = 0; i < d.n; i++) {
        const prev = lc[i];
        if (!H.num(prev) || !H.num(d.v[i])) { va[i] = 0; continue; }
        va[i] = d.c[i] > prev ? d.v[i] : (d.c[i] < prev ? -d.v[i] : 0);
      }
      const obv = H.cum(va);
      return { OBV: obv, OBVMA: H.sma(obv, p.m) };
    }
  };

  /* =====================================================================
     VWAP — Volume Weighted Average Price (anchored)
     VWAP = Σ(hlc3 × V) / Σ(V)     accumulated from the anchor bar
     anchor = k → restart the accumulator every k bars (a "session"; 20 on
                  daily bars ≈ one month, on intraday bars = one session)
     anchor = 0 → never reset: the classic anchored VWAP from inception
     ===================================================================== */
  R['VWAP'] = {
    pane: 'main',
    params: [{ k: 'anchor', d: 20 }],
    series: [{ k: 'VWAP', type: 'line', color: '#FFC90E', width: 1.8 }],
    calc: function (d, p, H) {
      return { VWAP: anchoredVWAP(d, H, p.anchor) };
    }
  };

  /* =====================================================================
     VWAP_BAND — anchored VWAP ± k·σ(hlc3)
     σ = population stdev of hlc3 over `sd` bars
     ===================================================================== */
  R['VWAP_BAND'] = {
    pane: 'main',
    params: [
      { k: 'sd', d: 20 },
      { k: 'mult1', d: 1, step: 0.1 },
      { k: 'mult2', d: 2, step: 0.1 },
      { k: 'anchor', d: 20 }
    ],
    series: [
      { k: 'UB2', type: 'line', color: '#E970DC' },
      { k: 'UB1', type: 'line', color: '#FF8D1E', dash: [4, 3] },
      { k: 'VWAP', type: 'line', color: '#FFC90E', width: 1.8 },
      { k: 'LB1', type: 'line', color: '#0CAEE6', dash: [4, 3] },
      { k: 'LB2', type: 'line', color: '#7C9CFF', fillTo: 'UB2', fill: 'rgba(124,156,255,0.08)' }
    ],
    calc: function (d, p, H) {
      const vwap = anchoredVWAP(d, H, p.anchor);
      const sigma = H.stdp(H.hlc3(d), p.sd);
      return {
        VWAP: vwap,
        UB1: H.add(vwap, H.scale(sigma, p.mult1)),
        LB1: H.sub(vwap, H.scale(sigma, p.mult1)),
        UB2: H.add(vwap, H.scale(sigma, p.mult2)),
        LB2: H.sub(vwap, H.scale(sigma, p.mult2))
      };
    }
  };

  /* =====================================================================
     EFI — Elder's Force Index
     raw = (C − C₋₁) × V ;  EFI = EMA(raw, n)
     ===================================================================== */
  R['EFI'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 13 }],
    series: [{ k: 'EFI', type: 'line', color: '#FF6B6B', width: 1.5 }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const raw = H.mul(H.change(d.c, 1), d.v);
      return { EFI: H.ema(raw, p.n) };
    }
  };

  /* =====================================================================
     KO — Klinger Oscillator (simplified volume-force variant)
     VF  = +V when hlc3 ≥ hlc3₋₁ else −V
     KVO = EMA(VF, n1) − EMA(VF, n2) ;  SIG = EMA(KVO, n3)
     ===================================================================== */
  R['KO'] = {
    pane: 'sub',
    params: [{ k: 'n1', d: 34 }, { k: 'n2', d: 55 }, { k: 'n3', d: 13 }],
    series: [
      { k: 'KVO', type: 'line', color: '#0CAEE6', width: 1.5 },
      { k: 'SIG', type: 'line', color: '#9BE564' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const tp = H.hlc3(d);
      const ptp = H.ref(tp, 1);
      const vf = new Array(d.n).fill(null);
      for (let i = 0; i < d.n; i++) {
        if (!H.num(ptp[i]) || !H.num(d.v[i])) continue;
        vf[i] = tp[i] >= ptp[i] ? d.v[i] : -d.v[i];
      }
      const kvo = H.sub(H.ema(vf, p.n1), H.ema(vf, p.n2));
      return { KVO: kvo, SIG: H.ema(kvo, p.n3) };
    }
  };

  /* =====================================================================
     WVAD — Williams' Variable Accumulation Distribution
     WVAD = (C − O) / (H − L) × V        (raw, unsmoothed, as in source)
     ===================================================================== */
  R['WVAD'] = {
    pane: 'sub',
    params: [],
    series: [{ k: 'WVAD', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const body = H.sub(d.c, d.o);
      const range = H.sub(d.h, d.l);
      return { WVAD: H.mul(H.div(body, range), d.v) };
    }
  };

  /* =====================================================================
     CR — CR energy indicator
     MID = REF((H+L+C)/3, 1)
     CR  = Σ max(0, H − MID) / Σ max(0, MID − L) × 100     over n bars
     CRMAk = REF(SMA(CR, mk), floor(mk / 2.5) + 1)          ← displaced MAs
     ===================================================================== */
  R['CR'] = {
    pane: 'sub',
    params: [
      { k: 'n', d: 26 },
      { k: 'm1', d: 5 }, { k: 'm2', d: 10 }, { k: 'm3', d: 20 }, { k: 'm4', d: 60 }
    ],
    series: [
      { k: 'CR', type: 'line', color: '#FF8D1E', width: 1.6 },
      { k: 'CRMA1', type: 'line', color: '#E970DC' },
      { k: 'CRMA2', type: 'line', color: '#FFC90E' },
      { k: 'CRMA3', type: 'line', color: '#0CAEE6' },
      { k: 'CRMA4', type: 'line', color: '#9BE564' }
    ],
    // Python plots 50/80/150/200/300/400. 400 is omitted deliberately: the
    // pane's y-range folds in every hline (see the renderer), so a level no
    // real CR reading reaches would squash the line into the bottom third.
    hlines: [
      { v: 50, label: '50' }, { v: 80, label: '80' },
      { v: 150, label: '150' }, { v: 200, label: '200' }, { v: 300, label: '300' }
    ],
    calc: function (d, p, H) {
      const mid = H.ref(H.hlc3(d), 1);
      const up = H.map(H.sub(d.h, mid), function (x) { return Math.max(0, x); });
      const dn = H.map(H.sub(mid, d.l), function (x) { return Math.max(0, x); });
      const cr = H.scale(H.div(H.sum(up, p.n), H.sum(dn, p.n)), 100);
      function disp(m) {
        return H.ref(H.sma(cr, m), Math.floor(m / 2.5) + 1);
      }
      return {
        CR: cr,
        CRMA1: disp(p.m1), CRMA2: disp(p.m2),
        CRMA3: disp(p.m3), CRMA4: disp(p.m4)
      };
    }
  };

  /* =====================================================================
     ARBR — AR (popularity) and BR (willingness) sentiment pair
     AR = Σ(H − O) / Σ(O − L) × 100
     BR = Σ max(0, H − C₋₁) / Σ max(0, C₋₁ − L) × 100

     The two differ only through the overnight gap (O − C₋₁). The demo feed
     opens every bar at the previous close, so here AR ≡ BR exactly — BR is
     drawn dashed so the perfect overlap is visible rather than looking like
     a series that failed to render. That degeneracy is the point of the
     pair and is called out in the content.
     ===================================================================== */
  R['ARBR'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 26 }],
    series: [
      { k: 'AR', type: 'line', color: '#FF8D1E', width: 1.5 },
      { k: 'BR', type: 'line', color: '#0CAEE6', width: 1.5, dash: [5, 3] }
    ],
    hlines: [
      { v: 70, label: '70' }, { v: 100, label: '100' },
      { v: 150, label: '150' }, { v: 300, label: '300' }
    ],
    calc: function (d, p, H) {
      const arUp = H.sub(d.h, d.o);
      const arDn = H.sub(d.o, d.l);
      const pc = H.ref(d.c, 1);
      const brUp = H.map(H.sub(d.h, pc), function (x) { return Math.max(0, x); });
      const brDn = H.map(H.sub(pc, d.l), function (x) { return Math.max(0, x); });
      return {
        AR: H.scale(H.div(H.sum(arUp, p.n), H.sum(arDn, p.n)), 100),
        BR: H.scale(H.div(H.sum(brUp, p.n), H.sum(brDn, p.n)), 100)
      };
    }
  };

  /* =====================================================================
     PSY — Psychological Line
     PSY   = count(C > C₋₁, n) / n × 100
     PSYMA = SMA(PSY, m)
     ===================================================================== */
  R['PSY'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 12 }, { k: 'm', d: 6 }],
    series: [
      { k: 'PSY', type: 'line', color: '#0CAEE6', width: 1.5 },
      { k: 'PSYMA', type: 'line', color: '#FF8D1E' }
    ],
    hlines: [
      { v: 90, label: '90' }, { v: 75, label: '75' },
      { v: 25, label: '25' }, { v: 10, label: '10' }
    ],
    range: [0, 100],
    calc: function (d, p, H) {
      const up = H.gt(d.c, H.ref(d.c, 1));
      const psy = H.scale(H.countTrue(up, p.n), 100 / Math.max(1, Math.round(p.n)));
      return { PSY: psy, PSYMA: H.sma(psy, p.m) };
    }
  };

  /* =====================================================================
     VR — Volume Ratio
     TH = Σ V on up closes, TL = Σ V on down closes, TQ = Σ V on flat closes
     VR   = 100 × (2·TH + TQ) / (2·TL + TQ)
     VRMA = SMA(VR, m)
     ===================================================================== */
  R['VR'] = {
    pane: 'sub',
    params: [{ k: 'n', d: 26 }, { k: 'm', d: 6 }],
    series: [
      { k: 'VR', type: 'line', color: '#0CAEE6', width: 1.5 },
      { k: 'VRMA', type: 'line', color: '#FF8D1E' }
    ],
    hlines: [
      { v: 40, label: '40' }, { v: 80, label: '80' },
      { v: 160, label: '160' }, { v: 350, label: '350' }
    ],
    calc: function (d, p, H) {
      const lc = H.ref(d.c, 1);
      const upV = new Array(d.n).fill(0);
      const dnV = new Array(d.n).fill(0);
      const eqV = new Array(d.n).fill(0);
      for (let i = 0; i < d.n; i++) {
        const prev = lc[i];
        if (!H.num(prev) || !H.num(d.v[i])) continue;
        if (d.c[i] > prev) upV[i] = d.v[i];
        else if (d.c[i] < prev) dnV[i] = d.v[i];
        else eqV[i] = d.v[i];
      }
      const th = H.sum(upV, p.n), tl = H.sum(dnV, p.n), tq = H.sum(eqV, p.n);
      const num = H.add(H.scale(th, 2), tq);
      const den = H.add(H.scale(tl, 2), tq);
      const vr = H.scale(H.div(num, den), 100);
      return { VR: vr, VRMA: H.sma(vr, p.m) };
    }
  };

  /* =====================================================================
     CYC — Cost Average (成本均线)
     amount ≈ hlc3 × V           (turnover proxy)
     CYCk   = EMA(amount, k) / EMA(V, k)        k = p1, p2, p3
     CYC∞   : adaptive average holding cost, updated by the turnover rate
              m  = min(V / capital, 1)
              CYC∞ₜ = CYC∞ₜ₋₁ × (1 − m) + (amount/V)ₜ × m
              capital is unavailable from OHLCV, so it is derived from the
              assumed average daily turnover rate `turn` (%):
              capital = mean(V) / (turn / 100)
     ===================================================================== */
  R['CYC'] = {
    pane: 'sub',
    params: [
      { k: 'p1', d: 5 }, { k: 'p2', d: 13 }, { k: 'p3', d: 34 },
      { k: 'turn', d: 1.5, step: 0.1 }
    ],
    series: [
      { k: 'CYC1', type: 'line', color: '#9BE564' },
      { k: 'CYC2', type: 'line', color: '#FFC90E' },
      { k: 'CYC3', type: 'line', color: '#0CAEE6' },
      { k: 'CYCINF', type: 'line', color: '#FF6B6B', width: 1.7 }
    ],
    calc: function (d, p, H) {
      const tp = H.hlc3(d);
      const amt = amountOf(d, H);
      function cyc(k) { return H.div(H.ema(amt, k), H.ema(d.v, k)); }

      // Free-float share count is external data; it only ever appears as a
      // scale constant in the turnover weight, so derive it from `turn`.
      let vs = 0, vn = 0;
      for (let i = 0; i < d.n; i++) { if (H.num(d.v[i])) { vs += d.v[i]; vn++; } }
      const meanV = vn ? vs / vn : 0;
      const turn = Math.max(0.01, p.turn) / 100;
      const capital = meanV > 0 ? meanV / turn : 0;

      const inf = new Array(d.n).fill(null);
      let prev = null;
      for (let i = 0; i < d.n; i++) {
        const px = H.num(tp[i]) ? tp[i] : null;
        if (prev === null) { prev = px; inf[i] = prev; continue; }
        const v = H.num(d.v[i]) ? d.v[i] : 0;
        if (v > 0 && capital > 0 && px !== null) {
          const m = Math.min(v / capital, 1);
          prev = prev * (1 - m) + px * m;
        }
        inf[i] = prev;
      }
      return { CYC1: cyc(p.p1), CYC2: cyc(p.p2), CYC3: cyc(p.p3), CYCINF: inf };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_10_flow_opts.js ---- */
/* =========================================================================
   reg_10_flow_opts.js — order-flow buckets, futures open interest and
   options chain statistics.

   EVERY entry in this file is `simulated: true`, and that is not laziness.
   None of these readings can be derived from a single instrument's OHLCV:

     ORDERINFLOW_* / CAPITALINFLOW  need the trade-by-trade tape with each
       print classified by notional size AND by aggressor side (Level-2 /
       tick data). The bucket thresholds are broker-defined, so two vendors
       looking at the same tape publish different numbers.
     OPENINTEREST / POSITIONCHANGE  need the exchange's daily open-interest
       report for the futures contract, published T+1 after settlement.
     OPT_*                          need the full listed options chain
       (every strike, every expiry) from the options exchange.

   The illustrative series below are built from H.synth with a DIFFERENT key
   per indicator, blended with a price-derived term so the shape is at least
   economically plausible: large orders lean with price, small orders lean
   against it, and put/call ratios rise when price falls. The page renders a
   "simulated data" badge over all of them.

   Two deliberate exceptions to "one key per indicator", both because the
   Python defines the indicator as an EXACT function of another one here:
     CAPITALINFLOW  = ORDERINFLOW_XL + _L + _M + _S   (reuses all four)
     POSITIONCHANGE = OPENINTEREST differenced         (reuses that key)
   Giving these their own keys would draw lines that contradict the
   identities printed in the content, so they share generators instead.
   They still render as visibly distinct series.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* --- shared shape generators ---------------------------------------- */

  /** Normalised price-direction driver in roughly [-1, 1].
      Combines the intraday body (open→close) with a 3-bar swing so the
      resulting flow has both a daily and a short-swing component. */
  function priceDrive(d, H) {
    const body = H.div(H.sub(d.c, d.o), d.o);
    const swing = H.div(H.change(d.c, 3), d.c);
    return H.rescale(H.add(body, H.scale(swing, 0.5)), -1, 1);
  }

  /** One order-size bucket's net inflow, in millions of currency.
      w  = how strongly the bucket leans with price (negative = contrarian)
      amp= typical notional scale of the bucket                            */
  function netFlow(d, H, key, w, amp, pers) {
    const drv = priceDrive(d, H);
    const noise = H.synth(d.n, key, { lo: -1, hi: 1, persistence: pers });
    const mix = H.add(H.scale(drv, w), H.scale(noise, 1 - Math.abs(w)));
    const vn = H.scale(d.v, 1e-6);              // volume in millions of shares
    return H.map(H.mul(mix, vn), function (x) {
      return Math.round(x * amp * 100) / 100;
    });
  }

  /** A slowly-drifting positive level (open interest style), scaled to
      `base .. base+span` contracts and nudged by recent activity. */
  function oiLevel(d, H, key, pers, base, span, actSeries, actW) {
    const s = H.synth(d.n, key, { lo: 0, hi: 1, persistence: pers });
    const act = H.rescale(actSeries, 0, 1);
    const mix = H.add(H.scale(s, 1 - actW), H.scale(act, actW));
    return H.map(mix, function (x) { return Math.round(base + x * span); });
  }

  /** THE futures open-interest walk — one series, two views.
      future_position_chg() is by definition future_oi() differenced, so
      OPENINTEREST (the level) and POSITIONCHANGE (its first difference)
      MUST come from this single generator or the identity
      POSITIONCHANGE_t = OI_t − OI_{t−1} printed in the content would not
      hold on the page. Sharing the synth key is correct here: a level and
      its first difference are visibly different lines. */
  function futuresOI(d, H) {
    // OI builds while participation builds, so 10-bar average volume gets
    // a 30% weight on top of the independent slow random walk.
    return oiLevel(d, H, 'OPENINTEREST', 0.95, 120000, 260000, H.sma(d.v, 10), 0.30);
  }

  /* --- ORDER-FLOW SIZE BUCKETS ---------------------------------------- */
  /* Python: money_net_inflow(MoneyFlowType.extra_large) etc., plotted as a
     sign-coloured histogram. Extra-large leans hardest with price; small
     (retail) leans against it — the classic dip-buying signature.        */

  const XL_W = 0.62, L_W = 0.45, M_W = 0.18, S_W = -0.28;
  const XL_A = 48, L_A = 32, M_A = 20, S_A = 14;
  const XL_P = 0.80, L_P = 0.74, M_P = 0.62, S_P = 0.70;

  R['ORDERINFLOW_XL'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 5 }],
    series: [
      { k: 'XL', type: 'hist', colorBy: 'sign' },
      { k: 'MA', type: 'line', color: '#FF8D1E' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const xl = netFlow(d, H, 'ORDERINFLOW_XL', XL_W, XL_A, XL_P);
      return { XL: xl, MA: H.sma(xl, p.ma) };
    }
  };

  R['ORDERINFLOW_L'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 5 }],
    series: [
      { k: 'L', type: 'hist', colorBy: 'sign' },
      { k: 'MA', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const l = netFlow(d, H, 'ORDERINFLOW_L', L_W, L_A, L_P);
      return { L: l, MA: H.sma(l, p.ma) };
    }
  };

  R['ORDERINFLOW_M'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 5 }],
    series: [
      { k: 'M', type: 'hist', colorBy: 'sign' },
      { k: 'MA', type: 'line', color: '#E970DC' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const m = netFlow(d, H, 'ORDERINFLOW_M', M_W, M_A, M_P);
      return { M: m, MA: H.sma(m, p.ma) };
    }
  };

  R['ORDERINFLOW_S'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 5 }],
    series: [
      { k: 'S', type: 'hist', colorBy: 'sign' },
      { k: 'MA', type: 'line', color: '#9BE564' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const s = netFlow(d, H, 'ORDERINFLOW_S', S_W, S_A, S_P);
      return { S: s, MA: H.sma(s, p.ma) };
    }
  };

  /* --- CAPITALINFLOW = XL + L + M + S ---------------------------------- */
  /* Python literally sums the four buckets, so this entry reuses the same
     generators and is arithmetically consistent with the four above.      */
  R['CAPITALINFLOW'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 5 }],
    series: [
      { k: 'NET', type: 'hist', colorBy: 'sign' },
      { k: 'MA', type: 'line', color: '#FFC90E' },
      { k: 'CUM', type: 'line', color: '#7C9CFF', dash: [4, 3] }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const net = H.add(
        H.add(netFlow(d, H, 'ORDERINFLOW_XL', XL_W, XL_A, XL_P),
              netFlow(d, H, 'ORDERINFLOW_L', L_W, L_A, L_P)),
        H.add(netFlow(d, H, 'ORDERINFLOW_M', M_W, M_A, M_P),
              netFlow(d, H, 'ORDERINFLOW_S', S_W, S_A, S_P))
      );
      // Cumulative inflow is the reading that actually matters; scaled down
      // so it shares a readable axis with the daily bars. H.cum counts a
      // null as a zero contribution AND emits 0 there, so the warm-up bars
      // are masked back to null — 0 would draw a real-looking line.
      const raw = H.scale(H.cum(net), 0.08);
      const cum = raw.map(function (x, i) { return H.num(net[i]) ? x : null; });
      return { NET: net, MA: H.sma(net, p.ma), CUM: cum };
    }
  };

  /* --- FUTURES OPEN INTEREST ------------------------------------------- */
  /* Python: future_oi(), plotted as a blue histogram (a positive level, not
     a signed oscillator) — so no colorBy/zeroBase here.                   */
  R['OPENINTEREST'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 20 }],
    series: [
      { k: 'OI', type: 'hist', color: '#0CAEE6' },
      { k: 'OIMA', type: 'line', color: '#FF8D1E' }
    ],
    calc: function (d, p, H) {
      const oi = futuresOI(d, H);
      return { OI: oi, OIMA: H.sma(oi, p.ma) };
    }
  };

  /* --- FUTURES DAILY OI CHANGE ----------------------------------------- */
  /* Python: future_position_chg(), sign-coloured histogram. This is exactly
     the first difference of the OPENINTEREST series above — same generator,
     so the two panes tie numerically bar by bar.                          */
  R['POSITIONCHANGE'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 5 }],
    series: [
      { k: 'DOI', type: 'hist', colorBy: 'sign' },
      { k: 'MA', type: 'line', color: '#C77DFF' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const chg = H.change(futuresOI(d, H), 1);   // = OI_t − OI_{t−1}
      return { DOI: chg, MA: H.sma(chg, p.ma) };
    }
  };

  /* --- OPTIONS OPEN INTEREST ------------------------------------------- */
  /* Python: option_oi(), histogram. Total contracts outstanding across the
     whole chain — a slow, sticky level that steps around expiries.        */
  R['OPT_OI'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 20 }],
    series: [
      { k: 'OPT_OI', type: 'hist', color: '#C77DFF' },
      { k: 'OIMA', type: 'line', color: '#FFC90E' }
    ],
    calc: function (d, p, H) {
      // Driven by ACTIVITY, not by the price level: keying the shape to a
      // price average would draw a rescaled copy of the price chart and
      // teach a relationship options OI does not have.
      const oi = oiLevel(d, H, 'OPT_OI', 0.96, 400000, 1600000, H.sma(d.v, 10), 0.30);
      return { OPT_OI: oi, OIMA: H.sma(oi, p.ma) };
    }
  };

  /* --- OPTIONS VOLUME --------------------------------------------------- */
  /* Python: option_vol(), histogram. Contracts traded per session — far
     spikier than OI, so a low-persistence walk plus |return|.             */
  R['OPT_VOL'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 20 }],
    series: [
      { k: 'OPT_VOL', type: 'hist', color: '#4ECDC4' },
      { k: 'VOLMA', type: 'line', color: '#FF6B6B' }
    ],
    calc: function (d, p, H) {
      const absret = H.rescale(H.abs(H.div(H.change(d.c, 1), d.c)), 0, 1);
      const noise = H.synth(d.n, 'OPT_VOL', { lo: 0, hi: 1, persistence: 0.45 });
      const mix = H.add(H.scale(absret, 0.55), H.scale(noise, 0.45));
      const vol = H.map(mix, function (x) { return Math.round(30000 + x * 420000); });
      return { OPT_VOL: vol, VOLMA: H.sma(vol, p.ma) };
    }
  };

  /* --- OPEN-INTEREST PUT/CALL RATIO ------------------------------------ */
  /* Python: option_oi_pcr(), single line. Slow positioning gauge: rises as
     price falls (hedges get bought), mean-reverts around ~1.0.           */
  R['OPT_OIPCR'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 10 }],
    series: [
      { k: 'OIPCR', type: 'line', color: '#FF8080', width: 1.6 },
      { k: 'MA', type: 'line', color: '#7C9CFF', dash: [4, 3] }
    ],
    // Only parity (equal put and call OI) is a structural fact. The content
    // states that the NEUTRAL level is not 1.0 and that the ratio must be
    // read as a percentile of its own history, so no absolute
    // overbought/oversold ladder is drawn here.
    hlines: [{ v: 1.0, label: 'parity 1.0' }],
    calc: function (d, p, H) {
      const mom = H.rescale(H.div(H.change(d.c, 10), d.c), -1, 1);
      const noise = H.synth(d.n, 'OPT_OIPCR', { lo: -1, hi: 1, persistence: 0.90 });
      const mix = H.add(H.scale(H.neg(mom), 0.55), H.scale(noise, 0.45));
      const pcr = H.map(mix, function (x) {
        return Math.round((1.0 + x * 0.45) * 1000) / 1000;
      });
      return { OIPCR: pcr, MA: H.sma(pcr, p.ma) };
    }
  };

  /* --- VOLUME PUT/CALL RATIO -------------------------------------------- */
  /* Python: option_vol_pcr(), single line. Same idea as OIPCR but measured
     on today's trading rather than the standing book — much noisier, and
     that noise is exactly what makes its extremes tradable.               */
  R['OPT_VOLPCR'] = {
    pane: 'sub',
    simulated: true,
    params: [{ k: 'ma', d: 5 }],
    series: [
      { k: 'VOLPCR', type: 'line', color: '#0CAEE6' },
      { k: 'MA', type: 'line', color: '#FF8D1E', width: 1.6 }
    ],
    // Same reasoning as OPT_OIPCR: parity only, no absolute threshold ladder.
    hlines: [{ v: 1.0, label: 'parity 1.0' }],
    calc: function (d, p, H) {
      const mom = H.rescale(H.div(H.change(d.c, 5), d.c), -1, 1);
      const noise = H.synth(d.n, 'OPT_VOLPCR', { lo: -1, hi: 1, persistence: 0.45 });
      const mix = H.add(H.scale(H.neg(mom), 0.60), H.scale(noise, 0.40));
      const pcr = H.map(mix, function (x) {
        return Math.round((0.92 + x * 0.55) * 1000) / 1000;
      });
      return { VOLPCR: pcr, MA: H.sma(pcr, p.ma) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_11_breadth_ad.js ---- */
/* =========================================================================
   reg_11_breadth_ad.js — index breadth: advance/decline spread (ADD),
   advance/decline ratio (ADR) and the McClellan Oscillator (MCL).

   ALL SIMULATED. rise_count(index) / fall_count(index) in the Python source
   require the daily up/down tally of every constituent of a named index.
   That cannot be derived from one instrument's OHLCV, so each entry builds
   an illustrative series from a seeded H.synth walk blended with a
   price-momentum term (breadth and price are correlated in reality) and
   then shaped by the STRUCTURE of the index it belongs to:

     - constituent count N            (30 for DJI/HSTECH, ~500 SPX, ~3300 IXIC)
     - active fraction                (share of names that actually print a
                                       non-zero change; low in HK, low in the
                                       NASDAQ micro-cap tail)
     - gain                           (saturation — HSTECH is a one-factor
                                       basket and pins at 28-2 / 2-28)
     - persistence                    (large baskets mean-revert slowly,
                                       30-name baskets flip day to day)

   The counts are rounded to integers because they ARE counts, which is what
   makes the 30-name indices visibly chunky in a way the 500/3300-name ones
   are not — that quantisation is the whole lesson of this group.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  const ADR_HL = [{ v: 2, label: '2.0' }, { v: 1, label: '1.0' }, { v: 0.5, label: '0.5' }];

  /* Shared driver in [-1, +1]: 0 = as many up as down, +1 = everything up. */
  function netMix(d, H, key, cfg) {
    const mom = H.rescale(H.change(d.c, 5), -1, 1);
    const noise = H.synth(d.n, key, { lo: -1, hi: 1, persistence: cfg.persist });
    const raw = H.add(H.scale(mom, cfg.momW), H.scale(noise, 1 - cfg.momW));
    return H.map(raw, function (x) {
      return Math.max(-1, Math.min(1, x * cfg.gain));
    });
  }

  /* Integer advancer count A out of `active` issues that actually printed a
     change. amp scales how far the driver pushes A away from active/2. */
  function advancers(d, H, key, cfg, amp) {
    const active = Math.round(cfg.n * cfg.act);
    return H.map(netMix(d, H, key, cfg), function (x) {
      return Math.round((0.5 + 0.5 * x * amp) * active);
    });
  }

  /* ADD = A − B. Since A + B = active, this is 2A − active: the series can
     only take `active + 1` values and it steps by 2, exactly as a real
     headcount difference does. On a 30-name index that is 31 attainable
     values from −30 to +30 — the quantisation is the whole lesson here. */
  function spread(d, H, key, cfg) {
    const active = Math.round(cfg.n * cfg.act);
    return H.map(advancers(d, H, key, cfg, 1), function (a) { return 2 * a - active; });
  }

  /* ADR = A / B = A / (active − A). Built from the same integer advancer
     count so the ratio inherits the coarseness of a small index and blows up
     when B approaches zero; A is clamped to [1, active−1] so the 30-0 day
     (undefined in the Python) never divides by zero here. */
  function ratio(d, H, key, cfg) {
    const active = Math.round(cfg.n * cfg.act);
    return H.map(advancers(d, H, key, cfg, cfg.ampR), function (a) {
      const A = Math.max(1, Math.min(active - 1, a));
      return A / (active - A);
    });
  }

  /* ---------------- Advance/Decline Spread (A − B) --------------------- */

  R['ADD_SPX'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ADD_SPX', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      return { ADD_SPX: spread(d, H, 'ADD_SPX_NET', { n: 500, act: 0.94, momW: 0.55, persist: 0.86, gain: 1.15 }) };
    }
  };

  R['ADD_IXIC'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ADD_IXIC', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      // ~3,300 listings, but a long tail of micro-caps prints unchanged.
      return { ADD_IXIC: spread(d, H, 'ADD_IXIC_NET', { n: 3300, act: 0.85, momW: 0.50, persist: 0.90, gain: 1.00 }) };
    }
  };

  R['ADD_DJI'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ADD_DJI', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      // Only 30 names — the series can only take 31 distinct values.
      return { ADD_DJI: spread(d, H, 'ADD_DJI_NET', { n: 30, act: 1.00, momW: 0.60, persist: 0.72, gain: 1.40 }) };
    }
  };

  R['ADD_HSI'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ADD_HSI', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      // ~82 constituents, a large share of them thin enough to close flat.
      return { ADD_HSI: spread(d, H, 'ADD_HSI_NET', { n: 82, act: 0.78, momW: 0.45, persist: 0.80, gain: 1.10 }) };
    }
  };

  R['ADD_HSTECH'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ADD_HSTECH', type: 'hist', colorBy: 'sign' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      // 30 names, one factor: high gain forces the bimodal all-up/all-down shape.
      return { ADD_HSTECH: spread(d, H, 'ADD_HSTECH_NET', { n: 30, act: 0.95, momW: 0.70, persist: 0.62, gain: 2.20 }) };
    }
  };

  /* ---------------- Advance/Decline Ratio (A / B) ---------------------- */
  /* ADR_SPX lives in reg_00_skeleton.js and is deliberately not redefined. */

  R['ADR_IXIC'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ADR_IXIC', type: 'line', color: '#4ECDC4' }],
    hlines: ADR_HL,
    calc: function (d, p, H) {
      return { ADR_IXIC: ratio(d, H, 'ADR_IXIC_NET', { n: 3300, act: 0.85, momW: 0.50, persist: 0.90, gain: 1.00, ampR: 0.55 }) };
    }
  };

  R['ADR_DJI'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ADR_DJI', type: 'line', color: '#FFC90E' }],
    hlines: ADR_HL,
    calc: function (d, p, H) {
      // 30 names -> the ratio can only be 1/29, 2/28, 3/27 … a step function.
      return { ADR_DJI: ratio(d, H, 'ADR_DJI_NET', { n: 30, act: 1.00, momW: 0.60, persist: 0.72, gain: 1.40, ampR: 0.75 }) };
    }
  };

  R['ADR_HSI'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ADR_HSI', type: 'line', color: '#E970DC' }],
    hlines: ADR_HL,
    calc: function (d, p, H) {
      return { ADR_HSI: ratio(d, H, 'ADR_HSI_NET', { n: 82, act: 0.78, momW: 0.45, persist: 0.80, gain: 1.10, ampR: 0.62 }) };
    }
  };

  R['ADR_HSTECH'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ADR_HSTECH', type: 'line', color: '#C77DFF' }],
    hlines: ADR_HL,
    calc: function (d, p, H) {
      return { ADR_HSTECH: ratio(d, H, 'ADR_HSTECH_NET', { n: 30, act: 0.95, momW: 0.70, persist: 0.62, gain: 2.20, ampR: 0.80 }) };
    }
  };

  /* ---------------- McClellan Oscillator -------------------------------
     The Python hard-codes the S&P 500 net-advance series, so MCL is always
     an SPX breadth read regardless of which chart it sits under.
     MCL = EMA(A−B, 19) − EMA(A−B, 39). Note this is RAW net advances, not
     Sherman McClellan's ratio-adjusted (A−B)/(A+B)×1000 — see the notes.  */
  R['MCL'] = {
    pane: 'sub', simulated: true,
    params: [{ k: 'n1', d: 19 }, { k: 'n2', d: 39 }],
    series: [
      { k: 'MCL', type: 'hist', colorBy: 'sign' },
      { k: 'MAMCL1', type: 'line', color: '#FFC90E' },
      { k: 'MAMCL2', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const dif = spread(d, H, 'MCL_SPX_NET', { n: 500, act: 0.94, momW: 0.55, persist: 0.86, gain: 1.15 });
      const e1 = H.ema(dif, p.n1);
      const e2 = H.ema(dif, p.n2);
      return { MCL: H.sub(e1, e2), MAMCL1: e1, MAMCL2: e2 };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_12_breadth_ma.js ---- */
/* =========================================================================
   reg_12_breadth_ma.js — "% of constituents above their 200-day MA"
   for nine indices (breadth category).

   The Python source for every one of these is byte-identical:

       a = over_ma200(index)          # constituents closing above their MA200
       b = component_count(index)     # number of index members
       ma200_ = a / b                 # 0..1 ratio

   The Python returns the raw 0..1 ratio; the docstring calls it a
   "percentage" and every published version of this series ($SPXA200R and
   friends) is quoted 0–100, so the series here is the ratio x 100. That
   scaling is stated in the `formula` text of all nine content entries.

   That needs the full constituent panel — several hundred separate price
   histories per index — which cannot be derived from one instrument's
   OHLCV. Every entry here is therefore simulated:true and drawn from a
   deterministic seeded walk blended with a slow price-trend term, so the
   SHAPE is plausible (breadth leads/lags price, mean-reverts, saturates)
   without pretending to be a real computation.

   Differentiation between the nine is deliberate and reflects the real
   character of each index:
     - members  : small member counts quantise the series into visible steps
                  (DJI/SOX/HSTECH have ~30 names → 3.3pp granularity)
     - center   : structural resting level (IXIC's thousands of micro-caps
                  keep the median low; SPX sits far higher)
     - amp      : how violently the market swings between washout and euphoria
     - wTrend   : how tightly breadth tracks the index (HXC moves as one bloc)
     - persist  : how slowly the independent component wanders
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* Build one illustrative 0–100 breadth series.
     Deliberately NOT exported to H — it is a local shaping function, not an
     indicator primitive. Returns nulls through the warm-up region. */
  function pctAboveMA200(d, H, o) {
    // Slow price-trend term: 20-bar change, smoothed, normalised to [-1, 1].
    const mom = H.rescale(H.sma(H.change(d.c, o.mom), 10), -1, 1);
    // Independent seeded component — unique key per index.
    const noise = H.synth(d.n, o.key, { lo: -1, hi: 1, persistence: o.persist });
    const mix = H.add(H.scale(mom, o.wTrend), H.scale(noise, 1 - o.wTrend));

    const raw = H.map(mix, function (x) {
      const v = o.center + x * o.amp;
      return Math.max(1, Math.min(99, v));   // breadth saturates, never inverts
    });
    const smooth = H.sma(raw, o.smooth);
    if (!o.members) return smooth;

    // Few constituents ⇒ the reading can only land on multiples of 100/N.
    // Rounding may push an extreme onto 0 or 100, which is legitimate for a
    // headcount (0 of 30 above) and still inside the declared [0,100] range.
    const step = 100 / o.members;
    return H.map(smooth, function (x) { return Math.round(x / step) * step; });
  }

  const LINES = [{ v: 80, label: '80' }, { v: 50, label: '50' }, { v: 20, label: '20' }];

  /* ---- S&P 500: the canonical broad-market regime gauge ----------------
     500 large caps, smooth, well-behaved, spends most of a bull market
     between 55 and 80 and only visits sub-20 in genuine panics.          */
  R['SPX>MA200'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'MA200_SPX', type: 'line', color: '#9BE564' }],
    hlines: LINES,
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        MA200_SPX: pctAboveMA200(d, H, {
          key: 'PMA200_SPX', mom: 20, persist: 0.93,
          center: 55, amp: 40, wTrend: 0.62, smooth: 8
        })
      };
    }
  };

  /* ---- Nasdaq 100: 100 mega-cap growth names, higher beta -------------- */
  R['NDX>MA200'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'MA200_NDX', type: 'line', color: '#0CAEE6' }],
    hlines: LINES,
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        MA200_NDX: pctAboveMA200(d, H, {
          key: 'PMA200_NDX', mom: 18, persist: 0.90,
          center: 54, amp: 46, wTrend: 0.66, smooth: 7, members: 100
        })
      };
    }
  };

  /* ---- Nasdaq Composite: ~3,000 names, a long micro-cap tail that sits
     below its MA200 even in good years, so the whole series rests lower. */
  R['IXIC>MA200'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'MA200_IXIC', type: 'line', color: '#7C9CFF' }],
    hlines: LINES,
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        MA200_IXIC: pctAboveMA200(d, H, {
          key: 'PMA200_IXIC', mom: 22, persist: 0.94,
          center: 40, amp: 34, wTrend: 0.58, smooth: 9
        })
      };
    }
  };

  /* ---- Dow Jones Industrial Average: only 30 members, so the reading
     is quantised to 3.33pp steps — a staircase, not a curve. ------------- */
  R['DJI>MA200'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'MA200_DJI', type: 'line', color: '#FFC90E' }],
    hlines: LINES,
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        MA200_DJI: pctAboveMA200(d, H, {
          key: 'PMA200_DJI', mom: 20, persist: 0.91,
          center: 56, amp: 46, wTrend: 0.60, smooth: 6, members: 30
        })
      };
    }
  };

  /* ---- Philadelphia Semiconductor: 30 cyclicals that turn together, so
     the series is a near square-wave between saturation and washout. ---- */
  R['SOX>MA200'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'MA200_SOX', type: 'line', color: '#FF8D1E' }],
    hlines: LINES,
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        MA200_SOX: pctAboveMA200(d, H, {
          key: 'PMA200_SOX', mom: 15, persist: 0.88,
          center: 52, amp: 55, wTrend: 0.72, smooth: 5, members: 30
        })
      };
    }
  };

  /* ---- Nikkei 225: 225 members, but the index itself is price-weighted,
     so breadth and index level can disagree for long stretches. ---------- */
  R['N225>MA200'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'MA200_N225', type: 'line', color: '#FF6B6B' }],
    hlines: LINES,
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        MA200_N225: pctAboveMA200(d, H, {
          key: 'PMA200_N225', mom: 24, persist: 0.95,
          center: 50, amp: 40, wTrend: 0.48, smooth: 10
        })
      };
    }
  };

  /* ---- Hang Seng: ~80 members, policy- and flow-driven, capable of
     staying below 20 for the best part of a year. ------------------------ */
  R['HSI>MA200'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'MA200_HSI', type: 'line', color: '#E970DC' }],
    hlines: LINES,
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        MA200_HSI: pctAboveMA200(d, H, {
          key: 'PMA200_HSI', mom: 20, persist: 0.92,
          center: 44, amp: 46, wTrend: 0.55, smooth: 8
        })
      };
    }
  };

  /* ---- Hang Seng TECH: 30 high-beta names that gap as a group. --------- */
  R['HSTECH>MA200'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'MA200_HSTECH', type: 'line', color: '#C77DFF' }],
    hlines: LINES,
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        MA200_HSTECH: pctAboveMA200(d, H, {
          key: 'PMA200_HSTECH', mom: 14, persist: 0.87,
          center: 46, amp: 58, wTrend: 0.70, smooth: 4, members: 30
        })
      };
    }
  };

  /* ---- Nasdaq China Golden Dragon: US-listed China ADRs. One headline
     moves all of them, so breadth barely diverges from the index. -------- */
  R['HXC>MA200'] = {
    pane: 'sub',
    simulated: true,
    params: [],
    series: [{ k: 'MA200_HXC', type: 'line', color: '#4ECDC4' }],
    hlines: LINES,
    range: [0, 100],
    calc: function (d, p, H) {
      return {
        MA200_HXC: pctAboveMA200(d, H, {
          key: 'PMA200_HXC', mom: 8, persist: 0.78,
          center: 42, amp: 56, wTrend: 0.78, smooth: 4, members: 65
        })
      };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_13_other.js ---- */
/* =========================================================================
   reg_13_other.js — category "other": composite systems and pattern markers

   CVLT   Chaikin Volatility                (ROC of the smoothed H−L range)
   HSLC   Hard And Soft Limiter Comparison  (tanh vs clip of RMS-normalised Δ)
   IC     Ichimoku Kinko Hyo                (five lines + displaced cloud)
   MICD   Momentum Ind. Convergence Div.    (MACD built on smoothed momentum)
   NINE   Tom Demark Sequential 9           (setup counter, price-level dots)
   RC     Change Rate                       (C / C[m], Wilder-smoothed)
   RCCD   Rate of Change Conv. Divergence   (MACD built on RC)
   SRMI   SRMI Indicator                    (asymmetric-denominator ROC)
   SVSI   Slow Volume Strength Index        (volume split by EMA side)
   UTBOT  UT Bot Alerts                     (stateful ATR trailing stop)
   WF     Williams Fractal                  (5-bar swing pivots, dots)

   Displacement note (IC): a line "projected 26 bars into the future" means
   the value computed at bar t is DRAWN at bar t+26, i.e. plotted[i] =
   raw[i−26] = H.ref(raw, 26). H.shiftFwd(raw, k) returns raw[i+k], which is
   the opposite direction and would blank the right-hand edge of the chart —
   so it is used only for the Chikou span, which genuinely reads ahead.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  /* --- CVLT: rate of change of an EMA'd high-low range ------------------ */
  R['CVLT'] = {
    pane: 'sub',
    params: [{ k: 'length', d: 10 }, { k: 'roc', d: 12 }],
    series: [{ k: 'CVLT', type: 'line', color: '#FF8D1E' }],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const rema = H.ema(H.sub(d.h, d.l), p.length);
      const back = H.ref(rema, p.roc);
      return { CVLT: H.scale(H.div(H.sub(rema, back), back), 100) };
    }
  };

  /* --- HSLC: soft (tanh / inverse Fisher) vs hard (clip) limiter --------
     derivative = C − C[2], normalised by its own RMS over rmslen bars, then
     pushed through two different saturating shapers and the same
     [1,2,3,3,2,1]/12 FIR smoother. The two curves only diverge when the
     normalised momentum leaves ±1, which is exactly where the comparison
     carries information. */
  R['HSLC'] = {
    pane: 'sub',
    params: [{ k: 'rmslen', d: 50 }],
    series: [
      { k: 'SOFTLIMITER', type: 'line', color: '#FF8D1E' },
      { k: 'HARDLIMITER', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    range: [-1, 1],
    calc: function (d, p, H) {
      const der = H.sub(d.c, H.ref(d.c, 2));
      const rms = H.map(H.sma(H.mul(der, der), p.rmslen), Math.sqrt);
      const norm = H.div(der, rms);
      // tanh(x) written as the Python does it, with an overflow guard.
      const ift = H.map(norm, function (x) {
        if (x > 20) return 1;
        if (x < -20) return -1;
        const e = Math.exp(2 * x);
        return (e - 1) / (e + 1);
      });
      const clip = H.map(norm, function (x) { return x > 1 ? 1 : (x < -1 ? -1 : x); });
      function fir(a) {
        const s = H.add(
          H.add(a, H.scale(H.ref(a, 1), 2)),
          H.add(H.scale(H.ref(a, 2), 3), H.scale(H.ref(a, 3), 3))
        );
        return H.scale(H.add(s, H.add(H.scale(H.ref(a, 4), 2), H.ref(a, 5))), 1 / 12);
      }
      return { SOFTLIMITER: fir(ift), HARDLIMITER: fir(clip) };
    }
  };

  /* --- IC: Ichimoku Kinko Hyo ------------------------------------------
     CL    Tenkan-sen   (9-bar midpoint)
     DL    Kijun-sen    (26-bar midpoint)
     LL    Chikou span  (close read 26 bars ahead → null at the right edge)
     SPANA Senkou A     ((CL+DL)/2 drawn 26 bars later)
     SPANB Senkou B     (52-bar midpoint drawn 26 bars later)   */
  R['IC'] = {
    pane: 'main',
    params: [{ k: 'short', d: 9 }, { k: 'mid', d: 26 }, { k: 'long', d: 52 }],
    series: [
      { k: 'CL', type: 'line', color: '#FF8D1E' },
      { k: 'DL', type: 'line', color: '#0CAEE6' },
      { k: 'LL', type: 'line', color: '#C77DFF', dash: [4, 3] },
      { k: 'SPANA', type: 'line', color: '#9BE564' },
      { k: 'SPANB', type: 'line', color: '#FF6B6B', fillTo: 'SPANA', fill: 'rgba(155,229,100,0.10)' }
    ],
    calc: function (d, p, H) {
      const cl = H.scale(H.add(H.highest(d.h, p.short), H.lowest(d.l, p.short)), 0.5);
      const dl = H.scale(H.add(H.highest(d.h, p.mid), H.lowest(d.l, p.mid)), 0.5);
      const ll = H.shiftFwd(d.c, p.mid);
      const aRaw = H.scale(H.add(cl, dl), 0.5);
      const bRaw = H.scale(H.add(H.lowest(d.l, p.long), H.highest(d.h, p.long)), 0.5);
      return {
        CL: cl, DL: dl, LL: ll,
        SPANA: H.ref(aRaw, p.mid),
        SPANB: H.ref(bRaw, p.mid)
      };
    }
  };

  /* --- MICD: MACD applied to Wilder-smoothed 1-bar momentum ------------- */
  R['MICD'] = {
    pane: 'sub',
    params: [{ k: 'p', d: 3 }, { k: 'm1', d: 10 }, { k: 'm2', d: 20 }],
    series: [
      { k: 'DIF', type: 'line', color: '#FF8D1E' },
      { k: 'MICD', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const mi = H.sub(d.c, H.ref(d.c, 1));
      const ami = H.smma(mi, p.p, 1);
      const a1 = H.ref(ami, 1);
      const dif = H.sub(H.sma(a1, p.m1), H.sma(a1, p.m2));
      return { DIF: dif, MICD: H.smma(dif, 10, 1) };
    }
  };

  /* --- NINE: TD Sequential setup count ---------------------------------
     Up setup  : close > close[4] on consecutive bars.
     Down setup: close < close[4] on consecutive bars.
     Only runs that actually reach 9 are marked (the Python multiplies the
     running count by backset(count==9, 9)); the in-progress run on the last
     bar is also shown when it has already reached 5. Dots are plotted at a
     price level because this is a main-pane overlay — the 9th bar gets its
     own series so the exhaustion bar is visually separable. */
  R['NINE'] = {
    pane: 'main',
    params: [{ k: 'lb', d: 4 }],
    series: [
      { k: 'UP', type: 'dots', color: '#E970DC' },
      { k: 'UP9', type: 'dots', color: '#9BE564', radius: 3.4 },
      { k: 'DN', type: 'dots', color: '#9BE564' },
      { k: 'DN9', type: 'dots', color: '#E970DC', radius: 3.4 }
    ],
    calc: function (d, p, H) {
      const n = d.n;
      const lb = Math.max(1, Math.round(p.lb));
      const atr = H.atr(d, 14);
      function pad(i) { return H.num(atr[i]) ? 0.9 * atr[i] : (d.h[i] - d.l[i]) || 0.5; }

      function counts(dir) {
        const run = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          const prev = i - lb >= 0 ? d.c[i - lb] : null;
          const on = prev === null ? false : (dir > 0 ? d.c[i] > prev : d.c[i] < prev);
          run[i] = on ? (i > 0 ? run[i - 1] + 1 : 1) : 0;
        }
        const shown = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          if (run[i] === 9) for (let k = 0; k < 9; k++) shown[i - k] = 9 - k;
        }
        // In-progress run on the final bar, once it has reached 5.
        const last = run[n - 1];
        if (last >= 5 && last < 9) for (let k = 0; k < last; k++) shown[n - 1 - k] = last - k;
        return shown;
      }

      const up = counts(1), dn = counts(-1);
      const UP = new Array(n).fill(null), UP9 = new Array(n).fill(null);
      const DN = new Array(n).fill(null), DN9 = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        if (up[i] > 0) { UP[i] = d.h[i] + pad(i); if (up[i] === 9) UP9[i] = d.h[i] + pad(i); }
        if (dn[i] > 0) { DN[i] = d.l[i] - pad(i); if (dn[i] === 9) DN9[i] = d.l[i] - pad(i); }
      }
      return { UP: UP, UP9: UP9, DN: DN, DN9: DN9 };
    }
  };

  /* --- RC: m-bar price ratio, Wilder-smoothed over the same m ----------- */
  R['RC'] = {
    pane: 'sub',
    params: [{ k: 'm', d: 50 }],
    series: [{ k: 'ARC', type: 'line', color: '#FF8D1E' }],
    hlines: [{ v: 1, label: '1.0' }],
    calc: function (d, p, H) {
      const rc = H.div(d.c, H.ref(d.c, p.m));
      return { ARC: H.smma(H.ref(rc, 1), p.m, 1) };
    }
  };

  /* --- RCCD: MACD construction laid on top of RC ------------------------ */
  R['RCCD'] = {
    pane: 'sub',
    params: [{ k: 'm', d: 59 }, { k: 'p1', d: 21 }, { k: 'p2', d: 28 }],
    series: [
      { k: 'DIF', type: 'line', color: '#FF8D1E' },
      { k: 'RCCD', type: 'line', color: '#0CAEE6' }
    ],
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const rc = H.div(d.c, H.ref(d.c, p.m));
      const arc = H.smma(H.ref(rc, 1), p.m, 1);
      const a1 = H.ref(arc, 1);
      const dif = H.sub(H.sma(a1, p.p1), H.sma(a1, p.p2));
      return { DIF: dif, RCCD: H.smma(dif, p.m, 1) };
    }
  };

  /* --- SRMI: ROC whose denominator switches with the sign ---------------
     falling  → (C − C[m]) / C[m]     (unbounded below −1? no: floor −1)
     rising   → (C − C[m]) / C        (bounded above by +1)               */
  R['SRMI'] = {
    pane: 'sub',
    params: [{ k: 'm', d: 9 }],
    series: [{ k: 'SRMI', type: 'line', color: '#FF8D1E' }],
    hlines: [{ v: 0, label: '0' }, { v: 0.1, label: '+0.1' }, { v: -0.1, label: '−0.1' }],
    zeroBase: true,
    calc: function (d, p, H) {
      const n = d.n, m = Math.max(1, Math.round(p.m));
      const out = new Array(n).fill(null);
      for (let i = m; i < n; i++) {
        const c = d.c[i], b = d.c[i - m];
        if (!H.num(c) || !H.num(b)) continue;
        if (c < b) { out[i] = b === 0 ? null : (c - b) / b; }
        else if (c === b) { out[i] = 0; }
        else { out[i] = c === 0 ? null : (c - b) / c; }
      }
      return { SRMI: out };
    }
  };

  /* --- SVSI: share of recent volume traded above the fast EMA ----------- */
  R['SVSI'] = {
    pane: 'sub',
    params: [{ k: 'el', d: 6 }, { k: 'vl', d: 14 }],
    series: [{ k: 'VSI', type: 'line', color: '#FF8D1E' }],
    hlines: [{ v: 80, label: '80' }, { v: 50, label: '50' }, { v: 20, label: '20' }],
    range: [0, 100],
    calc: function (d, p, H) {
      const emaC = H.ema(d.c, p.el);
      const n = d.n;
      const upSrc = new Array(n).fill(null), dnSrc = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        if (!H.num(emaC[i])) continue;
        upSrc[i] = d.c[i] > emaC[i] ? d.v[i] : 0;
        dnSrc[i] = d.c[i] < emaC[i] ? d.v[i] : 0;
      }
      const uw = H.wma(upSrc, p.vl), dw = H.wma(dnSrc, p.vl);
      return { VSI: H.scale(H.div(uw, H.add(uw, dw)), 100) };
    }
  };

  /* --- UTBOT: ATR trailing stop, ported line-for-line from UTBOT.py -----
     The stop only ratchets in the direction of the trend; it jumps to the
     other side of price the moment a close pierces it. Buy/Sell markers are
     emitted at the flip bar and drawn at a price level, offset by ATR. */
  R['UTBOT'] = {
    pane: 'main',
    params: [{ k: 'k', d: 1, step: 0.1 }, { k: 'atrLen', d: 10 }],
    series: [
      { k: 'STOP', type: 'line', color: '#FF8D1E', width: 2 },
      { k: 'BUY', type: 'dots', color: '#4ECDC4', radius: 3.4 },
      { k: 'SELL', type: 'dots', color: '#FF6B6B', radius: 3.4 }
    ],
    calc: function (d, p, H) {
      const n = d.n;
      const atr = H.smma(H.tr(d), p.atrLen, 1);
      const stop = new Array(n).fill(null);
      const buy = new Array(n).fill(null);
      const sell = new Array(n).fill(null);
      let prev = null;
      for (let i = 0; i < n; i++) {
        if (!H.num(atr[i]) || !H.num(d.c[i])) continue;
        const nl = p.k * atr[i];
        const s = d.c[i];
        const s1 = i > 0 && H.num(d.c[i - 1]) ? d.c[i - 1] : s;
        // Python seeds the very first bar against prev_stop = 0.
        if (prev === null) prev = 0;
        let cur;
        if (s > prev && s1 > prev) cur = Math.max(prev, s - nl);
        else if (s < prev && s1 < prev) cur = Math.min(prev, s + nl);
        else if (s > prev) cur = s - nl;
        else cur = s + nl;
        stop[i] = cur;
        const above = (s1 <= prev) && (s > cur);
        const below = (s1 >= prev) && (s < cur);
        if (s > cur && above) buy[i] = d.l[i] - 0.8 * atr[i];
        if (s < cur && below) sell[i] = d.h[i] + 0.8 * atr[i];
        prev = cur;
      }
      return { STOP: stop, BUY: buy, SELL: sell };
    }
  };

  /* --- WF: Williams Fractal --------------------------------------------
     A bar is an up-fractal when its high is the highest of the five-bar
     window centred on it, so the marker can only be drawn two bars after
     the fact. The offset uses 0.2 × StdDev(C, 21) — the Python calls
     close().std(21), i.e. the SAMPLE deviation, so this is H.std, not
     H.stdp (which is what `.stdp()` would map to). */
  R['WF'] = {
    pane: 'main',
    params: [{ k: 'p', d: 2 }],
    series: [
      { k: 'PEAK', type: 'dots', color: '#FF6B6B', radius: 3.2 },
      { k: 'BOTTOM', type: 'dots', color: '#4ECDC4', radius: 3.2 }
    ],
    calc: function (d, p, H) {
      const n = d.n, k = Math.max(1, Math.round(p.p));
      const gap = H.std(d.c, 21);
      const PEAK = new Array(n).fill(null), BOTTOM = new Array(n).fill(null);
      for (let i = k; i < n - k; i++) {
        const g = H.num(gap[i]) && gap[i] > 0 ? gap[i] : (d.h[i] - d.l[i]);
        let up = true, dn = true;
        for (let j = 1; j <= k; j++) {
          if (!(d.h[i] >= d.h[i - j])) up = false;
          if (!(d.h[i] > d.h[i + j])) up = false;
          if (!(d.l[i] <= d.l[i - j])) dn = false;
          if (!(d.l[i] < d.l[i + j])) dn = false;
        }
        if (up) PEAK[i] = d.h[i] + 0.2 * g;
        if (dn) BOTTOM[i] = d.l[i] - 0.2 * g;
      }
      return { PEAK: PEAK, BOTTOM: BOTTOM };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_20_fund_skeleton.js ---- */
/* =========================================================================
   reg_20_fund_skeleton.js — reference implementations for the FUNDAMENTAL
   family. These six are the metrics the cross-family combo stacks point at,
   and they double as the pattern every other fundamental batch follows.

   Fundamentals differ from technicals in three fixed ways:
     • pane is always 'sub'          (a figure, not a price overlay)
     • simulated is always true      (needs filings, not OHLCV)
     • the series is 'step'          (holds flat, jumps on the reporting date)
   The value is produced by H.fundamental(d, key, opts); see core.js. Give
   each indicator a UNIQUE key so two metrics never trace the same line, and
   pick opts that match the real magnitude and behaviour of the metric
   (revenue in billions and seasonal; margins as a bounded percentage; a
   liquidity ratio hovering near a small constant).
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  // Cool, blue-leaning colours so the whole family reads as "fundamental".
  const C = { income: '#2E9BFF', profit: '#4DD0E1', cash: '#26C6A0', ret: '#7C9CFF', margin: '#5AC8FA', liq: '#9F7AEA' };

  R['TOTALREVENUE_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'REVENUE', type: 'step', color: C.income, width: 1.7 }],
    fmt: 'money',
    calc: function (d, p, H) {
      // Big top-line number, compounding double-digits, with a visible Q4 bump.
      return { REVENUE: H.fundamental(d, 'TOTALREVENUE_FQ', { period: 'FQ', base: 7.8e9, growth: 0.12, vol: 0.06, seasonal: 0.16, decimals: 0 }) };
    }
  };

  R['NETPROFIT_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'NETPROFIT', type: 'step', color: C.profit, width: 1.7 }],
    fmt: 'money',
    calc: function (d, p, H) {
      // Bottom line is smaller and noisier than revenue — operating leverage
      // and one-offs make quarterly profit swing more than sales.
      return { NETPROFIT: H.fundamental(d, 'NETPROFIT_FQ', { period: 'FQ', base: 1.15e9, growth: 0.15, vol: 0.16, seasonal: 0.22, decimals: 0 }) };
    }
  };

  R['FCF_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'FCF', type: 'step', color: C.cash, width: 1.7 }],
    fmt: 'money',
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      return { FCF: H.fundamental(d, 'FCF_FY', { period: 'FY', base: 4.2e9, growth: 0.13, vol: 0.10, decimals: 0 }) };
    }
  };

  R['ROE_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ROE', type: 'step', color: C.ret, width: 1.7 }],
    fmt: 'pct',
    hlines: [{ v: 15, label: '15%' }],
    calc: function (d, p, H) {
      // Stored as a percentage; a quality compounder holds high, stable ROE.
      return { ROE: H.fundamental(d, 'ROE_FY', { period: 'FY', base: 19, growth: 0.015, vol: 0.05, floor: 0, decimals: 1 }) };
    }
  };

  R['GROSSMARGIN_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'GROSSMARGIN', type: 'step', color: C.margin, width: 1.7 }],
    fmt: 'pct',
    calc: function (d, p, H) {
      // Margins move slowly; the FY view is deliberately smooth.
      return { GROSSMARGIN: H.fundamental(d, 'GROSSMARGIN_FY', { period: 'FY', base: 43, growth: 0.004, vol: 0.02, floor: 0, cap: 100, decimals: 1 }) };
    }
  };

  R['CURRENTRATIO_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'CURRENTRATIO', type: 'step', color: C.liq, width: 1.7 }],
    fmt: 'ratio',
    hlines: [{ v: 1, label: '1.0' }, { v: 2, label: '2.0' }],
    calc: function (d, p, H) {
      return { CURRENTRATIO: H.fundamental(d, 'CURRENTRATIO_FY', { period: 'FY', base: 1.9, growth: 0.0, vol: 0.06, floor: 0.2, decimals: 2 }) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_21_fund_balance.js ---- */
/* =========================================================================
   reg_21_fund_balance.js — FUNDAMENTAL family, balance-sheet totals.
   Raw levels: total assets, stockholders' equity, total liabilities, each
   in a quarterly (FQ) and annual (FY) variant. Money in dollars, decimals 0.

   These are balance-sheet stocks (levels), not flows: they drift only
   slowly, hold flat between reports and jump on a filing. On their own a
   big number means little — they earn their keep as the denominators and
   numerators of ratios (ROA, asset turnover, ROE, leverage). No seasonal
   term (that belongs to revenue/profit), no zeroBase (positive money).
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  // Cool, blue-leaning colours so the whole family reads as "fundamental".
  const C = { assets: '#7C9CFF', equity: '#5AC8FA', liab: '#9F7AEA' };

  R['TOTALASSETS_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'TOTALASSETS', type: 'step', color: C.assets, width: 1.7 }],
    fmt: 'money',
    calc: function (d, p, H) {
      // Whole-balance-sheet total: the largest number on the statement,
      // drifting slowly. FQ carries a touch more per-report noise so a
      // discrete event (an acquisition, a raise) shows between annual reports.
      return { TOTALASSETS: H.fundamental(d, 'TOTALASSETS_FQ', { period: 'FQ', base: 46e9, growth: 0.08, vol: 0.05, decimals: 0 }) };
    }
  };

  R['TOTALASSETS_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'TOTALASSETS', type: 'step', color: C.assets, width: 1.7 }],
    fmt: 'money',
    calc: function (d, p, H) {
      // Annual view is the smooth one — the multi-year size trend used as
      // the denominator of ROA and asset turnover.
      return { TOTALASSETS: H.fundamental(d, 'TOTALASSETS_FY', { period: 'FY', base: 46e9, growth: 0.08, vol: 0.03, decimals: 0 }) };
    }
  };

  R['SH_EQUITY_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'SH_EQUITY', type: 'step', color: C.equity, width: 1.7 }],
    fmt: 'money',
    calc: function (d, p, H) {
      // Book value = assets − liabilities. Smaller than assets; grows with
      // retained earnings, can step DOWN on a buyback or writedown.
      return { SH_EQUITY: H.fundamental(d, 'SH_EQUITY_FQ', { period: 'FQ', base: 19e9, growth: 0.10, vol: 0.05, decimals: 0 }) };
    }
  };

  R['SH_EQUITY_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'SH_EQUITY', type: 'step', color: C.equity, width: 1.7 }],
    fmt: 'money',
    calc: function (d, p, H) {
      // The annual book-value trend — the ROE denominator and the cumulative
      // record of retained earnings, smoothed.
      return { SH_EQUITY: H.fundamental(d, 'SH_EQUITY_FY', { period: 'FY', base: 19e9, growth: 0.10, vol: 0.03, decimals: 0 }) };
    }
  };

  R['NCA_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'NCA', type: 'step', color: C.liab, width: 1.7 }],
    fmt: 'money',
    calc: function (d, p, H) {
      // NCA declares "Total Liabilities" and calls total_liabilities — keep
      // the odd id. Leverage numerator, read against equity, not in isolation.
      return { NCA: H.fundamental(d, 'NCA_FQ', { period: 'FQ', base: 27e9, growth: 0.07, vol: 0.06, decimals: 0 }) };
    }
  };

  R['NCA_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'NCA', type: 'step', color: C.liab, width: 1.7 }],
    fmt: 'money',
    calc: function (d, p, H) {
      // Annual total-liabilities trend — the number for a multi-year
      // leverage read against the equity line.
      return { NCA: H.fundamental(d, 'NCA_FY', { period: 'FY', base: 27e9, growth: 0.07, vol: 0.035, decimals: 0 }) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_22_fund_cash_inc_a.js ---- */
/* =========================================================================
   reg_22_fund_cash_inc_a.js — FUNDAMENTAL family, batch: cash-flow + income.
   Eight metrics across two categories:
     cash_flow        OCF_FQ, OCF_FY, FCF_FQ
     income_statement DILUTEDEPS_FQ, DILUTEDEPS_FY, GROSSPROFIT_FQ,
                      GROSSPROFIT_FY, NETPROFIT_FY

   Every fundamental is: pane 'sub', simulated true, a single 'step' series
   whose H.fundamental key EQUALS the indicator ID (so each metric draws its
   own unique line). Money items round to whole units (decimals 0); diluted
   EPS is a per-share dollar figure (decimals 2). Cash figures that can turn
   negative (free cash flow, net profit) get a zero reference line and
   zeroBase so the axis honestly shows the sign.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  // Cool, blue-teal-violet palette so the whole family reads as "fundamental".
  const C = { ocf: '#26C6A0', fcf: '#4DD0E1', eps: '#7C9CFF', gross: '#2E9BFF', profit: '#5AC8FA' };

  /* ---------------- cash_flow ---------------------------------------- */

  R['OCF_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    fmt: 'money',
    series: [{ k: 'OCF', type: 'step', color: C.ocf, width: 1.7 }],
    calc: function (d, p, H) {
      // Single-quarter cash from operations: larger than net profit (add back
      // D&A) and seasonal, since collections and working capital swing by
      // quarter. Noisier than the annual view.
      return { OCF: H.fundamental(d, 'OCF_FQ', { period: 'FQ', base: 1.45e9, growth: 0.13, vol: 0.15, seasonal: 0.18, decimals: 0 }) };
    }
  };

  R['OCF_FY'] = {
    pane: 'sub', simulated: true, params: [],
    fmt: 'money',
    series: [{ k: 'OCF', type: 'step', color: C.ocf, width: 1.7 }],
    calc: function (d, p, H) {
      // Full-year operating cash flow: the smooth, structural cash engine —
      // one step a year, low noise, comfortably above net profit.
      return { OCF: H.fundamental(d, 'OCF_FY', { period: 'FY', base: 5.6e9, growth: 0.12, vol: 0.06, decimals: 0 }) };
    }
  };

  R['FCF_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    fmt: 'money',
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    series: [{ k: 'FCF', type: 'step', color: C.fcf, width: 1.7 }],
    calc: function (d, p, H) {
      // Quarterly free cash flow = OCF − capex, one quarter at a time. Capex is
      // lumpy, so the quarterly line is jagged and can dip toward/through zero
      // in a heavy-build quarter — exactly the intra-year rhythm the annual
      // FCF figure smooths away.
      return { FCF: H.fundamental(d, 'FCF_FQ', { period: 'FQ', base: 0.95e9, growth: 0.13, vol: 0.24, seasonal: 0.2, decimals: 0 }) };
    }
  };

  /* ---------------- income_statement --------------------------------- */

  R['DILUTEDEPS_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    fmt: 'perShare',
    series: [{ k: 'EPS', type: 'step', color: C.eps, width: 1.7 }],
    calc: function (d, p, H) {
      // Diluted earnings per share for one quarter, fully-diluted share count.
      // A dollars-per-share figure (~1/4 of the annual run-rate), seasonal and
      // noisier than the annual number.
      return { EPS: H.fundamental(d, 'DILUTEDEPS_FQ', { period: 'FQ', base: 1.15, growth: 0.15, vol: 0.15, seasonal: 0.2, decimals: 2 }) };
    }
  };

  R['DILUTEDEPS_FY'] = {
    pane: 'sub', simulated: true, params: [],
    fmt: 'perShare',
    series: [{ k: 'EPS', type: 'step', color: C.eps, width: 1.7 }],
    calc: function (d, p, H) {
      // Full-year diluted EPS — the denominator of the trailing P/E and the
      // figure stock screens key on. Smooth, one step a year.
      return { EPS: H.fundamental(d, 'DILUTEDEPS_FY', { period: 'FY', base: 4.6, growth: 0.14, vol: 0.06, decimals: 2 }) };
    }
  };

  R['GROSSPROFIT_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    fmt: 'money',
    series: [{ k: 'GROSSPROFIT', type: 'step', color: C.gross, width: 1.7 }],
    calc: function (d, p, H) {
      // Revenue − COGS for one quarter, in dollars. Tracks revenue × gross
      // margin, so it moves with the top line and shares its seasonality.
      return { GROSSPROFIT: H.fundamental(d, 'GROSSPROFIT_FQ', { period: 'FQ', base: 3.35e9, growth: 0.12, vol: 0.07, seasonal: 0.16, decimals: 0 }) };
    }
  };

  R['GROSSPROFIT_FY'] = {
    pane: 'sub', simulated: true, params: [],
    fmt: 'money',
    series: [{ k: 'GROSSPROFIT', type: 'step', color: C.gross, width: 1.7 }],
    calc: function (d, p, H) {
      // Full-year gross profit in dollars — the annual, smoothed version of the
      // same revenue × margin product.
      return { GROSSPROFIT: H.fundamental(d, 'GROSSPROFIT_FY', { period: 'FY', base: 13.4e9, growth: 0.11, vol: 0.04, decimals: 0 }) };
    }
  };

  R['NETPROFIT_FY'] = {
    pane: 'sub', simulated: true, params: [],
    fmt: 'money',
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    series: [{ k: 'NETPROFIT', type: 'step', color: C.profit, width: 1.7 }],
    calc: function (d, p, H) {
      // Full-year bottom line. Smoother than the quarterly print because
      // one-offs partly wash out over four quarters, but a whole year can still
      // carry a big impairment or restructuring charge — hence the zero line.
      return { NETPROFIT: H.fundamental(d, 'NETPROFIT_FY', { period: 'FY', base: 4.9e9, growth: 0.14, vol: 0.06, decimals: 0 }) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_23_fund_income_b.js ---- */
/* =========================================================================
   reg_23_fund_income_b.js — FUNDAMENTAL family, income-statement batch B.

   Five income-statement money lines, all rendered as sub-pane step series
   (a figure, not a price overlay; simulated because they come from filings,
   not OHLCV). Keys are unique per ID so no two metrics trace the same line.

     TOTALREVENUE_FY  — annual top line, the structural comparable that the
                        seasonal quarterly line (TOTALREVENUE_FQ) cannot be.
     NIPC_FQ / NIPC_FY — net profit ATTRIBUTABLE TO PARENT shareholders
                        (归母净利润): total net profit minus the slice owned by
                        minority interests. This — not plain net profit — is
                        the correct EPS / P/E numerator.
     OPERATINGPROFIT_FQ / _FY — profit from core operations, above financing,
                        tax and one-offs; the cleanest cross-company read.

   Money is in the billions, decimals: 0, fmt: 'money'. Anything that can turn
   negative (profit lines) carries a zero reference line and zeroBase.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  // Cool, blue-leaning family palette. Income keeps the skeleton's blue;
  // NIPC gets a distinct sky tone so it is never confused with net profit
  // (#4DD0E1); operating profit takes the periwinkle.
  const C = { income: '#2E9BFF', nipc: '#5AC8FA', op: '#7C9CFF' };

  R['TOTALREVENUE_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'REVENUE', type: 'step', color: C.income, width: 1.7 }],
    fmt: 'money',
    calc: function (d, p, H) {
      // Annual top line ≈ four seasonal quarters rolled up: a big number, low
      // per-report noise, no seasonal term — one clean step a year.
      return { REVENUE: H.fundamental(d, 'TOTALREVENUE_FY', { period: 'FY', base: 30e9, growth: 0.12, vol: 0.04, decimals: 0 }) };
    }
  };

  R['NIPC_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'NIPC', type: 'step', color: C.nipc, width: 1.7 }],
    fmt: 'money',
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      // Attributable-to-parent profit is smaller than total net profit and,
      // as a single quarter, the noisiest headline line — one-offs, tax and
      // minority swings all land here. Seasonal against fixed costs.
      return { NIPC: H.fundamental(d, 'NIPC_FQ', { period: 'FQ', base: 1.0e9, growth: 0.15, vol: 0.17, seasonal: 0.20, decimals: 0 }) };
    }
  };

  R['NIPC_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'NIPC', type: 'step', color: C.nipc, width: 1.7 }],
    fmt: 'money',
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      // Annual attributable profit: the number that feeds trailing EPS and
      // P/E. Smoother than the quarterly line — one-offs largely wash out.
      return { NIPC: H.fundamental(d, 'NIPC_FY', { period: 'FY', base: 4.0e9, growth: 0.15, vol: 0.08, decimals: 0 }) };
    }
  };

  R['OPERATINGPROFIT_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'OPPROFIT', type: 'step', color: C.op, width: 1.7 }],
    fmt: 'money',
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      // Operating profit sits ABOVE net profit, so it is a larger number.
      // Quarterly: seasonal revenue against fixed costs makes it swing.
      return { OPPROFIT: H.fundamental(d, 'OPERATINGPROFIT_FQ', { period: 'FQ', base: 1.5e9, growth: 0.13, vol: 0.13, seasonal: 0.18, decimals: 0 }) };
    }
  };

  R['OPERATINGPROFIT_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'OPPROFIT', type: 'step', color: C.op, width: 1.7 }],
    fmt: 'money',
    hlines: [{ v: 0, label: '0' }],
    zeroBase: true,
    calc: function (d, p, H) {
      // Annual core-operating profit: the clean cross-company comparable that
      // EV/EBIT screens run on, because it sits above financing and tax.
      return { OPPROFIT: H.fundamental(d, 'OPERATINGPROFIT_FY', { period: 'FY', base: 6.0e9, growth: 0.13, vol: 0.07, decimals: 0 }) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_24_fund_ratios_a.js ---- */
/* =========================================================================
   reg_24_fund_ratios_a.js — FUNDAMENTAL family, key ratios (batch A).
   Returns, margins, per-share and liquidity ratios. Every entry is a
   sub-pane step series, simulated (needs filings, not OHLCV), keyed to its
   own indicator ID so no two metrics trace the same line. Percentages are
   stored as percentage numbers (base 12 = 12%); ratios as the raw multiple.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  // Cool, blue-teal-violet palette so the family reads as "fundamental".
  const C = { ret: '#5AC8FA', ret2: '#7C9CFF', roic: '#4DD0E1', margin: '#5AC8FA', share: '#7C9CFF', tax: '#9F7AEA', liq: '#9F7AEA', liq2: '#C77DFF' };

  R['ROA_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ROA', type: 'step', color: C.ret, width: 1.7 }],
    fmt: 'pct',
    hlines: [{ v: 5, label: '5%' }],
    calc: function (d, p, H) {
      // Return on the whole asset base, one quarter, annualised. Noisier and
      // seasonally distorted versus the FY line; read YoY.
      return { ROA: H.fundamental(d, 'ROA_FQ', { period: 'FQ', base: 12, growth: 0.01, vol: 0.11, floor: 0, decimals: 1 }) };
    }
  };

  R['ROA_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ROA', type: 'step', color: C.ret2, width: 1.7 }],
    fmt: 'pct',
    hlines: [{ v: 5, label: '5%' }],
    calc: function (d, p, H) {
      // The smooth, comparable annual return-on-assets — the number for screening.
      return { ROA: H.fundamental(d, 'ROA_FY', { period: 'FY', base: 12, growth: 0.01, vol: 0.04, floor: 0, decimals: 1 }) };
    }
  };

  R['ROE_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ROE', type: 'step', color: C.ret, width: 1.7 }],
    fmt: 'pct',
    hlines: [{ v: 15, label: '15%' }],
    calc: function (d, p, H) {
      // Quarterly partner of ROE_FY: catches the return turn earlier, noisier.
      return { ROE: H.fundamental(d, 'ROE_FQ', { period: 'FQ', base: 19, growth: 0.015, vol: 0.12, floor: 0, decimals: 1 }) };
    }
  };

  R['ROIC_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'ROIC', type: 'step', color: C.roic, width: 1.7 }],
    fmt: 'pct',
    hlines: [{ v: 10, label: '10% ≈ WACC' }],
    calc: function (d, p, H) {
      // The truest return-on-capital: NOPAT over all invested capital (debt + equity).
      return { ROIC: H.fundamental(d, 'ROIC_FY', { period: 'FY', base: 15, growth: 0.01, vol: 0.04, floor: 0, decimals: 1 }) };
    }
  };

  R['EBITTOREVENUE_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'EBITMARGIN', type: 'step', color: C.margin, width: 1.7 }],
    fmt: 'pct',
    calc: function (d, p, H) {
      // Operating (EBIT) margin: profit before interest and tax, over revenue.
      return { EBITMARGIN: H.fundamental(d, 'EBITTOREVENUE_FY', { period: 'FY', base: 25, growth: 0.01, vol: 0.05, floor: 0, cap: 100, decimals: 1 }) };
    }
  };

  R['GROSSMARGIN_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'GROSSMARGIN', type: 'step', color: C.margin, width: 1.7 }],
    fmt: 'pct',
    calc: function (d, p, H) {
      // Quarterly partner of GROSSMARGIN_FY: first to show an input-cost squeeze,
      // with mild seasonality in the cost mix.
      return { GROSSMARGIN: H.fundamental(d, 'GROSSMARGIN_FQ', { period: 'FQ', base: 43, growth: 0.004, vol: 0.035, seasonal: 0.03, floor: 0, cap: 100, decimals: 1 }) };
    }
  };

  R['NAPERSHARE_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'NAVPS', type: 'step', color: C.share, width: 1.7 }],
    fmt: 'perShare',
    calc: function (d, p, H) {
      // Book (net asset) value per share — equity per share, grows with retained earnings.
      return { NAVPS: H.fundamental(d, 'NAPERSHARE_FY', { period: 'FY', base: 18, growth: 0.09, vol: 0.05, floor: 0, decimals: 2 }) };
    }
  };

  R['TAXRATE_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'TAXRATE', type: 'step', color: C.tax, width: 1.7 }],
    fmt: 'pct',
    hlines: [{ v: 21, label: '≈ statutory' }],
    calc: function (d, p, H) {
      // Effective tax rate: tax expense over pre-tax profit. Jumps with one-offs.
      return { TAXRATE: H.fundamental(d, 'TAXRATE_FY', { period: 'FY', base: 21, growth: 0.0, vol: 0.10, floor: 0, cap: 100, decimals: 1 }) };
    }
  };

  R['CURRENTRATIO_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'CURRENTRATIO', type: 'step', color: C.liq, width: 1.7 }],
    fmt: 'ratio',
    hlines: [{ v: 1, label: '1.0' }, { v: 2, label: '2.0' }],
    calc: function (d, p, H) {
      // Quarterly partner of CURRENTRATIO_FY: working-capital stress shows here first.
      return { CURRENTRATIO: H.fundamental(d, 'CURRENTRATIO_FQ', { period: 'FQ', base: 1.9, growth: 0.0, vol: 0.08, floor: 0.2, decimals: 2 }) };
    }
  };

  R['QUICKRATIO_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'QUICKRATIO', type: 'step', color: C.liq2, width: 1.7 }],
    fmt: 'ratio',
    hlines: [{ v: 1, label: '1.0' }],
    calc: function (d, p, H) {
      // Current ratio with inventory stripped out — the acid test, hovers near 1.
      return { QUICKRATIO: H.fundamental(d, 'QUICKRATIO_FQ', { period: 'FQ', base: 1.1, growth: 0.0, vol: 0.09, floor: 0.1, decimals: 2 }) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ---- reg_25_fund_ratios_b.js ---- */
/* =========================================================================
   reg_25_fund_ratios_b.js — FUNDAMENTAL family, batch 25.
   Efficiency & liquidity ratios: quick ratio and the turnover family
   (fixed-asset, inventory, payable, receivable, total-asset).

   Fundamentals are fixed in three ways:
     • pane is always 'sub'          (a figure, not a price overlay)
     • simulated is always true      (needs filings, not OHLCV)
     • the series is 'step'          (holds flat, jumps on the reporting date)
   Value comes from H.fundamental(d, key, opts); the key MUST equal the ID so
   every metric draws its own unique line. Turnover ratios carry larger bases
   than a liquidity ratio; the FQ variants are a single-quarter reading (lower
   magnitude, seasonal, noisier) and the FY variants an annual reading.
   ========================================================================= */
(function (root) {
  'use strict';
  const R = root.FIN.REG = root.FIN.REG || {};

  // Cool, blue-teal-violet palette so the family reads as "fundamental".
  const C = { liq: '#9F7AEA', eff: '#7C9CFF', eff2: '#5AC8FA', eff3: '#4DD0E1', eff4: '#26C6A0', eff5: '#2E9BFF' };

  R['QUICKRATIO_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'QUICKRATIO', type: 'step', color: C.liq, width: 1.7 }],
    fmt: 'ratio',
    hlines: [{ v: 1, label: '1.0' }],
    calc: function (d, p, H) {
      // Acid-test hovers near a small constant; strips inventory out of current ratio.
      return { QUICKRATIO: H.fundamental(d, 'QUICKRATIO_FY', { period: 'FY', base: 1.1, growth: 0.0, vol: 0.05, floor: 0.2, decimals: 2 }) };
    }
  };

  R['FIXEDASSETSTO_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'FIXEDASSETSTO', type: 'step', color: C.eff, width: 1.7 }],
    fmt: 'ratio',
    calc: function (d, p, H) {
      // Single-quarter revenue over net fixed assets — small, seasonal, noisy.
      return { FIXEDASSETSTO: H.fundamental(d, 'FIXEDASSETSTO_FQ', { period: 'FQ', base: 1.15, growth: 0.01, vol: 0.10, seasonal: 0.10, floor: 0.1, decimals: 2 }) };
    }
  };

  R['FIXEDASSETSTO_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'FIXEDASSETSTO', type: 'step', color: C.eff, width: 1.7 }],
    fmt: 'ratio',
    calc: function (d, p, H) {
      // Full-year revenue over net fixed assets — capital intensity read.
      return { FIXEDASSETSTO: H.fundamental(d, 'FIXEDASSETSTO_FY', { period: 'FY', base: 4.6, growth: 0.01, vol: 0.05, floor: 0.1, decimals: 2 }) };
    }
  };

  R['INVENTORYTO_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'INVENTORYTO', type: 'step', color: C.eff2, width: 1.7 }],
    fmt: 'ratio',
    calc: function (d, p, H) {
      // Single-quarter COGS over average inventory — highly seasonal for retail.
      return { INVENTORYTO: H.fundamental(d, 'INVENTORYTO_FQ', { period: 'FQ', base: 1.6, growth: 0.0, vol: 0.12, seasonal: 0.14, floor: 0.1, decimals: 2 }) };
    }
  };

  R['INVENTORYTO_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'INVENTORYTO', type: 'step', color: C.eff2, width: 1.7 }],
    fmt: 'ratio',
    calc: function (d, p, H) {
      // Annual COGS over average inventory — how many times stock cycles a year.
      return { INVENTORYTO: H.fundamental(d, 'INVENTORYTO_FY', { period: 'FY', base: 6.2, growth: 0.0, vol: 0.06, floor: 0.1, decimals: 2 }) };
    }
  };

  R['PAYABLETO_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'PAYABLETO', type: 'step', color: C.eff3, width: 1.7 }],
    fmt: 'ratio',
    calc: function (d, p, H) {
      // Single-quarter purchases over average payables — how fast suppliers are paid.
      return { PAYABLETO: H.fundamental(d, 'PAYABLETO_FQ', { period: 'FQ', base: 1.9, growth: 0.0, vol: 0.11, seasonal: 0.10, floor: 0.1, decimals: 2 }) };
    }
  };

  R['PAYABLETO_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'PAYABLETO', type: 'step', color: C.eff3, width: 1.7 }],
    fmt: 'ratio',
    calc: function (d, p, H) {
      // Annual purchases over average payables — the structural payment pace.
      return { PAYABLETO: H.fundamental(d, 'PAYABLETO_FY', { period: 'FY', base: 7.4, growth: 0.0, vol: 0.05, floor: 0.1, decimals: 2 }) };
    }
  };

  R['RECEIVABLETO_FQ'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'RECEIVABLETO', type: 'step', color: C.eff4, width: 1.7 }],
    fmt: 'ratio',
    calc: function (d, p, H) {
      // Single-quarter sales over average receivables — how fast customers pay.
      return { RECEIVABLETO: H.fundamental(d, 'RECEIVABLETO_FQ', { period: 'FQ', base: 2.1, growth: 0.0, vol: 0.12, seasonal: 0.12, floor: 0.1, decimals: 2 }) };
    }
  };

  R['RECEIVABLETO_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'RECEIVABLETO', type: 'step', color: C.eff4, width: 1.7 }],
    fmt: 'ratio',
    calc: function (d, p, H) {
      // Annual sales over average receivables — the structural collection speed.
      return { RECEIVABLETO: H.fundamental(d, 'RECEIVABLETO_FY', { period: 'FY', base: 8.3, growth: 0.0, vol: 0.05, floor: 0.1, decimals: 2 }) };
    }
  };

  R['TOTALASSETRATE_FY'] = {
    pane: 'sub', simulated: true, params: [],
    series: [{ k: 'TOTALASSETRATE', type: 'step', color: C.eff5, width: 1.7 }],
    fmt: 'ratio',
    hlines: [{ v: 1, label: '1.0' }],
    calc: function (d, p, H) {
      // Revenue over total assets — the DuPont efficiency leg; typically below 1.
      return { TOTALASSETRATE: H.fundamental(d, 'TOTALASSETRATE_FY', { period: 'FY', base: 0.82, growth: 0.005, vol: 0.04, floor: 0.05, decimals: 2 }) };
    }
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
