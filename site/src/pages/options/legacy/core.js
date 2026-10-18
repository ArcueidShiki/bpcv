/* =============================================================================
   core.js — the options maths engine.

   Everything the page computes lives here: Black-Scholes pricing and greeks,
   a generic multi-leg position evaluator (payoff at expiry, mark-to-market
   before expiry, break-evens, max profit / max loss, probability of profit,
   return on risk), and a deterministic synthetic option chain used by the
   Analysis Lab to draw GEX / volume / open-interest / smile / term-structure
   pictures.

   NOTHING here fetches. The page must work from file://.

   Honesty note: the option chain used by the Analysis Lab is SYNTHESISED from
   a seeded PRNG shaped to look like a real chain. It is a teaching picture of
   the *shape* of these charts, not market data. Every panel that uses it is
   badged in the UI.
   ============================================================================= */
(function (root) {
  'use strict';

  var FIN = root.FIN = root.FIN || {};
  var M = FIN.M = {};

  /* ---------------------------------------------------------------- numerics */

  // Abramowitz & Stegun 26.2.17 — |ε| < 7.5e-8, plenty for a teaching page.
  function ncdf(x) {
    if (!isFinite(x)) return x > 0 ? 1 : 0;
    var b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937,
        b4 = -1.821255978, b5 = 1.330274429, p = 0.2316419, c = 0.39894228;
    if (x >= 0) {
      var t = 1 / (1 + p * x);
      return 1 - c * Math.exp(-x * x / 2) * t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    }
    return 1 - ncdf(-x);
  }
  function npdf(x) { return 0.39894228040143267794 * Math.exp(-0.5 * x * x); }

  M.ncdf = ncdf;
  M.npdf = npdf;

  /* ------------------------------------------------------- Black-Scholes 76 */
  /* S spot, K strike, T years, r risk-free, q dividend yield, v vol (decimal) */

  function d1(S, K, T, r, q, v) {
    return (Math.log(S / K) + (r - q + v * v / 2) * T) / (v * Math.sqrt(T));
  }

  function bs(type, S, K, T, r, q, v) {
    var isC = type === 'C';
    // Expiry / degenerate guards — fall back to intrinsic.
    if (!(T > 0) || !(v > 0) || !(S > 0) || !(K > 0)) {
      var intr = isC ? Math.max(S - K, 0) : Math.max(K - S, 0);
      return {
        price: intr,
        delta: isC ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
        gamma: 0, vega: 0, theta: 0, rho: 0
      };
    }
    var sq = Math.sqrt(T), D1 = d1(S, K, T, r, q, v), D2 = D1 - v * sq;
    var dfq = Math.exp(-q * T), dfr = Math.exp(-r * T);
    var Nd1 = ncdf(D1), Nd2 = ncdf(D2), nd1 = npdf(D1);
    var price = isC
      ? S * dfq * Nd1 - K * dfr * Nd2
      : K * dfr * ncdf(-D2) - S * dfq * ncdf(-D1);
    var delta = isC ? dfq * Nd1 : dfq * (Nd1 - 1);
    var gamma = dfq * nd1 / (S * v * sq);
    var vega = S * dfq * nd1 * sq / 100;                    // per 1 vol point
    var theta = (
      -(S * dfq * nd1 * v) / (2 * sq)
      + (isC ? (q * S * dfq * Nd1 - r * K * dfr * Nd2)
             : (-q * S * dfq * ncdf(-D1) + r * K * dfr * ncdf(-D2)))
    ) / 365;                                                // per calendar day
    var rho = (isC ? K * T * dfr * Nd2 : -K * T * dfr * ncdf(-D2)) / 100;
    return { price: price, delta: delta, gamma: gamma, vega: vega, theta: theta, rho: rho };
  }
  M.bs = bs;

  // Newton + bisection fallback. Returns null when no root exists (price
  // outside the no-arbitrage band) rather than a fabricated number.
  M.impliedVol = function (type, mkt, S, K, T, r, q) {
    if (!(T > 0) || !(mkt > 0)) return null;
    var lo = Math.max(0, (type === 'C' ? S * Math.exp(-q * T) - K * Math.exp(-r * T)
                                       : K * Math.exp(-r * T) - S * Math.exp(-q * T)));
    var hi = type === 'C' ? S * Math.exp(-q * T) : K * Math.exp(-r * T);
    if (mkt < lo - 1e-9 || mkt > hi + 1e-9) return null;
    var v = 0.5, i, o;
    for (i = 0; i < 60; i++) {
      o = bs(type, S, K, T, r, q, v);
      var diff = o.price - mkt;
      if (Math.abs(diff) < 1e-7) return v;
      var vg = o.vega * 100;
      if (vg < 1e-8) break;
      var nv = v - diff / vg;
      if (!(nv > 1e-4) || nv > 8) break;
      v = nv;
    }
    var a = 1e-4, b = 8;
    for (i = 0; i < 200; i++) {
      v = (a + b) / 2;
      if (bs(type, S, K, T, r, q, v).price > mkt) b = v; else a = v;
    }
    return v;
  };

  /* ------------------------------------------------------------- a position */
  /*
     A position is a list of legs. Each leg is
       { t: 'C' | 'P' | 'S',   // call, put, or the underlying itself
         q: signed quantity (contracts; +long / -short),
         K: strike (ignored for 'S'),
         T: years to that leg's expiry,
         v: that leg's implied vol }
     plus a shared multiplier (100 for US equity options).
  */

  /* One option contract covers this many shares. A stock leg carries its
     quantity in SHARES (so `greeks` can report position delta directly as a
     share count), while `cost` and `pl` work in per-contract-share units like
     every option leg. Converting between the two is the whole reason this
     constant is named rather than inlined — leaving the stock leg in shares
     multiplied it by 100 a second time in `analyse`, which reported a covered
     call as risking $999,795 instead of $9,800. */
  var SHARES_PER_CONTRACT = 100;

  function legValue(leg, S, T, r, q, vShift) {
    if (leg.t === 'S') return S;
    var v = Math.max(0.01, (leg.v || 0.3) + (vShift || 0));
    return bs(leg.t, S, leg.K, Math.max(T, 0), r, q, v).price;
  }

  // Cost to open (positive = debit paid, negative = credit received), per share.
  M.cost = function (pos, S, r, q) {
    var c = 0;
    for (var i = 0; i < pos.legs.length; i++) {
      var L = pos.legs[i];
      var qty = L.t === 'S' ? L.q / SHARES_PER_CONTRACT : L.q;
      c += qty * legValue(L, S, L.T, r, q, 0);
    }
    return c;
  };

  // P/L per share at a terminal spot ST, `dt` years from now (0 = expiry of the
  // nearest leg is not assumed — each leg decays by its own remaining T - dt).
  M.pl = function (pos, ST, dt, r, q, vShift, cost) {
    var v = 0;
    for (var i = 0; i < pos.legs.length; i++) {
      var L = pos.legs[i];
      var Tr = L.t === 'S' ? 0 : Math.max((L.T || 0) - dt, 0);
      var qty = L.t === 'S' ? L.q / SHARES_PER_CONTRACT : L.q;
      v += qty * (L.t === 'S' ? ST : legValue(L, ST, Tr, r, q, vShift));
    }
    return v - cost;
  };

  M.greeks = function (pos, S, r, q) {
    var g = { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
    for (var i = 0; i < pos.legs.length; i++) {
      var L = pos.legs[i];
      if (L.t === 'S') { g.delta += L.q; continue; }
      var o = bs(L.t, S, L.K, Math.max(L.T, 1 / 3650), r, q, Math.max(0.01, L.v));
      g.delta += L.q * o.delta;
      g.gamma += L.q * o.gamma;
      g.vega += L.q * o.vega;
      g.theta += L.q * o.theta;
      g.rho += L.q * o.rho;
    }
    return g;
  };

  /* --------------------------------------------------- terminal-payoff maths */

  // Longest-dated leg drives the "at expiry" picture.
  M.maxT = function (pos) {
    var T = 0;
    for (var i = 0; i < pos.legs.length; i++) T = Math.max(T, pos.legs[i].T || 0);
    return T;
  };

  // Grid of terminal prices used for every scan below.
  M.grid = function (S, v, T, n) {
    n = n || 601;
    var w = Math.max(0.45, Math.min(2.6, v * Math.sqrt(Math.max(T, 0.02)) * 4.2));
    var lo = Math.max(0.02 * S, S * (1 - w)), hi = S * (1 + w);
    var out = new Array(n);
    for (var i = 0; i < n; i++) out[i] = lo + (hi - lo) * i / (n - 1);
    return out;
  };

  /* Full metric pack for a position.
     Returns per-CONTRACT figures (i.e. already × multiplier × |qty|-aware),
     matching how a broker's strategy screen quotes them. */
  M.analyse = function (pos, S, r, q, mult) {
    mult = mult || 100;
    var T = M.maxT(pos);
    var vAvg = 0, nv = 0, i;
    for (i = 0; i < pos.legs.length; i++) if (pos.legs[i].t !== 'S') { vAvg += pos.legs[i].v; nv++; }
    vAvg = nv ? vAvg / nv : 0.3;

    var cost = M.cost(pos, S, r, q);
    var xs = M.grid(S, vAvg, T, 1201);
    var ys = new Array(xs.length);
    for (i = 0; i < xs.length; i++) ys[i] = M.pl(pos, xs[i], T, r, q, 0, cost);

    // Break-evens: sign changes on the terminal payoff, linearly interpolated.
    var beps = [];
    for (i = 1; i < xs.length; i++) {
      var a = ys[i - 1], b = ys[i];
      if ((a < 0 && b >= 0) || (a > 0 && b <= 0)) {
        var f = a / (a - b);
        beps.push(xs[i - 1] + f * (xs[i] - xs[i - 1]));
      }
    }

    // Max profit / loss. Extend the scan far out so unbounded wings are caught
    // rather than clipped by the plotting window.
    var far = [1e-6 * S, 0.2 * S, 0.5 * S, 4 * S, 12 * S, 60 * S];
    var maxP = -Infinity, maxL = Infinity;
    var probe = xs.concat(far);
    for (i = 0; i < probe.length; i++) {
      var y = M.pl(pos, probe[i], T, r, q, 0, cost);
      if (y > maxP) maxP = y;
      if (y < maxL) maxL = y;
    }
    var yHi = M.pl(pos, 60 * S, T, r, q, 0, cost);
    var yHi2 = M.pl(pos, 120 * S, T, r, q, 0, cost);
    var unboundedUp = Math.abs(yHi2 - yHi) > 1e-6 * S;      // still sloping at ∞
    var unboundedDn = false;                                 // S ≥ 0 bounds the left side
    if (yHi2 < yHi - 1e-6 * S) { unboundedUp = false; unboundedDn = true; }

    // Probability of profit under the risk-neutral lognormal. Same distribution
    // the model used to price the legs, so POP and premium stay consistent.
    var pop = 0, ev = 0, lossW = 0, lossSum = 0;
    var band = [];                          // (weight, P/L) for the tail statistic
    if (T > 0 && vAvg > 0) {
      var sd = vAvg * Math.sqrt(T), mu = Math.log(S) + (r - q - vAvg * vAvg / 2) * T;
      var N = 4000, zLo = -7, zHi = 7;
      for (i = 0; i <= N; i++) {
        var z = zLo + (zHi - zLo) * i / N;
        var ST = Math.exp(mu + sd * z);
        var pl = M.pl(pos, ST, T, r, q, 0, cost);
        var w = npdf(z) * (zHi - zLo) / N;
        if (pl > 0) pop += w;
        // Accumulated undiscounted here and discounted once below. Taking the
        // raw expectation would leave the risk-free drift in: a leg holding
        // stock earns (or, when short, forgoes) carry over the period, which
        // showed up as a −$32 "edge" on a synthetic put that is in fact just
        // one month of interest on a round lot.
        ev += w * pl;
        if (pl < 0) { lossW += w; lossSum += w * pl; }
        band.push([z, w, pl]);
      }
    }

    /* Risk-neutral value: discount the expected terminal payoff back and net
       the cost. For a fairly priced position this is zero — which is exactly
       why no structure in the screener can be ranked above another on it. */
    ev = Math.exp(-r * T) * (ev + cost) - cost;

    /* Conditional tail expectation: the average outcome in the worst 5% of
       cases. This is the column that stops a high win rate from reading as a
       good trade — a short strangle wins ~90% of the time and its CVaR is a
       multiple of everything it collected. Integrated from the bottom of the
       distribution upward rather than read off a single quantile, so a payoff
       that falls off a cliff is not averaged away. */
    var cvar = 0;
    if (band.length) {
      band.sort(function (a, b) { return a[2] - b[2]; });   // worst P/L first
      var want = 0.05, acc = 0, wsum = 0;
      for (i = 0; i < band.length && acc < want; i++) {
        var take = Math.min(band[i][1], want - acc);
        cvar += take * band[i][2];
        acc += take; wsum += take;
      }
      cvar = wsum > 0 ? cvar / wsum : 0;
    }

    // Risk denominator: defined risk → max loss; naked short → an approximate
    // Reg-T style collateral so the "return on collateral" number means something.
    var definedRisk = isFinite(maxL) && !unboundedDn;
    var collateral = 0;
    for (i = 0; i < pos.legs.length; i++) {
      var L = pos.legs[i];
      if (L.q < 0 && L.t !== 'S') collateral += Math.abs(L.q) * (0.2 * S + Math.max(0, L.t === 'C' ? S - L.K : L.K - S));
      if (L.t === 'S') collateral += Math.abs(L.q / SHARES_PER_CONTRACT) * S * 0.5;
    }
    var risk = definedRisk ? Math.abs(maxL) : Math.max(collateral, Math.abs(cost));

    return {
      T: T, iv: vAvg, cost: cost * mult,
      isCredit: cost < 0,
      beps: beps,
      maxProfit: unboundedUp ? Infinity : maxP * mult,
      maxLoss: unboundedDn ? -Infinity : maxL * mult,
      pop: pop,
      ev: ev * mult,
      cvar: cvar * mult,
      avgLoss: lossW > 0 ? (lossSum / lossW) * mult : 0,
      lossProb: lossW,
      risk: risk * mult,
      ror: risk > 0 ? (unboundedUp ? Infinity : maxP / risk) : 0,
      greeks: M.greeks(pos, S, r, q),
      mult: mult
    };
  };

  /* ------------------------------------------------------------ seeded PRNG */

  function rng(seed) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    var s = h >>> 0;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  M.rng = rng;

  /* ------------------------------------------------- synthetic option chain */
  /*
     Deterministic and clearly illustrative. Shaped so the standard analysis
     pictures come out right: a smile that lifts on the downside, open interest
     clustered on round strikes, calls skewed above spot and puts below, and a
     couple of deliberate "walls".
  */
  M.chain = function (opt) {
    opt = opt || {};
    var S = opt.S || 880, T = opt.T || 14 / 365, base = opt.iv || 0.82,
        r = opt.r || 0.038, q = opt.q || 0, seed = opt.seed || 'MU-chain-1';
    var R = rng(seed);
    var step = opt.step || Math.max(1, Math.round(S * 0.0125 / 5) * 5);
    var n = opt.n || 33;
    var k0 = Math.round(S / step) * step - Math.floor(n / 2) * step;

    var callWall = k0 + Math.round(n * 0.68) * step;
    var putWall = k0 + Math.round(n * 0.24) * step;

    var rows = [];
    for (var i = 0; i < n; i++) {
      var K = k0 + i * step;
      var m = Math.log(K / S);
      // Smile: downside skew + mild convexity, the usual equity shape.
      var iv = base * (1 - 0.85 * m + 1.15 * m * m) * (0.96 + 0.08 * R());
      iv = Math.max(0.12, iv);
      var c = bs('C', S, K, T, r, q, iv), p = bs('P', S, K, T, r, q, iv);

      // OI: broad lognormal-ish hump around spot, boosted on round strikes,
      // plus the two walls.
      var dist = Math.abs(K - S) / (S * 0.09);
      var hump = Math.exp(-0.5 * dist * dist);
      var round = (K % (step * 4) === 0) ? 2.1 : (K % (step * 2) === 0 ? 1.35 : 1);
      var cOI = Math.round((hump * round * (K >= S ? 1.55 : 0.7)) * 9000 * (0.55 + R()));
      var pOI = Math.round((hump * round * (K <= S ? 1.65 : 0.55)) * 8200 * (0.55 + R()));
      if (K === callWall) cOI = Math.round(cOI * 3.4 + 9000);
      if (K === putWall) pOI = Math.round(pOI * 3.1 + 8000);

      var cVol = Math.round(cOI * (0.5 + 1.6 * R()));
      var pVol = Math.round(pOI * (0.45 + 1.5 * R()));

      rows.push({
        K: K, iv: iv,
        call: { px: c.price, gamma: c.gamma, delta: c.delta, oi: cOI, vol: cVol },
        put: { px: p.price, gamma: p.gamma, delta: p.delta, oi: pOI, vol: pVol }
      });
    }
    return {
      S: S, T: T, r: r, q: q, step: step, rows: rows,
      callWall: callWall, putWall: putWall, mult: 100
    };
  };

  /* --------------------------------------------------------- GEX from chain */
  /*
     Convention used throughout the page (and stated in the prose): dealers are
     assumed LONG calls / SHORT puts against customer flow, so call gamma
     contributes positively and put gamma negatively. This is the common
     "naive" GEX assumption. It is an assumption, not an observation.

       strike GEX = Γ × OI × multiplier × S²  × 0.01     (dollars per 1% move)
  */
  M.gex = function (ch) {
    var out = [], i, S = ch.S;
    var k = ch.mult * S * S * 0.01;
    for (i = 0; i < ch.rows.length; i++) {
      var row = ch.rows[i];
      var cg = row.call.gamma * row.call.oi * k;
      var pg = -row.put.gamma * row.put.oi * k;
      out.push({ K: row.K, call: cg, put: pg, net: cg + pg });
    }
    return out;
  };

  // Aggregate GEX curve: total net gamma recomputed at hypothetical spot levels.
  M.aggGex = function (ch, xs) {
    var res = [], i, j;
    for (i = 0; i < xs.length; i++) {
      var Sx = xs[i], tot = 0;
      for (j = 0; j < ch.rows.length; j++) {
        var row = ch.rows[j];
        var gc = bs('C', Sx, row.K, ch.T, ch.r, ch.q, row.iv).gamma;
        var gp = bs('P', Sx, row.K, ch.T, ch.r, ch.q, row.iv).gamma;
        tot += (gc * row.call.oi - gp * row.put.oi) * ch.mult * Sx * Sx * 0.01;
      }
      res.push({ S: Sx, gex: tot });
    }
    return res;
  };

  // Zero-gamma / gamma-flip level: where the aggregate curve crosses zero.
  M.gammaFlip = function (agg) {
    for (var i = 1; i < agg.length; i++) {
      var a = agg[i - 1].gex, b = agg[i].gex;
      if ((a < 0 && b >= 0) || (a > 0 && b <= 0)) {
        var f = a / (a - b);
        return agg[i - 1].S + f * (agg[i].S - agg[i - 1].S);
      }
    }
    return null;
  };

  // Max pain: strike minimising total intrinsic value payable to holders.
  M.maxPain = function (ch) {
    var best = null, bestV = Infinity;
    for (var i = 0; i < ch.rows.length; i++) {
      var Sx = ch.rows[i].K, tot = 0;
      for (var j = 0; j < ch.rows.length; j++) {
        var row = ch.rows[j];
        tot += Math.max(0, Sx - row.K) * row.call.oi + Math.max(0, row.K - Sx) * row.put.oi;
      }
      if (tot < bestV) { bestV = tot; best = Sx; }
    }
    return best;
  };

  M.pcr = function (ch) {
    var cv = 0, pv = 0, co = 0, po = 0;
    for (var i = 0; i < ch.rows.length; i++) {
      cv += ch.rows[i].call.vol; pv += ch.rows[i].put.vol;
      co += ch.rows[i].call.oi; po += ch.rows[i].put.oi;
    }
    return { vol: pv / cv, oi: po / co, callVol: cv, putVol: pv, callOI: co, putOI: po };
  };

  /* ----------------------------------------------- expected move / prob cone */

  // ±1σ (68.27%) cone at a set of horizons, risk-neutral drift.
  M.cone = function (S, iv, r, q, days, sigmas) {
    sigmas = sigmas == null ? 1 : sigmas;
    return days.map(function (d) {
      var T = d / 365, sd = iv * Math.sqrt(T);
      var mu = Math.log(S) + (r - q - iv * iv / 2) * T;
      return { d: d, up: Math.exp(mu + sigmas * sd), dn: Math.exp(mu - sigmas * sd), mid: Math.exp(mu) };
    });
  };

  // P(S_T above / below a level) under the same lognormal.
  M.probAbove = function (S, K, iv, T, r, q) {
    if (!(T > 0)) return S > K ? 1 : 0;
    var sd = iv * Math.sqrt(T);
    var z = (Math.log(K / S) - (r - q - iv * iv / 2) * T) / sd;
    return 1 - ncdf(z);
  };

  // Straddle-implied expected move, the number a chain screen usually shows.
  M.expectedMove = function (S, iv, T) { return S * iv * Math.sqrt(T) * 0.7979; };

  /* -------------------------------------------------------- IV rank / pctl */

  M.ivRank = function (cur, lo, hi) { return hi > lo ? (cur - lo) / (hi - lo) * 100 : 0; };
  M.ivPctl = function (cur, series) {
    if (!series || !series.length) return 0;
    var c = 0;
    for (var i = 0; i < series.length; i++) if (series[i] < cur) c++;
    return c / series.length * 100;
  };

  // A year of plausible IV history, for the IV-rank illustration.
  M.ivHistory = function (seed, base, n) {
    var R = rng(seed || 'iv-hist'), out = [], v = base;
    n = n || 252;
    for (var i = 0; i < n; i++) {
      v += (base - v) * 0.035 + (R() - 0.5) * base * 0.11;
      if (i % 63 === 60) v += base * 0.35;              // earnings bumps
      v = Math.max(base * 0.42, Math.min(base * 1.85, v));
      out.push(v);
    }
    return out;
  };

  /* ------------------------------------------------------------- formatting */

  M.fmt = function (x, d) {
    if (x === Infinity) return '∞';
    if (x === -Infinity) return '−∞';
    if (x == null || !isFinite(x)) return '—';
    d = d == null ? 2 : d;
    return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  M.money = function (x) {
    if (x === Infinity) return '∞';
    if (x === -Infinity) return 'Unlimited';
    if (x == null || !isFinite(x)) return '—';
    return (x < 0 ? '−$' : '$') + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  M.pct = function (x, d) {
    if (x === Infinity) return '∞';
    if (x == null || !isFinite(x)) return '—';
    return (x * 100).toFixed(d == null ? 2 : d) + '%';
  };
  M.compact = function (x) {
    var a = Math.abs(x);
    if (a >= 1e9) return (x / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (x / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (x / 1e3).toFixed(2) + 'K';
    return x.toFixed(0);
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
