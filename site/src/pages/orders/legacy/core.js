/* =============================================================================
   core.js — the order-execution simulator.

   A seeded intraday tape (price path + volume profile + a quoted book), and an
   execution engine that walks any order type across that tape bar by bar and
   reports what actually happened: where it triggered, where it filled, how much
   of it filled, and what the slippage was against the price at the moment you
   pressed the button.

   The point of the whole page is that order TYPE is a decision about which risk
   you accept — price risk or execution risk — and you cannot avoid both. The
   simulator exists to make that trade-off visible instead of asserted.

   Honesty notes, carried into the UI:
   - The tape is SYNTHETIC, from a seeded PRNG. It is shaped like a real session
     (open/close volume smile, mean-reverting spread, occasional gaps) but it is
     not market data.
   - Execution is simulated at BAR granularity, not order by order. Real queue
     position depends on the exact microsecond you arrived and on everyone
     else's cancellations. This model approximates queue priority; it cannot
     reproduce it.
   - Every broker's fine print differs — trigger on last vs bid/ask, whether a
     stop is held on the exchange or on the broker's server, what happens on a
     halt. The page says so where it matters.
   ============================================================================= */
(function (root) {
  'use strict';

  var FIN = root.FIN = root.FIN || {};
  var M = FIN.M = {};

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

  function gauss(R) {
    var u = 1 - R(), v = R();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307179586 * v);
  }

  /* --------------------------------------------------------------- the tape */
  /*
     One session, `n` bars. Returns arrays the whole engine reads:
       t     bar index
       o,h,l,c   OHLC for the bar
       mid   mid quote at the close of the bar
       spr   quoted spread in ticks
       vol   shares traded in the bar
     plus `bid`/`ask` derived from mid and spread, and a cumulative VWAP.

     Shape choices that matter for teaching:
     - volume follows the classic U (heavy at the open and into the close)
     - spread is widest at the open, tightens midday, widens slightly at the close
     - drift is small; the visible move comes from a trend term plus noise, and
       `shock` optionally injects one gap so stop behaviour can be shown honestly
  */
  M.tape = function (o) {
    o = o || {};
    var n = o.n || 240,
        S0 = o.S0 || 100,
        sigma = o.sigma == null ? 0.28 : o.sigma,     // annualised
        trend = o.trend == null ? 0 : o.trend,        // total drift over the session, in %
        tick = o.tick || 0.01,
        adv = o.adv || 4000000,                       // average daily volume
        shock = o.shock || 0,                         // gap size in %, 0 = none
        shockAt = o.shockAt == null ? 0.55 : o.shockAt,
        R = rng(o.seed || 'tape-1');

    var perBar = sigma / Math.sqrt(252 * n);          // per-bar sd
    var t = [], op = [], hi = [], lo = [], cl = [], mid = [], spr = [], vol = [];
    var px = S0, cumPV = 0, cumV = 0;
    var shockBar = Math.floor(n * shockAt);

    for (var i = 0; i < n; i++) {
      var u = i / (n - 1);
      // U-shaped volume profile, with noise
      var shape = 0.55 + 1.9 * (Math.exp(-u * 7) + Math.exp(-(1 - u) * 5.5));
      var v = Math.max(1, Math.round(adv / n * shape * (0.55 + 0.9 * R())));

      // A real gap happens BETWEEN bars — the market reopens somewhere else and
      // never trades the prices in between. Adding the shock to the bar's move
      // instead would let every resting order pretend it got filled on the way
      // down, which is exactly the fiction this page exists to puncture.
      var o_ = px;
      if (shock && i === shockBar) o_ = Math.max(tick, px * (1 + shock / 100));
      var step = perBar * gauss(R) * o_ + trend / 100 * S0 / n;
      px = Math.max(tick, o_ + step);

      // intrabar range scales with the bar's own volatility and volume
      var rng_ = Math.abs(step) + perBar * px * (0.6 + 0.9 * R());
      // a gap bar's high/low bracket the NEW level, not the old one
      var h_ = Math.max(o_, px) + rng_ * R() * 0.8;
      var l_ = Math.min(o_, px) - rng_ * R() * 0.8;

      // spread: wide at the open, tight midday, a touch wider into the close
      var sTicks = Math.max(1, Math.round(1 + 6 * Math.exp(-u * 9) + 1.6 * Math.exp(-(1 - u) * 8) + R() * 0.9));

      t.push(i); op.push(o_); hi.push(h_); lo.push(l_); cl.push(px);
      mid.push(px); spr.push(sTicks); vol.push(v);
      cumPV += px * v; cumV += v;
    }

    var bid = [], ask = [];
    for (i = 0; i < n; i++) {
      bid.push(mid[i] - spr[i] * tick / 2);
      ask.push(mid[i] + spr[i] * tick / 2);
    }

    // running VWAP — the benchmark most execution algos are graded against
    var vwap = [], pv = 0, vv = 0;
    for (i = 0; i < n; i++) {
      pv += ((hi[i] + lo[i] + cl[i]) / 3) * vol[i]; vv += vol[i];
      vwap.push(pv / vv);
    }

    return {
      n: n, tick: tick, t: t, o: op, h: hi, l: lo, c: cl,
      mid: mid, spr: spr, vol: vol, bid: bid, ask: ask, vwap: vwap,
      totalVol: vv, sessionVwap: pv / vv, S0: S0,
      shockBar: shock ? shockBar : null
    };
  };

  /* ---------------------------------------------------------------- the book */
  /*
     A depth ladder around the quote. Size at each level grows as you step away
     from the touch, which is why a large market order gets a worse average
     price than the screen suggests — it eats the thin levels first.
  */
  M.book = function (tp, i, levels) {
    levels = levels || 8;
    var R = rng('book-' + i);
    var tick = tp.tick, out = { bids: [], asks: [] };
    // typical size at the touch scales with the bar's volume
    var base = Math.max(100, Math.round(tp.vol[i] / 90 / 100) * 100);
    for (var k = 0; k < levels; k++) {
      var grow = 1 + k * 0.75;
      out.asks.push({ px: tp.ask[i] + k * tick, sz: Math.round(base * grow * (0.6 + 0.8 * R()) / 100) * 100 });
      out.bids.push({ px: tp.bid[i] - k * tick, sz: Math.round(base * grow * (0.6 + 0.8 * R()) / 100) * 100 });
    }
    return out;
  };

  /* Walk the book for `qty`, return {px, filled, levels}. This is where market
     orders lose money that a limit order would not have lost. */
  M.sweep = function (tp, i, side, qty) {
    // Walk a deep ladder, not just the eight levels the UI draws. Stopping at
    // fourteen and then extrapolating linearly produced absurd prices for large
    // orders (a 250k order priced 22% through the book), which is a modelling
    // artefact rather than a fact about markets.
    var bk = M.book(tp, i, 40);
    var side_ = side === 'buy' ? bk.asks : bk.bids;
    var left = qty, cost = 0, used = 0, lv = 0;
    for (var k = 0; k < side_.length && left > 0; k++) {
      var take = Math.min(left, side_[k].sz);
      cost += take * side_[k].px; left -= take; used += take; lv = k + 1;
    }
    var overflow = false;
    if (left > 0) {
      // Past even that, impact follows the usual square-root law rather than
      // growing linearly in shares — linear growth is what made the old model
      // silly, and √ is the standard empirical shape.
      overflow = true;
      var last = side_[side_.length - 1].px;
      var extra = (side === 'buy' ? 1 : -1) * tp.tick * 2.5 * Math.sqrt(left / Math.max(1, side_[0].sz));
      cost += left * (last + extra); used += left;
    }
    return { px: cost / used, filled: used, levels: lv, overflow: overflow };
  };

  /* ------------------------------------------------------- execution engine */
  /*
     Every order type is a function of (ctx) that returns:
       { fills: [{i, px, qty}], events: [{i, kind, label}], done, reason }

     ctx = {
       tape, side ('buy'|'sell'), qty, start, end,
       limit, stop, trail, display, pov, slices, tp, sl
     }

     `events` drive the annotations on the chart: placed, triggered, filled,
     partially filled, cancelled, expired.
  */

  function ev(i, kind, label) { return { i: i, kind: kind, label: label }; }

  // Can a resting limit order trade at `L` on bar i? Requires the market to
  // print at or through the price. Queue priority is approximated: you get a
  // share of the bar's volume, not all of it, unless price trades THROUGH you.
  function limitFillable(tp, i, side, L) {
    if (side === 'buy') return tp.l[i] <= L;
    return tp.h[i] >= L;
  }
  function throughMe(tp, i, side, L) {
    if (side === 'buy') return tp.l[i] < L - tp.tick / 2;
    return tp.h[i] > L + tp.tick / 2;
  }

  var ENGINE = {};
  M.ENGINE = ENGINE;

  /* --- immediate ---------------------------------------------------------- */

  ENGINE.MKT = function (c) {
    var tp = c.tape, i = c.start;
    var s = M.sweep(tp, i, c.side, c.qty);
    return {
      fills: [{ i: i, px: s.px, qty: s.filled }],
      events: [ev(i, 'fill', 'swept ' + s.levels + ' level' + (s.levels > 1 ? 's' : ''))],
      done: true
    };
  };

  ENGINE.LMT = function (c) {
    var tp = c.tape, fills = [], events = [ev(c.start, 'place', 'resting at ' + c.limit.toFixed(2))];
    var left = c.qty, marketable;
    // A limit priced through the touch is marketable — it behaves like a market
    // order with a worst-price guarantee, which is the useful way to use one.
    marketable = c.side === 'buy' ? c.limit >= tp.ask[c.start] : c.limit <= tp.bid[c.start];
    if (marketable) {
      var s = M.sweep(tp, c.start, c.side, c.qty);
      var capped = c.side === 'buy' ? Math.min(s.px, c.limit) : Math.max(s.px, c.limit);
      // only the part of the sweep inside the limit actually fills
      var frac = s.px === capped ? 1 : 0.72;
      fills.push({ i: c.start, px: capped, qty: Math.round(c.qty * frac) });
      events.push(ev(c.start, 'fill', 'marketable limit'));
      left = c.qty - Math.round(c.qty * frac);
      if (left <= 0) return { fills: fills, events: events, done: true };
    }
    for (var i = c.start; i <= c.end && left > 0; i++) {
      if (!limitFillable(tp, i, c.side, c.limit)) continue;
      // share of the bar you can realistically get at your price
      var avail = throughMe(tp, i, c.side, c.limit)
        ? left                                   // price traded through you: full fill
        : Math.max(100, Math.round(tp.vol[i] * 0.06));
      var take = Math.min(left, avail);
      fills.push({ i: i, px: c.limit, qty: take });
      left -= take;
      events.push(ev(i, take === c.qty ? 'fill' : 'partial', left > 0 ? 'partial' : 'filled'));
    }
    return {
      fills: fills, events: events, done: left <= 0,
      reason: left > 0 ? 'unfilled' : null, unfilled: left
    };
  };

  /* --- triggered ---------------------------------------------------------- */

  function triggerScan(c, hit) {
    var tp = c.tape;
    for (var i = c.start; i <= c.end; i++) if (hit(tp, i)) return i;
    return -1;
  }

  // Stop: protective. Buy stop above the market, sell stop below it.
  function stopHit(c) {
    return function (tp, i) {
      return c.side === 'sell' ? tp.l[i] <= c.stop : tp.h[i] >= c.stop;
    };
  }
  // If-touched: opportunistic. Buy MIT below the market, sell MIT above it.
  function touchHit(c) {
    return function (tp, i) {
      return c.side === 'buy' ? tp.l[i] <= c.stop : tp.h[i] >= c.stop;
    };
  }

  /*
     `kind` matters. A STOP is protective: it triggers as the market moves
     against you, so a gap through it fills WORSE than the trigger price — the
     single most expensive misunderstanding in retail trading, and the reason
     "my stop was at 98 but I got 94" is not a broker error. An IF-TOUCHED
     order is opportunistic: it triggers as the market moves toward the price
     you wanted, so a gap through it fills BETTER. Same arithmetic, opposite
     sign, and conflating them is why people put stops in the wrong place.
  */
  function afterTriggerMarket(c, ti, label, kind) {
    var tp = c.tape;
    if (ti < 0) return { fills: [], events: [ev(c.end, 'expire', 'never triggered')], done: false, reason: 'no-trigger' };
    var through = c.side === 'sell' ? tp.o[ti] < c.stop : tp.o[ti] > c.stop;
    var adverse = kind !== 'touch';
    var s = M.sweep(tp, ti, c.side, c.qty);
    var px = s.px;
    if (through && adverse) {
      // fill no better than the gapped open
      px = c.side === 'sell' ? Math.min(s.px, tp.o[ti]) : Math.max(s.px, tp.o[ti]);
    }
    return {
      fills: [{ i: ti, px: px, qty: c.qty }],
      events: [ev(ti, 'trigger', label),
               ev(ti, 'fill', through ? (adverse ? 'gapped through the stop' : 'gapped in your favour') : 'market fill')],
      done: true, gapped: through && adverse, favourableGap: through && !adverse
    };
  }

  /*
     The trigger bar needs care, but not too much care. If the market traded
     through the limit on its way past, there were counterparties at that price
     and the limit fills — that is an ordinary intraday stop-limit and it works.

     The order fails when the market GAPS: it reopens beyond the limit and never
     trades the prices in between. Then the limit is left resting above (or
     below) a market that has already gone, and you keep the entire position
     through exactly the move you set the order to escape. That is the honest
     failure mode of a stop-limit, and it is the one the tape's `shock`
     parameter reproduces.
  */
  function reachableOnTriggerBar(tp, i, side, L) {
    if (!limitFillable(tp, i, side, L)) return false;
    // The only way a limit is genuinely unreachable on its trigger bar is if the
    // market opened already beyond it — a gap. If the bar merely traded through
    // the level on its way past, there were counterparties there and the limit
    // fills. Being stricter than this produced the absurd result that an
    // if-touched limit was worse than the same limit resting on its own.
    return side === 'sell' ? tp.o[i] >= L : tp.o[i] <= L;
  }

  function afterTriggerLimit(c, ti, L, label) {
    if (ti < 0) return { fills: [], events: [ev(c.end, 'expire', 'never triggered')], done: false, reason: 'no-trigger' };
    var tp = c.tape;
    var from = reachableOnTriggerBar(tp, ti, c.side, L) ? ti : ti + 1;
    var sub;
    if (from > c.end) {
      sub = { fills: [], events: [ev(ti, 'expire', 'gapped past the limit')], done: false, reason: 'gapped-past-limit' };
    } else {
      sub = ENGINE.LMT({ tape: tp, side: c.side, qty: c.qty, limit: L, start: from, end: c.end });
      if (from > ti) sub.events.unshift(ev(ti, 'warn', 'market gapped past the limit — order left resting'));
      if (!sub.done) sub.reason = sub.reason || 'unfilled';
    }
    sub.events = [ev(ti, 'trigger', label)].concat(sub.events);
    sub.triggerBar = ti;
    sub.limitPx = L;
    return sub;
  }

  ENGINE.STP = function (c) { return afterTriggerMarket(c, triggerScan(c, stopHit(c)), 'stop triggered', 'stop'); };
  ENGINE.STL = function (c) { return afterTriggerLimit(c, triggerScan(c, stopHit(c)), c.limit, 'stop triggered'); };
  ENGINE.MIT = function (c) { return afterTriggerMarket(c, triggerScan(c, touchHit(c)), 'price touched', 'touch'); };
  ENGINE.LIT = function (c) { return afterTriggerLimit(c, triggerScan(c, touchHit(c)), c.limit, 'price touched'); };

  /* --- trailing ----------------------------------------------------------- */
  /*
     The trail ratchets in your favour only. For a sell (protecting a long) the
     stop follows the running high down-offset and never moves down.
  */
  function trailPath(c) {
    var tp = c.tape, path = [], stop = null, ext = null;
    for (var i = c.start; i <= c.end; i++) {
      if (c.side === 'sell') {
        ext = ext == null ? tp.h[i] : Math.max(ext, tp.h[i]);
        var s1 = ext - c.trail;
        stop = stop == null ? s1 : Math.max(stop, s1);
        path.push({ i: i, stop: stop });
        if (tp.l[i] <= stop) return { path: path, hit: i, stop: stop };
      } else {
        ext = ext == null ? tp.l[i] : Math.min(ext, tp.l[i]);
        var s2 = ext + c.trail;
        stop = stop == null ? s2 : Math.min(stop, s2);
        path.push({ i: i, stop: stop });
        if (tp.h[i] >= stop) return { path: path, hit: i, stop: stop };
      }
    }
    return { path: path, hit: -1, stop: stop };
  }
  M.trailPath = trailPath;

  ENGINE.TS = function (c) {
    var tr = trailPath(c);
    var r = afterTriggerMarket({ tape: c.tape, side: c.side, qty: c.qty, stop: tr.stop, start: c.start, end: c.end },
      tr.hit, 'trailing stop hit', 'stop');
    r.trail = tr.path;
    return r;
  };
  ENGINE.TSL = function (c) {
    var tr = trailPath(c);
    var off = c.side === 'sell' ? -Math.abs(c.limitOffset || c.tape.tick * 5) : Math.abs(c.limitOffset || c.tape.tick * 5);
    var r = afterTriggerLimit(c, tr.hit, tr.stop + off, 'trailing stop hit');
    r.trail = tr.path;
    return r;
  };

  /* --- scheduled / participation ------------------------------------------ */

  function sliceFills(c, weights, label) {
    var tp = c.tape, fills = [], events = [ev(c.start, 'place', label)];
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    if (!(total > 0)) return { fills: [], events: events, done: false, reason: 'no-schedule' };
    var placed = 0;
    for (var k = 0; k < weights.length; k++) {
      if (weights[k] <= 0) continue;
      var i = c.start + k;
      if (i > c.end) break;
      var q = Math.round(c.qty * weights[k] / total);
      if (q <= 0) continue;
      var s = M.sweep(tp, i, c.side, q);
      fills.push({ i: i, px: s.px, qty: q });
      placed += q;
    }
    if (placed < c.qty && fills.length) {
      var last = fills[fills.length - 1];
      last.qty += c.qty - placed;                 // rounding remainder on the last slice
    }
    events.push(ev(Math.min(c.end, c.start + weights.length - 1), 'fill', fills.length + ' child orders'));
    return { fills: fills, events: events, done: true, schedule: true };
  }

  ENGINE.TWAP = function (c) {
    var span = c.end - c.start + 1, k = Math.max(2, Math.min(c.slices || 12, span));
    var w = new Array(span).fill(0), every = Math.floor(span / k);
    for (var j = 0; j < k; j++) w[Math.min(span - 1, j * every)] = 1;
    return sliceFills(c, w, 'TWAP · ' + k + ' equal slices');
  };

  ENGINE.VWAP = function (c) {
    var tp = c.tape, span = c.end - c.start + 1;
    var k = Math.max(2, Math.min(c.slices || 12, span)), every = Math.floor(span / k);
    var w = new Array(span).fill(0);
    for (var j = 0; j < k; j++) {
      var at = Math.min(span - 1, j * every), s = 0;
      for (var m = at; m < Math.min(span, at + every); m++) s += tp.vol[c.start + m];
      w[at] = s;                                   // weight each slice by its interval's volume
    }
    return sliceFills(c, w, 'VWAP · volume-weighted slices');
  };

  ENGINE.POV = function (c) {
    var tp = c.tape, pct = (c.pov || 10) / 100, fills = [], left = c.qty;
    var events = [ev(c.start, 'place', 'participating at ' + (pct * 100).toFixed(0) + '% of volume')];
    for (var i = c.start; i <= c.end && left > 0; i++) {
      var q = Math.min(left, Math.round(tp.vol[i] * pct));
      if (q < 1) continue;
      var s = M.sweep(tp, i, c.side, q);
      fills.push({ i: i, px: s.px, qty: q });
      left -= q;
    }
    events.push(ev(fills.length ? fills[fills.length - 1].i : c.end, left > 0 ? 'partial' : 'fill',
      left > 0 ? 'ran out of session with ' + left + ' left' : 'completed'));
    return { fills: fills, events: events, done: left <= 0, unfilled: left, schedule: true };
  };

  ENGINE.ICEBERG = function (c) {
    // Only `display` is visible at a time; the rest refills behind it. Less
    // information leakage, but you surrender queue priority on every refill.
    var tp = c.tape, disp = Math.max(1, c.display || Math.round(c.qty / 10));
    var fills = [], left = c.qty;
    var events = [ev(c.start, 'place', 'showing ' + disp + ' of ' + c.qty)];
    for (var i = c.start; i <= c.end && left > 0; i++) {
      if (!limitFillable(tp, i, c.side, c.limit)) continue;
      var avail = throughMe(tp, i, c.side, c.limit) ? disp : Math.max(100, Math.round(tp.vol[i] * 0.035));
      var take = Math.min(left, disp, avail);
      if (take <= 0) continue;
      fills.push({ i: i, px: c.limit, qty: take });
      left -= take;
    }
    events.push(ev(fills.length ? fills[fills.length - 1].i : c.end, left > 0 ? 'partial' : 'fill',
      left > 0 ? left + ' unfilled' : 'filled in ' + fills.length + ' clips'));
    return { fills: fills, events: events, done: left <= 0, unfilled: left };
  };

  /* --- session-anchored --------------------------------------------------- */

  ENGINE.MOC = function (c) {
    var tp = c.tape, i = tp.n - 1;
    // The closing auction is a single crossing print, not a sweep of the book.
    return {
      fills: [{ i: i, px: tp.c[i], qty: c.qty }],
      events: [ev(c.start, 'place', 'queued for the close'), ev(i, 'fill', 'closing auction print')],
      done: true, auction: true
    };
  };

  ENGINE.AUCTION_MKT = function (c) {
    var tp = c.tape, i = c.start;
    return {
      fills: [{ i: i, px: tp.o[i], qty: c.qty }],
      events: [ev(i, 'fill', 'opening auction price')],
      done: true, auction: true
    };
  };

  ENGINE.AUCTION_LMT = function (c) {
    var tp = c.tape, i = c.start, px = tp.o[i];
    var ok = c.side === 'buy' ? px <= c.limit : px >= c.limit;
    return ok
      ? { fills: [{ i: i, px: px, qty: c.qty }], events: [ev(i, 'fill', 'crossed inside the limit')], done: true, auction: true }
      : { fills: [], events: [ev(i, 'expire', 'auction cleared outside the limit')], done: false, reason: 'auction-miss', auction: true };
  };

  ENGINE.DARK = function (c) {
    // A separate after-hours session on a thinner book, usually at a discount
    // or premium to the close depending on which side is desperate.
    var tp = c.tape, i = tp.n - 1;
    var R = rng('dark-' + c.qty);
    var px = tp.c[i] * (1 + (R() - 0.5) * 0.02);
    var frac = 0.45 + R() * 0.5;
    var q = Math.round(c.qty * frac);
    return {
      fills: [{ i: i, px: px, qty: q }],
      events: [ev(i, q < c.qty ? 'partial' : 'fill', 'dark session · ' + (frac * 100).toFixed(0) + '% matched')],
      done: q >= c.qty, unfilled: c.qty - q, dark: true
    };
  };

  /* --- composite ---------------------------------------------------------- */

  ENGINE.OCO = function (c) {
    // Entry assumed already done; this is the bracket around a position.
    // Whichever side is touched first fills, and cancels the other.
    var tp = c.tape;
    var tpHit = -1, slHit = -1, i;
    for (i = c.start; i <= c.end; i++) {
      if (tpHit < 0 && (c.side === 'sell' ? tp.h[i] >= c.tp : tp.l[i] <= c.tp)) tpHit = i;
      if (slHit < 0 && (c.side === 'sell' ? tp.l[i] <= c.sl : tp.h[i] >= c.sl)) slHit = i;
      if (tpHit >= 0 || slHit >= 0) break;
    }
    if (tpHit < 0 && slHit < 0) {
      return { fills: [], events: [ev(c.start, 'place', 'bracket armed'), ev(c.end, 'expire', 'neither leg touched')], done: false, reason: 'no-trigger' };
    }
    // Both inside the same bar is the honest ambiguity: from OHLC alone you
    // cannot tell which came first, and brokers differ. Assume the stop.
    var both = tpHit >= 0 && slHit >= 0 && tpHit === slHit;
    var win = both ? 'sl' : (tpHit >= 0 && (slHit < 0 || tpHit < slHit)) ? 'tp' : 'sl';
    var at = win === 'tp' ? tpHit : slHit;
    var px = win === 'tp' ? c.tp : M.sweep(tp, at, c.side, c.qty).px;
    return {
      fills: [{ i: at, px: px, qty: c.qty }],
      events: [ev(c.start, 'place', 'bracket armed'),
               ev(at, 'trigger', win === 'tp' ? 'take-profit touched' : 'stop-loss touched'),
               ev(at, 'fill', 'other leg cancelled')],
      done: true, oco: win, ambiguous: both
    };
  };

  ENGINE.CONDITIONAL = function (c) {
    // Fires when the condition is met, then submits a market order. The lag
    // between condition and submission is the whole risk of the structure.
    var tp = c.tape, ti = -1;
    for (var i = c.start; i <= c.end; i++) {
      if (c.side === 'buy' ? tp.c[i] >= c.stop : tp.c[i] <= c.stop) { ti = i; break; }
    }
    if (ti < 0) return { fills: [], events: [ev(c.end, 'expire', 'condition never met')], done: false, reason: 'no-trigger' };
    var at = Math.min(tp.n - 1, ti + 1);            // submitted on the next bar
    var s = M.sweep(tp, at, c.side, c.qty);
    return {
      fills: [{ i: at, px: s.px, qty: c.qty }],
      events: [ev(ti, 'trigger', 'condition met on close'), ev(at, 'fill', 'submitted next bar')],
      done: true
    };
  };

  ENGINE.ATTACHED = function (c) {
    // Parent fills, child arms. Shown as parent market + child take-profit.
    var tp = c.tape;
    var p = M.sweep(tp, c.start, c.side, c.qty);
    var fills = [{ i: c.start, px: p.px, qty: c.qty }];
    var events = [ev(c.start, 'fill', 'parent filled → child armed')];
    var exit = c.side === 'buy' ? 'sell' : 'buy';
    var hit = -1;
    for (var i = c.start + 1; i <= c.end; i++) {
      if (exit === 'sell' ? tp.h[i] >= c.tp : tp.l[i] <= c.tp) { hit = i; break; }
    }
    if (hit < 0) events.push(ev(c.end, 'expire', 'child still working at the close'));
    else events.push(ev(hit, 'fill', 'child filled at ' + c.tp.toFixed(2)));
    return { fills: fills, events: events, done: true, child: hit >= 0 ? { i: hit, px: c.tp } : null };
  };

  /* -------------------------------------------------------------- reporting */

  M.report = function (res, c) {
    var tp = c.tape;
    var arrivalMid = tp.mid[c.start];
    var arrivalTouch = c.side === 'buy' ? tp.ask[c.start] : tp.bid[c.start];
    var q = 0, pv = 0;
    (res.fills || []).forEach(function (f) { q += f.qty; pv += f.px * f.qty; });
    var avg = q ? pv / q : null;
    var sgn = c.side === 'buy' ? 1 : -1;
    // Slippage is signed so that positive always means "worse than the mid at
    // the moment you pressed the button", for both sides.
    var slipMid = avg == null ? null : sgn * (avg - arrivalMid);
    var slipVwap = avg == null ? null : sgn * (avg - tp.sessionVwap);
    var lastFill = res.fills && res.fills.length ? res.fills[res.fills.length - 1].i : null;
    return {
      qty: q, target: c.qty, avg: avg,
      fillRate: c.qty ? q / c.qty : 0,
      arrivalMid: arrivalMid, arrivalTouch: arrivalTouch,
      slipMid: slipMid,
      slipMidBps: avg == null ? null : slipMid / arrivalMid * 10000,
      slipVwap: slipVwap,
      slipVwapBps: avg == null ? null : slipVwap / tp.sessionVwap * 10000,
      nFills: (res.fills || []).length,
      barsToComplete: lastFill == null ? null : lastFill - c.start,
      done: !!res.done, reason: res.reason || null,
      gapped: !!res.gapped, ambiguous: !!res.ambiguous
    };
  };

  M.run = function (id, c) {
    var fn = ENGINE[id];
    if (!fn) return null;
    var res = fn(c);
    res.report = M.report(res, c);
    res.id = id;
    return res;
  };

  /* ------------------------------------------------------------- formatting */

  M.fmt = function (x, d) {
    if (x == null || !isFinite(x)) return '—';
    return x.toLocaleString('en-US', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  };
  M.money = function (x) { return x == null || !isFinite(x) ? '—' : '$' + M.fmt(x, 2); };
  M.pct = function (x, d) { return x == null || !isFinite(x) ? '—' : (x * 100).toFixed(d == null ? 1 : d) + '%'; };
  M.bps = function (x) { return x == null || !isFinite(x) ? '—' : (x >= 0 ? '+' : '') + x.toFixed(1) + ' bps'; };
  M.compact = function (x) {
    var a = Math.abs(x);
    if (a >= 1e9) return (x / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (x / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (x / 1e3).toFixed(1) + 'K';
    return String(Math.round(x));
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
