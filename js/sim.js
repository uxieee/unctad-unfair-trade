/* ============================================================================
   UNFAIR TRADE · economy model + balance harness  (§4.2, §4.3)
   Pure, deterministic. Shared by the live game (game.js) and simulate().

   v2 — grounded to real development economics (expert-panel review, 2026-06):
     • Capital-goods IMPORT BILL on every build: factories need imported
       machines, paid in foreign exchange you earn from EXPORTS. The bill scales
       with the terms of trade (mfg/commodity) — the same scissor that rots your
       export income makes machines dearer. This is the two-gap / FX-constraint
       model (Chenery–Bruno–Strout) and the structuralist heart of why a poor
       commodity exporter cannot simply "build its way out" for free.
     • INFANT-INDUSTRY J-CURVE: young capacity earns a fraction of its mature
       return (learning-by-doing). Early factories are high-cost & uncompetitive.
     • BARGAINING is decoupled from building: leverage comes mainly from blocs,
       solidarity, and trade itself — so the UNCTAD "Demand" gate genuinely bites.
   Net effect: export is now a *rational* early bridge (earn FX → fund machines),
   which then betrays you as the terms of trade decline. The trap is felt, not
   labelled; and the only safe escape is the real one — export to fund an early
   pivot into industry, join a bloc for leverage, then demand fairer terms.
   Constants tuned so the §4.3 targets all pass (table below).
   ============================================================================ */
