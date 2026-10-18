/* =========================================================================
   chart.js — canvas candlestick renderer with stacked indicator panes.

   Why hand-rolled instead of a charting library: the page must be a single
   self-contained file (no CDN, no external requests), and the pane model
   here is driven directly by the registry's `pane` flag — the same flag the
   source Python files encode as `indicator(abbr, name, isMainChart)`.
   ========================================================================= */
(function (root) {
  'use strict';

  const H = root.FIN.H;

  const THEME = {
    bg: 'transparent',
    grid: 'rgba(255,255,255,0.055)',
    axis: 'rgba(255,255,255,0.35)',
    text: 'rgba(226,232,240,0.72)',
    textDim: 'rgba(148,163,184,0.75)',
    up: '#26a69a',
    dn: '#ef5350',
    upFill: '#26a69a',
    dnFill: '#ef5350',
    cross: 'rgba(255,255,255,0.4)',
    paneLine: 'rgba(255,255,255,0.10)'
  };

  // Fallback palette for series that do not declare a colour.
  const PALETTE = ['#FF8D1E', '#0CAEE6', '#E970DC', '#9BE564', '#FFC90E',
    '#7C9CFF', '#FF6B6B', '#4ECDC4', '#C77DFF', '#FFD6A5'];

  function fmtNum(x, dp) {
    if (!H.num(x)) return '—';
    const a = Math.abs(x);
    if (a >= 1e9) return (x / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (x / 1e6).toFixed(2) + 'M';
    if (a >= 1e4) return (x / 1e3).toFixed(1) + 'K';
    if (dp != null) return x.toFixed(dp);
    if (a >= 100) return x.toFixed(2);
    if (a >= 1) return x.toFixed(3);
    return x.toFixed(4);
  }
  // Fundamentals declare a `fmt` so their axis and legend read in the metric's
  // own units (a margin as 43.0%, revenue as $7.80B) instead of a bare number.
  function fmtVal(x, fmt) {
    if (!H.num(x)) return '—';
    if (fmt === 'pct') return x.toFixed(1) + '%';
    if (fmt === 'ratio') return x.toFixed(2) + '×';
    if (fmt === 'money') return '$' + fmtNum(x);
    return fmtNum(x);
  }
  function fmtDate(ms) {
    const d = new Date(ms);
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return d.getUTCFullYear() + '-' + mm + '-' + dd;
  }

  /* ---------------------------------------------------------------------
     Chart
     opts: { canvas, data, mini:bool, onHover:fn }
     Active indicators are held as {id, spec, params, values, error}.
     --------------------------------------------------------------------- */
  function Chart(opts) {
    this.canvas = opts.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.data = opts.data;
    this.mini = !!opts.mini;
    this.onHover = opts.onHover || null;
    this.active = [];                    // ordered list of active indicators
    this.showVolume = opts.showVolume !== false && !this.mini;
    this.i0 = 0;
    this.i1 = this.data.n - 1;
    this.hover = -1;
    this.panes = [];
    this._dragging = false;
    if (!this.mini) this._bindEvents();
  }

  Chart.prototype.setData = function (data) {
    this.data = data;
    this.i0 = 0; this.i1 = data.n - 1;
    this.recomputeAll();
  };

  /* ---- indicator lifecycle ------------------------------------------- */
  Chart.prototype.has = function (id) {
    return this.active.some(function (a) { return a.id === id; });
  };
  Chart.prototype.add = function (id, params) {
    const spec = root.FIN.REG[id];
    if (!spec || this.has(id)) return null;
    const p = {};
    (spec.params || []).forEach(function (q) { p[q.k] = q.d; });
    if (params) Object.keys(params).forEach(function (k) { p[k] = params[k]; });
    const entry = { id: id, spec: spec, params: p, values: null, error: null, visible: true };
    this.active.push(entry);
    this.compute(entry);
    this.render();
    return entry;
  };
  Chart.prototype.remove = function (id) {
    this.active = this.active.filter(function (a) { return a.id !== id; });
    this.render();
  };
  Chart.prototype.clear = function () { this.active = []; this.render(); };
  Chart.prototype.get = function (id) {
    return this.active.filter(function (a) { return a.id === id; })[0] || null;
  };

  /* A single broken calc() must never blank the page — 146 hand-written
     formulas guarantee at least one surprise. Failures degrade to a badge. */
  Chart.prototype.compute = function (entry) {
    try {
      const out = entry.spec.calc(this.data, entry.params, H);
      if (!out || typeof out !== 'object') throw new Error('calc returned no data');
      entry.values = out;
      entry.error = null;
    } catch (e) {
      entry.values = null;
      entry.error = e && e.message ? e.message : String(e);
    }
  };
  Chart.prototype.recomputeAll = function () {
    const self = this;
    this.active.forEach(function (e) { self.compute(e); });
    this.render();
  };

  /* ---- pane layout ---------------------------------------------------- */
  Chart.prototype.buildPanes = function () {
    const panes = [];
    const mainOverlays = this.active.filter(function (a) { return a.spec.pane === 'main' && a.visible; });
    panes.push({ kind: 'price', weight: this.mini ? 3 : 3.4, items: mainOverlays });
    if (this.showVolume) panes.push({ kind: 'volume', weight: 0.75, items: [] });
    this.active.forEach(function (a) {
      if (a.spec.pane === 'sub' && a.visible) panes.push({ kind: 'ind', weight: 1.15, items: [a] });
    });
    this.panes = panes;
    return panes;
  };

  /* ---- geometry -------------------------------------------------------- */
  Chart.prototype.layout = function () {
    const dpr = Math.min(root.devicePixelRatio || 1, 2);
    const cssW = this.canvas.clientWidth || 800;
    const padR = this.mini ? 42 : 62;
    const padL = this.mini ? 4 : 8;
    const padT = this.mini ? 4 : 10;
    const padB = this.mini ? 16 : 26;

    const panes = this.buildPanes();
    const totalWeight = panes.reduce(function (s, p) { return s + p.weight; }, 0);
    const minTotal = this.mini ? 150 : 340;
    // Nothing stops a user from enabling all 146 indicators at once. Browsers
    // refuse to allocate a canvas taller than ~16k device pixels and silently
    // render nothing, so the per-pane height shrinks to stay inside the budget
    // rather than the chart disappearing.
    const MAX_DEVICE_PX = 15000;
    const maxCssH = MAX_DEVICE_PX / dpr;
    let perUnit = this.mini ? 46 : 78;
    if (totalWeight * perUnit + padT + padB > maxCssH) {
      perUnit = Math.max(18, (maxCssH - padT - padB) / totalWeight);
    }
    const bodyH = Math.max(minTotal, totalWeight * perUnit);
    const cssH = bodyH + padT + padB;

    this.canvas.style.height = cssH + 'px';
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let y = padT;
    const gap = this.mini ? 6 : 12;
    const usable = bodyH - gap * (panes.length - 1);
    panes.forEach(function (p) {
      p.h = (p.weight / totalWeight) * usable;
      p.y = y;
      y += p.h + gap;
    });

    this.geo = {
      w: cssW, h: cssH, padL: padL, padR: padR, padT: padT, padB: padB,
      plotW: cssW - padL - padR, plotX: padL
    };
    return this.geo;
  };

  Chart.prototype.xOf = function (i) {
    const g = this.geo;
    const span = Math.max(1, this.i1 - this.i0);
    return g.plotX + ((i - this.i0) / span) * g.plotW;
  };
  Chart.prototype.iOf = function (px) {
    const g = this.geo;
    const span = Math.max(1, this.i1 - this.i0);
    const i = this.i0 + ((px - g.plotX) / g.plotW) * span;
    return Math.max(this.i0, Math.min(this.i1, Math.round(i)));
  };
  Chart.prototype.barW = function () {
    const g = this.geo;
    const count = this.i1 - this.i0 + 1;
    return Math.max(1, (g.plotW / count) * 0.66);
  };

  /* Vertical scale for one pane, derived from whatever is visible in it. */
  Chart.prototype.scaleFor = function (pane) {
    const self = this;
    let lo = Infinity, hi = -Infinity;

    function consider(arr) {
      if (!arr) return;
      for (let i = self.i0; i <= self.i1; i++) {
        const x = arr[i];
        if (H.num(x)) { if (x < lo) lo = x; if (x > hi) hi = x; }
      }
    }

    if (pane.kind === 'price') {
      consider(this.data.h); consider(this.data.l);
      pane.items.forEach(function (a) {
        if (!a.values) return;
        a.spec.series.forEach(function (s) { consider(a.values[s.k]); });
      });
    } else if (pane.kind === 'volume') {
      consider(this.data.v);
      lo = 0;
    } else {
      const a = pane.items[0];
      if (a.spec.range) { lo = a.spec.range[0]; hi = a.spec.range[1]; }
      else {
        if (a.values) a.spec.series.forEach(function (s) { consider(a.values[s.k]); });
        (a.spec.hlines || []).forEach(function (hl) { if (hl.v < lo) lo = hl.v; if (hl.v > hi) hi = hl.v; });
        if (a.spec.zeroBase) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
      }
    }
    if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
    // A flat window (e.g. zoomed into a single quarter of a step series) must
    // still get a sensible band — a fixed ±1 is meaningless around a value of
    // 5e9, so pad relative to the magnitude.
    if (lo === hi) { const e = Math.max(Math.abs(lo) * 0.05, 1e-6); lo -= e; hi += e; }
    const padFrac = pane.kind === 'volume' ? 0.06 : 0.09;
    const pad = (hi - lo) * padFrac;
    pane.lo = lo - (pane.kind === 'volume' ? 0 : pad);
    pane.hi = hi + pad;
    pane.yOf = function (v) {
      return pane.y + pane.h - ((v - pane.lo) / (pane.hi - pane.lo)) * pane.h;
    };
    return pane;
  };

  /* ---- drawing --------------------------------------------------------- */
  Chart.prototype.render = function () {
    if (!this.canvas.isConnected && !this.mini) return;
    const g = this.layout();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, g.w, g.h);

    const self = this;
    this.panes.forEach(function (p) { self.scaleFor(p); });

    this.panes.forEach(function (p, idx) {
      self.drawGrid(p, idx);
      if (p.kind === 'price') self.drawCandles(p);
      else if (p.kind === 'volume') self.drawVolume(p);
      else self.drawIndicatorPane(p);
      self.drawYAxis(p);
    });

    this.drawXAxis();
    if (this.hover >= 0) this.drawCrosshair();
    if (this.onHover) this.onHover(this.hover >= 0 ? this.hover : this.i1);
  };

  Chart.prototype.drawGrid = function (pane, idx) {
    const ctx = this.ctx, g = this.geo;
    ctx.strokeStyle = THEME.grid;
    ctx.lineWidth = 1;
    const rows = pane.kind === 'price' ? 5 : 3;
    for (let r = 0; r <= rows; r++) {
      const y = Math.round(pane.y + (pane.h * r) / rows) + 0.5;
      ctx.beginPath(); ctx.moveTo(g.plotX, y); ctx.lineTo(g.plotX + g.plotW, y); ctx.stroke();
    }
    // Vertical gridlines only on the top pane, extended down by the others'
    // own horizontal grid — keeps the mini charts from looking like graph paper.
    if (idx === 0) {
      const cols = this.mini ? 4 : 8;
      for (let cIdx = 0; cIdx <= cols; cIdx++) {
        const x = Math.round(g.plotX + (g.plotW * cIdx) / cols) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, g.padT); ctx.lineTo(x, g.h - g.padB); ctx.stroke();
      }
    }
    if (idx > 0) {
      ctx.strokeStyle = THEME.paneLine;
      const y = Math.round(pane.y) + 0.5;
      ctx.beginPath(); ctx.moveTo(g.plotX, y); ctx.lineTo(g.plotX + g.plotW, y); ctx.stroke();
    }
  };

  Chart.prototype.drawCandles = function (pane) {
    const ctx = this.ctx, d = this.data;
    const bw = this.barW();
    const half = bw / 2;
    for (let i = this.i0; i <= this.i1; i++) {
      const x = this.xOf(i);
      const up = d.c[i] >= d.o[i];
      const col = up ? THEME.up : THEME.dn;
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 1;
      // wick
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, pane.yOf(d.h[i]));
      ctx.lineTo(Math.round(x) + 0.5, pane.yOf(d.l[i]));
      ctx.stroke();
      // body
      const yo = pane.yOf(d.o[i]), yc = pane.yOf(d.c[i]);
      const top = Math.min(yo, yc);
      const hgt = Math.max(1, Math.abs(yc - yo));
      if (bw <= 1.6) {
        ctx.fillRect(Math.round(x), top, 1, hgt);
      } else if (up) {
        ctx.fillRect(Math.round(x - half), Math.round(top), Math.round(bw), Math.round(hgt));
      } else {
        ctx.fillRect(Math.round(x - half), Math.round(top), Math.round(bw), Math.round(hgt));
      }
    }
    const self = this;
    pane.items.forEach(function (a, n) { self.drawSeriesOf(a, pane, n); });
    this.drawLegend(pane, pane.items, null);
  };

  Chart.prototype.drawVolume = function (pane) {
    const ctx = this.ctx, d = this.data;
    const bw = this.barW();
    for (let i = this.i0; i <= this.i1; i++) {
      const x = this.xOf(i);
      const up = d.c[i] >= d.o[i];
      ctx.fillStyle = up ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)';
      const y = pane.yOf(d.v[i]);
      const y0 = pane.yOf(0);
      ctx.fillRect(Math.round(x - bw / 2), Math.round(y), Math.max(1, Math.round(bw)), Math.max(1, Math.round(y0 - y)));
    }
    this.drawLegendText(pane, 'VOLUME', THEME.textDim);
  };

  Chart.prototype.drawIndicatorPane = function (pane) {
    const a = pane.items[0];
    const ctx = this.ctx, g = this.geo;
    (a.spec.hlines || []).forEach(function (hl) {
      const y = Math.round(pane.yOf(hl.v)) + 0.5;
      if (y < pane.y - 2 || y > pane.y + pane.h + 2) return;
      ctx.save();
      ctx.strokeStyle = hl.color || 'rgba(255,255,255,0.22)';
      ctx.setLineDash(hl.dash || [4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(g.plotX, y); ctx.lineTo(g.plotX + g.plotW, y); ctx.stroke();
      ctx.restore();
    });
    if (a.error) {
      ctx.fillStyle = '#ef5350';
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('⚠ ' + a.id + ' — calculation error: ' + a.error, g.plotX + 8, pane.y + pane.h / 2);
      return;
    }
    this.drawSeriesOf(a, pane, 0);
    this.drawLegend(pane, [a], a);
  };

  Chart.prototype.drawSeriesOf = function (a, pane, ordinal) {
    if (!a.values || a.error) return;
    const ctx = this.ctx;
    const self = this;
    // Bands are painted before lines so the fill never covers the strokes.
    a.spec.series.forEach(function (s, si) {
      if (!s.fillTo) return;
      const A = a.values[s.k], B = a.values[s.fillTo];
      if (!A || !B) return;
      ctx.save();
      ctx.fillStyle = s.fill || 'rgba(120,160,255,0.08)';
      ctx.beginPath();
      let started = false;
      for (let i = self.i0; i <= self.i1; i++) {
        if (!H.num(A[i])) continue;
        const x = self.xOf(i), y = pane.yOf(A[i]);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      for (let i = self.i1; i >= self.i0; i--) {
        if (!H.num(B[i])) continue;
        ctx.lineTo(self.xOf(i), pane.yOf(B[i]));
      }
      if (started) { ctx.closePath(); ctx.fill(); }
      ctx.restore();
      void si;
    });

    a.spec.series.forEach(function (s, si) {
      const arr = a.values[s.k];
      if (!arr) return;
      const color = s.color || PALETTE[(ordinal * 3 + si) % PALETTE.length];
      if (s.type === 'hist') self.drawHist(arr, pane, s, color);
      else if (s.type === 'dots') self.drawDots(arr, pane, s, color);
      else self.drawLine(arr, pane, s, color, s.type === 'step');
    });
  };

  Chart.prototype.drawLine = function (arr, pane, s, color, step) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = s.width || 1.35;
    ctx.lineJoin = 'round';
    if (s.dash) ctx.setLineDash(s.dash);
    ctx.beginPath();
    // A stepped series (fundamentals: quarterly/annual figures) holds its
    // value flat, then jumps vertically on the reporting bar — never a
    // diagonal, which would imply values the filing never reported.
    let pen = false, py = 0;
    for (let i = this.i0; i <= this.i1; i++) {
      const v = arr[i];
      if (!H.num(v)) { pen = false; continue; }
      const x = this.xOf(i), y = pane.yOf(v);
      if (!pen) { ctx.moveTo(x, y); pen = true; }
      else if (step) { ctx.lineTo(x, py); ctx.lineTo(x, y); }
      else ctx.lineTo(x, y);
      py = y;
    }
    ctx.stroke();
    ctx.restore();
  };

  Chart.prototype.drawHist = function (arr, pane, s, color) {
    const ctx = this.ctx;
    const bw = Math.max(1, this.barW() * 0.8);
    const base = pane.lo <= 0 && pane.hi >= 0 ? pane.yOf(0) : pane.yOf(pane.lo);
    for (let i = this.i0; i <= this.i1; i++) {
      const v = arr[i];
      if (!H.num(v)) continue;
      ctx.fillStyle = s.colorBy === 'sign' ? (v >= 0 ? THEME.up : THEME.dn) : color;
      const y = pane.yOf(v);
      ctx.fillRect(Math.round(this.xOf(i) - bw / 2), Math.round(Math.min(y, base)),
        Math.round(bw), Math.max(1, Math.round(Math.abs(base - y))));
    }
  };

  Chart.prototype.drawDots = function (arr, pane, s, color) {
    const ctx = this.ctx;
    const r = s.radius || (this.mini ? 1.2 : 1.9);
    ctx.fillStyle = color;
    for (let i = this.i0; i <= this.i1; i++) {
      const v = arr[i];
      if (!H.num(v)) continue;
      ctx.beginPath();
      ctx.arc(this.xOf(i), pane.yOf(v), r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  Chart.prototype.drawLegendText = function (pane, text, color) {
    const ctx = this.ctx, g = this.geo;
    ctx.save();
    ctx.font = (this.mini ? '9px' : '10.5px') + ' ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = color || THEME.textDim;
    ctx.fillText(text, g.plotX + 6, pane.y + 4);
    ctx.restore();
  };

  Chart.prototype.drawLegend = function (pane, items, single) {
    if (!items.length) return;
    const ctx = this.ctx, g = this.geo;
    const idx = this.hover >= 0 ? this.hover : this.i1;
    ctx.save();
    ctx.font = (this.mini ? '9px' : '10.5px') + ' ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    let x = g.plotX + 6;
    const y = pane.y + 4;
    const self = this;
    items.forEach(function (a) {
      ctx.fillStyle = THEME.text;
      const label = a.id + (a.spec.simulated ? ' ~' : '');
      ctx.fillText(label, x, y);
      x += ctx.measureText(label).width + 8;
      if (a.error) {
        ctx.fillStyle = '#ef5350'; ctx.fillText('ERR', x, y); x += 30; return;
      }
      a.spec.series.forEach(function (s) {
        const arr = a.values ? a.values[s.k] : null;
        const v = arr ? arr[idx] : null;
        ctx.fillStyle = s.color || PALETTE[0];
        const txt = s.k + ':' + (a.spec.fmt ? fmtVal(v, a.spec.fmt) : fmtNum(v));
        ctx.fillText(txt, x, y);
        x += ctx.measureText(txt).width + 8;
      });
      if (x > g.plotX + g.plotW - 40) x = g.plotX + 6;
      void self;
    });
    ctx.restore();
    void single;
  };

  Chart.prototype.drawYAxis = function (pane) {
    const ctx = this.ctx, g = this.geo;
    ctx.save();
    ctx.font = (this.mini ? '9px' : '10px') + ' ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = THEME.textDim;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const paneFmt = (pane.kind === 'ind' && pane.items[0] && pane.items[0].spec.fmt) || null;
    const rows = pane.kind === 'price' ? 5 : 3;
    for (let r = 0; r <= rows; r++) {
      const frac = r / rows;
      const val = pane.hi - (pane.hi - pane.lo) * frac;
      const y = pane.y + pane.h * frac;
      ctx.fillText(paneFmt ? fmtVal(val, paneFmt) : fmtNum(val), g.plotX + g.plotW + 6, y);
    }
    ctx.restore();
  };

  Chart.prototype.drawXAxis = function () {
    const ctx = this.ctx, g = this.geo, d = this.data;
    ctx.save();
    ctx.font = (this.mini ? '9px' : '10px') + ' ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = THEME.textDim;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const cols = this.mini ? 3 : 7;
    for (let c = 0; c <= cols; c++) {
      const i = Math.round(this.i0 + ((this.i1 - this.i0) * c) / cols);
      const x = this.xOf(i);
      if (x < g.plotX + 18 || x > g.plotX + g.plotW - 18) continue;
      ctx.fillText(fmtDate(d.t[i]).slice(this.mini ? 5 : 0), x, g.h - g.padB + 6);
    }
    ctx.restore();
  };

  Chart.prototype.drawCrosshair = function () {
    const ctx = this.ctx, g = this.geo;
    const x = Math.round(this.xOf(this.hover)) + 0.5;
    ctx.save();
    ctx.strokeStyle = THEME.cross;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, g.padT); ctx.lineTo(x, g.h - g.padB); ctx.stroke();
    if (this._my != null) {
      const y = Math.round(this._my) + 0.5;
      ctx.beginPath(); ctx.moveTo(g.plotX, y); ctx.lineTo(g.plotX + g.plotW, y); ctx.stroke();
    }
    ctx.restore();
    // Date pill under the crosshair.
    ctx.save();
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    const label = fmtDate(this.data.t[this.hover]);
    const w = ctx.measureText(label).width + 10;
    ctx.fillStyle = 'rgba(15,23,42,0.92)';
    ctx.fillRect(x - w / 2, g.h - g.padB + 3, w, 15);
    ctx.fillStyle = THEME.text;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(label, x, g.h - g.padB + 6);
    ctx.restore();
  };

  /* ---- interaction ----------------------------------------------------- */
  Chart.prototype._bindEvents = function () {
    const self = this;
    const cv = this.canvas;

    cv.addEventListener('mousemove', function (e) {
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left;
      self._my = e.clientY - r.top;
      if (self._dragging) {
        const dx = mx - self._dragX;
        const span = self.i1 - self.i0;
        const shift = Math.round(-(dx / self.geo.plotW) * span);
        if (shift !== 0) {
          let a = self.i0 + shift, b = self.i1 + shift;
          if (a < 0) { b -= a; a = 0; }
          if (b > self.data.n - 1) { a -= (b - (self.data.n - 1)); b = self.data.n - 1; }
          self.i0 = Math.max(0, a); self.i1 = b;
          self._dragX = mx;
        }
      }
      self.hover = self.iOf(mx);
      self.render();
    });
    cv.addEventListener('mouseleave', function () { self.hover = -1; self._my = null; self._dragging = false; self.render(); });
    cv.addEventListener('mousedown', function (e) {
      const r = cv.getBoundingClientRect();
      self._dragging = true; self._dragX = e.clientX - r.left;
      cv.style.cursor = 'grabbing';
    });
    root.addEventListener('mouseup', function () { self._dragging = false; cv.style.cursor = 'crosshair'; });

    cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const anchor = self.iOf(e.clientX - r.left);
      const span = self.i1 - self.i0;
      const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;
      let newSpan = Math.round(span * factor);
      newSpan = Math.max(24, Math.min(self.data.n - 1, newSpan));
      const leftFrac = span > 0 ? (anchor - self.i0) / span : 0.5;
      let a = Math.round(anchor - leftFrac * newSpan);
      let b = a + newSpan;
      if (a < 0) { b -= a; a = 0; }
      if (b > self.data.n - 1) { a -= (b - (self.data.n - 1)); b = self.data.n - 1; }
      self.i0 = Math.max(0, a); self.i1 = b;
      self.render();
    }, { passive: false });

    cv.style.cursor = 'crosshair';
  };

  Chart.prototype.resetZoom = function () {
    this.i0 = 0; this.i1 = this.data.n - 1; this.render();
  };

  root.FIN.Chart = Chart;
  root.FIN.THEME = THEME;
  root.FIN.PALETTE = PALETTE;
  root.FIN.fmtNum = fmtNum;
  root.FIN.fmtDate = fmtDate;

})(typeof globalThis !== 'undefined' ? globalThis : this);
