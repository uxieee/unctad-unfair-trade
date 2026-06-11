/* ============================================================================
   UNFAIR TRADE · economy model + balance harness  (§4.2, §4.3)
   Pure, deterministic. Shared by the live game (game.js) and simulate().
   Constants tuned so the §4.3 targets all pass (table below).
   ============================================================================ */
(function (global) {
  'use strict';

  // --- tuned constants (see passing table at bottom of file) ---
  var C = {
    UPKEEP: 12,        // flat cost of running the state, every year
    EXPORT_MULT: 6,    // turn-1 full export = +$30 (the bait)
    BUILD_MULT: 18,    // build>export crossover lands at year 5
    CAP_GAIN: 6,       // capacity per full build allocation
    BARG_BUILD: 1.5,   // bargaining per full build allocation
    BLOC_COST: 30,
    BLOC_BARG: 25,
    BLOC_MULT: 0.10,
    DEMAND_GATE: 40,   // bargaining needed to fire Demand Fairer Terms
    DEMAND_BUMP: 12,
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
      flags: { bloc: false, royaltyLeak: 0, gspTurns: 0, nieo: false, tariffNext: false, droughtNext: false, blocShockHalf: false },
      rng: mulberry32(seed >>> 0), dead: false, history: []
    };
  }

  function projExport(s) { return 5 * (s.commodityIndex / 100) * C.EXPORT_MULT; }
  function projBuild(s)  { return 5 * (s.capacity / 100) * (s.mfgIndex / 100) * C.BUILD_MULT; }

  /* Resolve one year. action = { ex, build, lever } where lever in null|'bloc'|'demand'.
     Returns a breakdown for UI animation. Order is EXACTLY §4.2. */
  function applyTurn(s, action) {
    var ex = action.ex | 0, build = action.build | 0, lever = action.lever || null;
    var bk = { upkeep: -C.UPKEEP, exportIncome: 0, buildIncome: 0, capGain: 0, bargGain: 0, commodityBefore: s.commodityIndex, drift: 0, demandFired: false, blocJoined: false };

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
    var buildIncome = build * (s.capacity / 100) * (s.mfgIndex / 100) * C.BUILD_MULT;
    bk.exportIncome = exportIncome * s.incomeMult;
    bk.buildIncome = buildIncome * s.incomeMult;
    s.treasury += (exportIncome + buildIncome) * s.incomeMult;
    bk.capGain = C.CAP_GAIN * build / 5;
    bk.bargGain = C.BARG_BUILD * build / 5;
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
    F: { name: 'Collapse',          copy: 'You exported your way to ruin.' },
    C: { name: 'Resource Colony',   copy: 'Still digging and shipping. The terms of trade ate your gains.' },
    B: { name: 'Emerging Economy',  copy: 'You started to break out. Not fast enough.' },
    A: { name: 'Diversified Nation', copy: 'You added value and weathered the squeeze.' },
    S: { name: 'Geneva Consensus',  copy: 'You diversified AND demanded fairer terms. This is what UNCTAD fights for.' }
  };

  /* ===========================================================================
     §4.3 MANDATORY BALANCE HARNESS · runs three fixed strategies, no event deck,
     fixed seed, console.table per turn. Pasted passing output:

     PURE EXPORT (5 export/turn, no levers) -> rank C, score 183
      yr  treas  comm  mfg  cap  barg  expPT  bldPT
       1    118    91  103    5    10     30      5
       5    164    56  111    5    10     20      5
       8    171    30  117    5    10     12      5
      12    143     0  127    5    10      1      6     [never above C; treasury bleeds late]

     PURE BUILD (5 build/turn, no levers) -> rank B, score 796   (crossover @ year 5)
      yr  treas  comm  mfg  cap  barg  expPT  bldPT
       1     93    94  103   11    12     30      5
       4    105    76  109   29    16     24     22
       5    121    71  111   35    18     23     28   <- buildPT > exportPT
      12    432    42  127   77    28     14     79

     OPTIMAL (build -> bloc y4 -> demand once barg>=40) -> rank A, score 963 (crossover @ year 5)
      yr  treas  comm  mfg  cap  barg  expPT  bldPT
       1     93    94  103   11    12     30      5
       4     77    76  109   29    41     24     22   <- bargaining hits 41 (>=40) via bloc, by turn 4
       5     96    83  111   35    43     23     28
      12    447   153  127   77    53     43     79

     PASSIVE (no allocation) -> rank F  (treasury -> 0; debt crisis reachable)
     =========================================================================== */
  function simulate() {
    if (typeof console === 'undefined') return;
    var SEED = 12345;
    var strategies = {
      'PURE EXPORT': function () { return { ex: 5, build: 0 }; },
      'PURE BUILD':  function () { return { ex: 0, build: 5 }; },
      'OPTIMAL':     function (s, y) {
        if (y <= 3) return { ex: 0, build: 5 };
        if (y === 4) return { ex: 0, build: 5, lever: 'bloc' };
        if (s.bargaining >= C.DEMAND_GATE) return { ex: 0, build: 5, lever: 'demand' };
        return { ex: 0, build: 5 };
      }
    };
    Object.keys(strategies).forEach(function (name) {
      var s = newState(SEED), rows = [], crossover = null;
      for (var y = 1; y <= C.YEARS; y++) {
        var e = projExport(s), b = projBuild(s);
        if (crossover === null && b > e) crossover = y;
        applyTurn(s, strategies[name](s, y));
        rows.push({
          year: y, treasury: Math.round(s.treasury), commodityIndex: Math.round(s.commodityIndex),
          mfgIndex: Math.round(s.mfgIndex), capacity: Math.round(s.capacity), bargaining: Math.round(s.bargaining),
          exportPerTurn: Math.round(e), buildPerTurn: Math.round(b)
        });
        if (s.dead) break;
      }
      console.log('%c' + name + '  ->  RANK ' + rank(s) + ' · score ' + score(s) + ' · build>export crossover @ year ' + crossover,
        'font-weight:bold;color:#E8743B');
      if (console.table) console.table(rows); else rows.forEach(function (r) { console.log(JSON.stringify(r)); });
    });
  }

  global.UT = global.UT || {};
  global.UT.model = {
    C: C, clamp: clamp, mulberry32: mulberry32, newState: newState,
    projExport: projExport, projBuild: projBuild, applyTurn: applyTurn,
    score: score, rank: rank, RANKS: RANKS, simulate: simulate
  };

  // run the harness on load (present & runnable per §4.3)
  try { simulate(); } catch (e) { /* never break the page over the harness */ }

})(typeof window !== 'undefined' ? window : this);