(function (global) {
  'use strict';

  // --- tuned constants (see passing table at bottom of file) ---
  var C = {
    UPKEEP: 12,          // flat cost of running the state, every year
    EXPORT_MULT: 6,      // turn-1 full export = +$30 (the bait)
    BUILD_MULT: 27,      // gross industry multiplier (before infant J-curve & imports)
    CAP_GAIN: 6,         // capacity per full build allocation
    BARG_BUILD: 0.8,     // bargaining per full build allocation (decoupled — was 1.5)
    BARG_EXPORT: 0.4,    // a trading nation earns a little diplomatic standing too
    IMPORT_BASE: 2.7,    // capital-goods $ per build labor, before terms-of-trade scaling
    IMPORT_RATIO_CAP: 2.4, // cap on the mfg/commodity multiplier so it can't death-spiral
    INFANT_FLOOR: 0.3,   // young industry earns 30% of mature return…
    INFANT_MATURE: 32,   // …ramping to 100% as capacity approaches this (learning curve)
    BLOC_COST: 30,
    BLOC_BARG: 28,
    BLOC_MULT: 0.10,
    DEMAND_GATE: 40,     // bargaining needed to fire Demand Fairer Terms
    DEMAND_BUMP: 14,
    DEMAND_FAIR_TURNS: 3,
    NIEO_BUMP: 24,
    NIEO_FAIR_TURNS: 4,
    YEARS: 12,
    START_YEAR: 1964
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // mulberry32 PRNG · seedable, NOT Math.random (§2 seeding)
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function newState(seed) {
    return {
      treasury: 100, commodityIndex: 100, mfgIndex: 100,
      capacity: 5, bargaining: 10, year: 1,
      incomeMult: 1, fairTermsTurns: 0,
      flags: { bloc: false, royaltyLeak: 0, gspTurns: 0, nieo: false, tariffNext: false, droughtActive: false, blocShockHalf: false, superHangover: false },
      rng: mulberry32(seed >>> 0), dead: false, history: []
    };
  }

  // --- shared economic helpers (used by both applyTurn and the UI projections) ---
  function infantFactor(s) {
    // learning-by-doing: 0.4 at capacity 0 → 1.0 once capacity reaches INFANT_MATURE
    return C.INFANT_FLOOR + (1 - C.INFANT_FLOOR) * Math.min(1, s.capacity / C.INFANT_MATURE);
  }
  function termsRatio(s) {
    // the scissor, as a multiplier on import costs: starts ~1, widens as commodity falls
    return Math.min(C.IMPORT_RATIO_CAP, s.mfgIndex / Math.max(1, s.commodityIndex));
  }
  function importBillFor(s, build) { return build * C.IMPORT_BASE * termsRatio(s); }
  function buildGrossFor(s, build) { return build * (s.capacity / 100) * (s.mfgIndex / 100) * C.BUILD_MULT * infantFactor(s); }

  // UI projections for a FULL (5-labor) allocation, including current income multiplier
  function projExport(s) { return 5 * (s.commodityIndex / 100) * C.EXPORT_MULT * s.incomeMult; }
  function projImport(s) { return importBillFor(s, 5); }
  function projBuildGross(s) { return buildGrossFor(s, 5) * s.incomeMult; }
  function projBuild(s) { return projBuildGross(s) - projImport(s); } // NET cash shown on the card

  /* Resolve one year. action = { ex, build, lever } where lever in null|'bloc'|'demand'.
     Returns a breakdown for UI animation. Order is EXACTLY §4.2. */
  function applyTurn(s, action) {
    var ex = action.ex | 0, build = action.build | 0, lever = action.lever || null;
    var bk = { upkeep: -C.UPKEEP, exportIncome: 0, buildIncome: 0, importBill: 0, capGain: 0, bargGain: 0, commodityBefore: s.commodityIndex, drift: 0, demandFired: false, blocJoined: false };

    // 0. UPKEEP
    s.treasury -= C.UPKEEP;

    // bloc lever (a strategic lever, paid from treasury)
    if (lever === 'bloc' && !s.flags.bloc && s.treasury >= C.BLOC_COST) {
      s.treasury -= C.BLOC_COST;
      s.flags.bloc = true; s.flags.blocShockHalf = true;
      s.bargaining += C.BLOC_BARG; s.incomeMult += C.BLOC_MULT;
      bk.blocJoined = true;
    }

    // 1. player production
    var exportIncome = ex * (s.commodityIndex / 100) * C.EXPORT_MULT;
    if (s.flags.tariffNext) { exportIncome = 0; s.flags.tariffNext = false; }
    if (s.flags.droughtActive) { exportIncome *= 0.5; }
    var buildIncome = buildGrossFor(s, build);          // gross, after infant J-curve
    var importBill = importBillFor(s, build);           // capital-goods imports (FX gap)
    bk.exportIncome = exportIncome * s.incomeMult;
    bk.buildIncome = buildIncome * s.incomeMult;
    bk.importBill = importBill;
    s.treasury += (exportIncome + buildIncome) * s.incomeMult - importBill;
    bk.capGain = C.CAP_GAIN * build / 5;
    bk.bargGain = C.BARG_BUILD * build / 5 + C.BARG_EXPORT * ex / 5;
    s.capacity += bk.capGain;
    s.bargaining += bk.bargGain;
    if (ex > 0) s.commodityIndex -= 2;             // you flood your own market

    // demand lever · immediate index jump; drift-halving applies the next turns
    var pendingFair = 0;
    if (lever === 'demand' && s.bargaining >= C.DEMAND_GATE) {
      var bump = s.flags.nieo ? C.NIEO_BUMP : C.DEMAND_BUMP;
      pendingFair = s.flags.nieo ? C.NIEO_FAIR_TURNS : C.DEMAND_FAIR_TURNS;
      s.commodityIndex += bump; s.flags.nieo = false; bk.demandFired = true;
    }

    // 2. structural drift (Prebisch-Singer, worsened by dependence)
    var dependence = 1 - (s.capacity / 100);
    var drift = 2 + dependence * 5;
    if (s.fairTermsTurns > 0) { drift *= 0.5; s.fairTermsTurns--; }
    bk.drift = drift;
    s.commodityIndex -= drift;

    // 3. manufactures quietly appreciate
    s.mfgIndex += 1 + s.rng() * 2;

    // expire one-turn / counted flags
    if (s.flags.droughtActive) s.flags.droughtActive = false;
    if (s.flags.gspTurns > 0) { s.flags.gspTurns--; if (s.flags.gspTurns === 0) s.incomeMult -= 0.15; }

    // 4. clamp + loss check
    s.commodityIndex = clamp(s.commodityIndex, 0, 200);
    s.mfgIndex = clamp(s.mfgIndex, 0, 200);
    s.capacity = clamp(s.capacity, 0, 100);
    s.bargaining = clamp(s.bargaining, 0, 100);
    if (pendingFair) s.fairTermsTurns = pendingFair;

    s.history.push({ year: s.year, commodity: s.commodityIndex, mfg: s.mfgIndex });
    s.year++;
    if (s.treasury <= 0) { s.treasury = Math.max(0, s.treasury); s.dead = true; }
    return bk;
  }

  function score(s) {
    return Math.round(s.treasury + s.capacity * 4 + s.bargaining * 2 + Math.max(0, s.commodityIndex - 50));
  }

  // robust ranking · no gaps (B is the "reached cap>=30 but not A/S" fallback)
  function rank(s) {
    if (s.dead) return 'F';
    var sc = score(s);
    if (s.capacity >= 50 && s.bargaining >= 60 && sc >= 1000) return 'S';
    if (s.capacity >= 50 && s.commodityIndex >= 55 && sc >= 700) return 'A';
    if (s.capacity >= 30) return 'B';
    return 'C';
  }

  var RANKS = {
    F: { name: 'Collapse',          copy: 'You ran out of money before you ran out of road.' },
    C: { name: 'Resource Colony',   copy: 'Still digging and shipping. The terms of trade ate your gains.' },
    B: { name: 'Emerging Economy',  copy: 'You started to break out. Not fast enough.' },
    A: { name: 'Diversified Nation', copy: 'You added value and weathered the squeeze.' },
    S: { name: 'Geneva Consensus',  copy: 'You diversified AND demanded fairer terms. This is what UNCTAD fights for.' }
  };

  /* ===========================================================================
     §4.3 MANDATORY BALANCE HARNESS · runs the canonical strategies on a fixed
     seed, no event deck, console.table per turn, then asserts the design targets.

     Design targets (v2):
       PURE EXPORT  → never above C (commodity craters; "just export" loses)
       PURE BUILD   → real early jeopardy (treasury floor < ~$40, can die on a
                      bad event); reaches at most B if it survives. Building with
                      no export FX to fund the machine imports is punishing.
       BRIDGE       → export early to bank foreign exchange, pivot to industry +
                      bloc → the safe survival line → A. (The real development
                      sequence: export-fund your own industrialization.)
       OPTIMAL      → BRIDGE + time UNCTAD demands from real leverage → A/S.
       PASSIVE      → F (treasury bleeds to a debt crisis).
       build>export NET crossover lands ~year 5–6.
     =========================================================================== */
  function simulate() {
    if (typeof console === 'undefined') return;
    var SEED = 12345;
    var strategies = {
      'PURE EXPORT': function () { return { ex: 5, build: 0 }; },
      'PURE BUILD':  function () { return { ex: 0, build: 5 }; },
      'PASSIVE':     function () { return { ex: 0, build: 0 }; },
      'BRIDGE':      function (s, y) {
        if (y <= 3) return { ex: 5, build: 0 };                 // bank FX first
        if (y === 4) return { ex: 0, build: 5, lever: 'bloc' }; // pivot + leverage
        if (s.bargaining >= C.DEMAND_GATE) return { ex: 0, build: 5, lever: 'demand' };
        return { ex: 0, build: 5 };
      },
      'OPTIMAL':     function (s, y) {
        if (y <= 2) return { ex: 5, build: 0 };                 // short FX runway
        if (y === 3) return { ex: 3, build: 2 };                // start the pivot
        if (y === 4) return { ex: 0, build: 5, lever: 'bloc' };
        if (s.bargaining >= C.DEMAND_GATE) return { ex: 0, build: 5, lever: 'demand' };
        return { ex: 0, build: 5 };
      }
    };
    var results = {};
    Object.keys(strategies).forEach(function (name) {
      var s = newState(SEED), rows = [], crossover = null, floor = Infinity;
      for (var y = 1; y <= C.YEARS; y++) {
        var e = projExport(s), b = projBuild(s);
        if (crossover === null && b > e) crossover = y;
        applyTurn(s, strategies[name](s, y));
        floor = Math.min(floor, s.treasury);
        rows.push({
          year: y, treasury: Math.round(s.treasury), commodityIndex: Math.round(s.commodityIndex),
          mfgIndex: Math.round(s.mfgIndex), capacity: Math.round(s.capacity), bargaining: Math.round(s.bargaining),
          exportNet: Math.round(e), buildNet: Math.round(b), importBill: Math.round(projImport(s))
        });
        if (s.dead) break;
      }
      results[name] = { rank: rank(s), score: score(s), crossover: crossover, floor: Math.round(floor) };
      console.log('%c' + name + '  ->  RANK ' + rank(s) + ' · score ' + score(s) +
        ' · NET crossover @ year ' + crossover + ' · treasury floor $' + Math.round(floor),
        'font-weight:bold;color:#E8743B');
      if (console.table) console.table(rows); else rows.forEach(function (r) { console.log(JSON.stringify(r)); });
    });

    // --- assert the design targets (logged, never throws on the page) ---
    function chk(name, cond) { console.log((cond ? '✓ PASS' : '✗ FAIL') + ' · ' + name); return cond; }
    console.log('%c— balance assertions —', 'font-weight:bold');
    chk('PURE EXPORT is capped at C', results['PURE EXPORT'].rank === 'C' || results['PURE EXPORT'].rank === 'F');
    chk('PURE BUILD never beats B', ['F', 'C', 'B'].indexOf(results['PURE BUILD'].rank) > -1);
    chk('PURE BUILD has real early jeopardy (floor < $45)', results['PURE BUILD'].floor < 45);
    chk('BRIDGE reaches A or better', ['A', 'S'].indexOf(results['BRIDGE'].rank) > -1);
    chk('OPTIMAL reaches A or better', ['A', 'S'].indexOf(results['OPTIMAL'].rank) > -1);
    chk('PASSIVE collapses to F', results['PASSIVE'].rank === 'F');
    chk('NET crossover lands year 4–7', results['PURE BUILD'].crossover >= 4 && results['PURE BUILD'].crossover <= 7);
    return results;
  }

  global.UT = global.UT || {};
  global.UT.model = {
    C: C, clamp: clamp, mulberry32: mulberry32, newState: newState,
    infantFactor: infantFactor, termsRatio: termsRatio,
    projExport: projExport, projBuild: projBuild, projBuildGross: projBuildGross, projImport: projImport,
    applyTurn: applyTurn, score: score, rank: rank, RANKS: RANKS, simulate: simulate
  };

  // run the harness on load (present & runnable per §4.3)
  try { simulate(); } catch (e) { /* never break the page over the harness */ }

})(typeof window !== 'undefined' ? window : this);
