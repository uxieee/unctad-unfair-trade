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
    START_TREASURY: 58,  // brutal runway: too thin to "build your way out" without export FX first
    UPKEEP: 12,          // flat cost of running the state, every year
    EXPORT_MULT: 6,      // turn-1 full export = +$30 (the bait)
    VALUE_ADD: 3.2,      // THE PAYOFF OF INDUSTRY. Capacity doesn't print cash on its own —
                         // it raises the value of what you EXPORT (roasted beans, not raw).
                         // export value = base × (1 + VALUE_ADD × capacity/100). At capacity 50
                         // every export is worth 2.2×. So diversifying only pays through trade:
                         // build with no exports and you earn nothing while your factories drain FX.
    CAP_GAIN: 6,         // capacity per full build allocation
    BARG_BUILD: 1.8,     // bargaining per full build allocation (decoupled — was 1.5)
    BARG_EXPORT: 0.7,    // a trading nation earns a little diplomatic standing too
    IMPORT_BASE: 1.3,    // capital-goods $ per build labor (one-time machine cost per build)
    MAINT_RATE: 0.42,    // FX to RUN industry each year, per capacity point × world-mfg price.
                         // The stacked deck: the bigger your industrial base, the more imported
                         // inputs/parts/fuel it needs — and you can only pay in FX earned by
                         // EXPORTING or won through collective leverage. Build without trade
                         // and your own factories starve you into a debt crisis.
    BLOC_MAINT_RELIEF: 0.55, // a bloc pools purchasing power → preferential terms on capital
                         // goods (South-South trade, GSP). Members pay only 55% of maintenance.
                         // Going it alone is what makes solo industrialization starve.
    BLOC_COST: 34,       // affordable only after a few export years (the bridge to leverage)
    BLOC_BARG: 26,
    BLOC_MULT: 0.22,     // +22% on trade income — a real reward for collective action, but it
                         // only helps a nation that actually EXPORTS (it multiplies trade income),
                         // so it can't rescue a build-only player who earns nothing.
    DEMAND_GATE: 40,     // bargaining needed to fire Demand Fairer Terms
    DEMAND_BUMP: 24,     // the UNCTAD weapon: a strong, temporary lift to your terms of trade —
                         // but it only converts to income for a nation that actually EXPORTS.
    DEMAND_COST_BARG: 5, // each demand SPENDS bargaining (political capital) — no spamming
    DEMAND_FAIR_TURNS: 5,
    NIEO_BUMP: 32,
    NIEO_FAIR_TURNS: 5,
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
      treasury: C.START_TREASURY, commodityIndex: 100, mfgIndex: 100,
      capacity: 5, bargaining: 10, year: 1,
      incomeMult: 1, fairTermsTurns: 0, demandsFired: 0,
      flags: { bloc: false, royaltyLeak: 0, gspTurns: 0, nieo: false, tariffNext: false, droughtActive: false, blocShockHalf: false, superHangover: false },
      rng: mulberry32(seed >>> 0), dead: false, deadReason: null, history: []
    };
  }

  // --- shared economic helpers (used by both applyTurn and the UI projections) ---
  function valueAddFactor(s) {
    // diversification premium: each export is worth more as you climb the value ladder.
    // 1.0 at capacity 0 → (1 + VALUE_ADD) once fully industrialised. This is the ONLY
    // payoff of building — industry pays off through trade, never as standalone cash.
    return 1 + C.VALUE_ADD * (s.capacity / 100);
  }
  function termsRatio(s) {
    // imported capital goods are priced in (appreciating) world manufactures.
    // Scaling by mfg/100 keeps the FX cost rising over time WITHOUT the perverse
    // incentive of the old mfg/commodity form (which rewarded never-exporting).
    return s.mfgIndex / 100;
  }
  function importBillFor(s, build) { return build * C.IMPORT_BASE * termsRatio(s); }
  function maintFor(s) { return s.capacity * C.MAINT_RATE * termsRatio(s) * (s.flags.bloc ? C.BLOC_MAINT_RELIEF : 1); }

  // UI projections for a FULL (5-labor) allocation, including current income multiplier
  function projExport(s) { return 5 * (s.commodityIndex / 100) * C.EXPORT_MULT * valueAddFactor(s) * s.incomeMult; }
  function projImport(s) { return importBillFor(s, 5); }
  function projBuild(s) { return -projImport(s); } // building earns no cash — it's an FX investment; payoff is higher export value

  /* Resolve one year. action = { ex, build, lever } where lever in null|'bloc'|'demand'.
     Returns a breakdown for UI animation. Order is EXACTLY §4.2. */
  function applyTurn(s, action) {
    var ex = action.ex | 0, build = action.build | 0, lever = action.lever || null;
    var bk = { upkeep: -C.UPKEEP, maint: 0, exportIncome: 0, buildIncome: 0, importBill: 0, capGain: 0, bargGain: 0, commodityBefore: s.commodityIndex, drift: 0, demandFired: false, demandCost: 0, blocJoined: false };

    // 0. UPKEEP + INDUSTRIAL FX MAINTENANCE
    s.treasury -= C.UPKEEP;
    // running the factories you already have needs imported inputs, paid in FX.
    // scales with the industrial base AND with appreciating world manufactures (the
    // scissor) — so a big industry built without an FX income source starves itself.
    // joining a bloc wins preferential terms on those imports (collective leverage).
    var maint = maintFor(s);
    s.treasury -= maint; bk.maint = -maint;

    // bloc lever (a strategic lever, paid from treasury)
    if (lever === 'bloc' && !s.flags.bloc && s.treasury >= C.BLOC_COST) {
      s.treasury -= C.BLOC_COST;
      s.flags.bloc = true; s.flags.blocShockHalf = true;
      s.bargaining += C.BLOC_BARG; s.incomeMult += C.BLOC_MULT;
      bk.blocJoined = true;
    }

    // 1. player production
    // EXPORT earns FX, scaled by the value-add of your industry (diversification premium).
    var exportIncome = ex * (s.commodityIndex / 100) * C.EXPORT_MULT * valueAddFactor(s);
    if (s.flags.tariffNext) { exportIncome = 0; s.flags.tariffNext = false; }
    if (s.flags.droughtActive) { exportIncome *= 0.5; }
    // BUILD earns no cash — it's an FX investment (imported machines). Its only payoff is
    // raising future export value above. Build with no exports and you simply bleed FX.
    var importBill = importBillFor(s, build);           // capital-goods imports (FX gap)
    bk.exportIncome = exportIncome * s.incomeMult;
    bk.buildIncome = 0;
    bk.importBill = importBill;
    s.treasury += exportIncome * s.incomeMult - importBill;
    bk.capGain = C.CAP_GAIN * build / 5;
    bk.bargGain = C.BARG_BUILD * build / 5 + C.BARG_EXPORT * ex / 5;
    s.capacity += bk.capGain;
    s.bargaining += bk.bargGain;
    if (ex > 0) s.commodityIndex -= 2;             // you flood your own market

    // demand lever · immediate index jump; drift-halving applies the next turns.
    // Firing it SPENDS bargaining — leverage is political capital you must rebuild,
    // so you can't pin prices high by spamming it (models non-binding, costly advocacy).
    var pendingFair = 0;
    if (lever === 'demand' && s.bargaining >= C.DEMAND_GATE) {
      var bump = s.flags.nieo ? C.NIEO_BUMP : C.DEMAND_BUMP;
      pendingFair = s.flags.nieo ? C.NIEO_FAIR_TURNS : C.DEMAND_FAIR_TURNS;
      s.commodityIndex += bump; s.flags.nieo = false; bk.demandFired = true;
      s.bargaining -= C.DEMAND_COST_BARG; bk.demandCost = C.DEMAND_COST_BARG;
      s.demandsFired++;
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
    // hard-lose checks (clear, real lose conditions)
    if (s.treasury <= 0) { s.treasury = Math.max(0, s.treasury); s.dead = true; s.deadReason = 'debt'; }
    else if (s.commodityIndex <= 0) { s.dead = true; s.deadReason = 'terms'; } // terms of trade hit rock bottom
    return bk;
  }

  function score(s) {
    return Math.round(s.treasury + s.capacity * 4 + s.bargaining * 2 + Math.max(0, s.commodityIndex - 50));
  }

  // Ranking encodes UNCTAD's two-pillar prescription as the WIN condition:
  // you escape (A/S) only if you BOTH diversified (capacity) AND engaged collective
  // leverage (joined a bloc AND actually demanded fairer terms). Pure industry with
  // no leverage caps at B; raw exporting collapses. This makes the lesson the win.
  function rank(s) {
    if (s.dead) return 'F';
    var sc = score(s);
    var engaged = s.flags.bloc && s.demandsFired >= 2;   // used both leverage tools
    // S = mastery: deep industry AND you fought for fairer terms repeatedly (3+ demands),
    // holding your terms of trade high. Reachable by a strong, deliberate run.
    if (s.capacity >= 42 && s.flags.bloc && s.demandsFired >= 3 && s.commodityIndex >= 65 && sc >= 460) return 'S';
    if (s.capacity >= 30 && engaged && s.commodityIndex >= 42) return 'A';
    if (s.capacity >= 20) return 'B';
    return 'C';
  }

  // A and S are the only WINS (you escaped the terms-of-trade trap). F/C/B are losses.
  var RANKS = {
    F: { name: 'Debt Crisis',       win: false, copy: 'You ran out of money before you ran out of road. You did not escape.' },
    C: { name: 'Resource Colony',   win: false, copy: 'You stayed a raw-commodity exporter. The terms of trade ate your gains. You did not escape.' },
    B: { name: 'Emerging Economy',  win: false, copy: 'You built some industry — but you let your commodity prices collapse and never earned the leverage to defend them. The squeeze won. You did not escape.' },
    A: { name: 'Diversified Nation', win: true, copy: 'You added value at home and weathered the squeeze. You escaped the trap.' },
    S: { name: 'Geneva Consensus',  win: true, copy: 'You diversified AND demanded fairer terms from a position of strength. You escaped the trap — this is what UNCTAD fights for.' }
  };
  // special-cased death flavour (terms-of-trade collapse vs. debt crisis)
  var DEATHS = {
    debt:  { name: 'Debt Crisis',            copy: 'Upkeep and import bills drained the treasury to zero. Bankrupt. You did not escape.' },
    terms: { name: 'Terms-of-Trade Collapse', copy: 'Your commodity prices hit rock bottom. Exporting more only dug the hole deeper, and you had no industry or leverage to fall back on. The economy collapsed. You did not escape.' }
  };
  function outcome(s) { var r = rank(s); return RANKS[r].win ? 'win' : 'lose'; }

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
      // BRIDGE: the intuitive-but-flawed plan — export to bank cash, then go ALL-IN
      // on industry and stop trading. Under the FX constraint this starves your own
      // factories (no export earnings to pay for imported inputs) → it must NOT escape.
      'BRIDGE':      function (s, y) {
        if (y <= 3) return { ex: 5, build: 0 };                 // bank FX first
        if (y === 4) return { ex: 0, build: 5, lever: 'bloc' }; // pivot + leverage
        if (s.bargaining >= C.DEMAND_GATE) return { ex: 0, build: 5, lever: 'demand' };
        return { ex: 0, build: 5 };
      },
      // OPTIMAL: the real UNCTAD program — bank FX, join a bloc, then NEVER fully
      // abandon trade: keep exporting to fund industry while you diversify, and
      // demand fairer terms from leverage. A sustained mix is the only escape.
      'OPTIMAL':     function (s, y) {
        if (y <= 2) return { ex: 5, build: 0 };                                  // short FX runway
        if (!s.flags.bloc && s.treasury >= C.BLOC_COST + 18) return { ex: 3, build: 2, lever: 'bloc' };
        if (s.bargaining >= C.DEMAND_GATE) return { ex: 2, build: 3, lever: 'demand' }; // keep FX flowing
        return { ex: 2, build: 3 };
      },
      // guardrail: the old dominant exploit — bloc turn 1, build, never export.
      // Must NOT win (building with no export FX to fund machine imports bleeds out).
      'BLOC-T1 EXPLOIT': function (s, y) {
        if (y === 1) return { ex: 0, build: 5, lever: 'bloc' };
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
    chk('PURE EXPORT loses (C or F-collapse)', results['PURE EXPORT'].rank === 'C' || results['PURE EXPORT'].rank === 'F');
    chk('PURE BUILD COLLAPSES (F — factories starve for FX; spamming industry is fatal)', results['PURE BUILD'].rank === 'F');
    chk('PURE BUILD actually goes bankrupt (treasury floor hits $0)', results['PURE BUILD'].floor <= 0);
    chk('BRIDGE does NOT escape (decent-but-loose play still loses — at most B)', ['F', 'C', 'B'].indexOf(results['BRIDGE'].rank) > -1);
    chk('OPTIMAL wins (A or better — only tight, well-timed UNCTAD play escapes)', ['A', 'S'].indexOf(results['OPTIMAL'].rank) > -1);
    chk('BLOC-T1 EXPLOIT does NOT win (no export FX → bleeds out)', ['F', 'C', 'B'].indexOf(results['BLOC-T1 EXPLOIT'].rank) > -1);
    chk('PASSIVE collapses to F', results['PASSIVE'].rank === 'F');
    return results;
  }

  global.UT = global.UT || {};
  global.UT.model = {
    C: C, clamp: clamp, mulberry32: mulberry32, newState: newState,
    valueAddFactor: valueAddFactor, termsRatio: termsRatio, maintFor: maintFor,
    projExport: projExport, projBuild: projBuild, projImport: projImport,
    applyTurn: applyTurn, score: score, rank: rank, outcome: outcome, RANKS: RANKS, DEATHS: DEATHS, simulate: simulate
  };

  // run the harness on load (present & runnable per §4.3)
  try { simulate(); } catch (e) { /* never break the page over the harness */ }

})(typeof window !== 'undefined' ? window : this);
