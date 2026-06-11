# UNFAIR TRADE — Mechanics Spec (v1.0, Build-Ready)

> One developing nation. Twelve years. Watch your best move stop working.

---

## 1. Design Goal

**The fun:** A fast, tense, "one-more-try" allocation game where the seductive move (export!) feels amazing for three turns, then quietly betrays you. The drama is a felt arc — False Spring → The Squeeze → Pivot-or-Pit — not a stat sheet.

**The lesson it must teach (and the player must *feel*, never read):**
1. **Prebisch-Singer made visceral:** raw-commodity prices fall over time vs. manufactures. The player learns this by watching their own Export button earn less every year as two price lines scissor apart on a live chart.
2. **Commodity dependence is a trap:** "just export more" is mathematically incapable of winning; it accelerates your own decline.
3. **UNCTAD's real prescription is the only escape:** *diversify into manufacturing* AND *demand fairer terms from a position of leverage*. Advocacy without bargaining power fizzles — mirroring UNCTAD's non-binding, analytical-not-enforcing reality.

The lesson is **emergent from the payoff curves**, then **named once** on the debrief screen.

---

## 2. Core Loop

One turn = one **YEAR**. Run = **12 years** (1964 → 2026, a quiet nod to UNCTAD's lifespan). Target: **~2.5–3 min/run**, replayable 2–3× in a Zoom slot.

```
Read the market headline  →  Spend Labor + pick a strategic lever
   →  Press ADVANCE YEAR  →  Watch the 700ms resolution (price lines scissor,
       cash counts, bars slide)  →  React to event card (if any)  →  Re-read chart  →  repeat
```

A first-timer must be able to go **headline → decision in under 5 seconds**. Only 3 numbers are ever shown large (Treasury, Commodity line, Mfg line); everything else is secondary.

---

## 3. Resources / Stats

Five stats. Three are hero-sized on screen; two are secondary meters.

| Stat | Start | Range | Role | Display |
|---|---|---|---|---|
| **Treasury ($)** | 100 | 0 → ∞ (lose at ≤0) | Score + fuel | HERO (big counter) |
| **Commodity Price Index** | 100 | 0–200 | The villain — drifts **down** | HERO (red line on chart) |
| **Manufactures Price Index** | 100 | 0–200 | drifts **up** | HERO (blue line on chart) |
| **Industrial Capacity** | 5 | 0–100 | The escape asset | secondary bar |
| **Bargaining Power** | 10 | 0–100 | Unlocks fair-terms lever | secondary bar |

**Derived (not shown as a number, but *felt*):** the **scissor gap** = MfgIndex − CommodityIndex. Starts at 0, widens all game. This visual is the thesis.

**Labor:** a per-turn pool of **5 tokens** (not persistent; refreshes each year, modifiable by events). Allocated across the two production actions.

---

## 4. Player Actions

Each year the player **allocates Labor (5 tokens)** between the two production actions, and may **also** trigger at most **one strategic lever** (levers don't cost Labor; they cost Treasury or a precondition).

### Production actions (split 5 Labor between them)

**A. EXPORT COMMODITIES** — *the trap*
- Income: `+ Labor_export × (CommodityIndex / 100) × 6`
- Side effect: **CommodityIndex −2 extra this turn** (you flood your own market).
- Builds nothing.
- *Feel:* turn 1 at index 100, 5 tokens = **+$30**. Glorious. By turn 8 at index ~62, the same 5 tokens = **~+$19** and falling. The button visibly weakens.

**B. BUILD INDUSTRY** — *the patience tax / escape*
- Income: `+ Labor_build × (IndustrialCapacity / 100) × (MfgIndex / 100) × 22`
- Side effect: **IndustrialCapacity += 6 × Labor_build / 5** (full allocation = +6/turn).
- *Feel:* turn 1 at capacity 5, full build = **~+$5**. Feels terrible vs. export's $30. But capacity compounds: by turn 7 (capacity ~40, Mfg ~112) full build ≈ **+$108/turn** and *rising* while export sinks. This is the deliberate valley-of-death crossover around **turn 5–6**.

### Strategic levers (one per year max)

**C. JOIN REGIONAL BLOC** *(G77 / regional integration)* — once per game, costs **$30**
- **+25 Bargaining Power**, **+10% to all trade income permanently**, **halves the next shock event's damage.**
- The "stop the bleeding / set up the win" move.

**D. DEMAND FAIRER TERMS AT UNCTAD** — repeatable, **requires Bargaining ≥ 40**
- On use: **CommodityIndex +12 immediately**, and **commodity drift is halved for the next 3 turns** (the price floor).
- If Bargaining < 40, the button is visibly **locked** with tooltip "You need leverage first — build it through blocs and diversification." (Teaches: advocacy needs power.)
- Models UNCTAD's *non-binding* reality: it **dampens** decline, never eliminates it.

---

## 5. The "Declining Terms of Trade" Model (the trap engine)

This is the heart. Each year, in resolution order:

```js
// 1. Structural drift — Prebisch-Singer, made worse by dependence
const dependence = 1 - (industrialCapacity / 100);        // 0..1
let commodityDrift = 2 + dependence * 5;                  // pure-commodity ≈ -7/yr, diversified ≈ -2/yr
if (fairTermsActive) commodityDrift *= 0.5;               // UNCTAD price floor
commodityIndex -= commodityDrift;

// 2. Manufactures quietly appreciate
mfgIndex += 1 + Math.random() * 2;                        // +1..+3/yr

// 3. Player's own export floods the market (applied during action resolve)
//    commodityIndex -= 2 * (laborExport > 0 ? 1 : 0)  // see Action A

// 4. Clamp
commodityIndex = clamp(commodityIndex, 0, 200);
mfgIndex = clamp(mfgIndex, 0, 200);
```

**Why it's a trap, in one sentence:** export income scales with `CommodityIndex/100`, but exporting *lowers* CommodityIndex while building *nothing* that slows the structural drift — so the only lever that reduces drift is **IndustrialCapacity**, and the only lever that lifts the index back up is **UNCTAD (gated behind Bargaining)**. Linear export gains can never outrun a compounding index decline. The scissor *always* opens for a pure exporter.

---

## 6. Events / Variability

After Year 3, each year has a **~55% chance** to draw **one card** from a deck (drawn without replacement; run seeded by `Date.now()` so no two runs match). Cards are **1-line headlines that animate in**, telegraphed by a **news-ticker the turn before** ("Murmurs of a price crash next year…"). Most are **choose-1-of-2**; some are forced.

| # | Card | Effect | Teaches |
|---|---|---|---|
| 1 | **Commodity Super-Cycle** | Choose: *Export everything* → CommodityIndex +35 this turn, then **−20 next turn** (hangover). Or *Hold steady* → small +Resilience, no crash. | The boom-bust honeytrap of dependence. |
| 2 | **Price Crash** | CommodityIndex **−18**. Halved if in a bloc. | Undiversified = exposed. |
| 3 | **Drought** | Labor pool **−1 next turn** (4 tokens); export income halved that turn. | Monoculture fragility. |
| 4 | **Rich-Nation Tariff Wall** | Raw exports **blocked 1 turn** (Export income = 0). Industry income unaffected. | Only diversified survive protectionism. |
| 5 | **GSP Preference Granted** | +15% trade income for 3 turns. | UNCTAD's real Generalized System of Preferences. |
| 6 | **Foreign Factory Offer** | Choose: *Accept* → instant **+15 Capacity** but **−8% income/turn for rest of game** (royalty leak). Or *Decline* → nothing. | Dependency dressed as a gift. |
| 7 | **NIEO Reform Window** | Next **Demand Fairer Terms** is **doubled** (+24, drift-halve 4 turns). | The 1974 New International Economic Order push. |
| 8 | **G77 Solidarity** | +15 Bargaining Power immediately. | Collective bargaining power. |

Each run draws ~3–4 cards from the 8 → high divergence, every card tagged to a real concept.

---

## 7. Win / Lose & Scoring

**Hard lose (instant):** Treasury ≤ 0 → screen desaturates → **"DEBT CRISIS."**

**End of Year 12 — final score:**
```
Score = Treasury + (IndustrialCapacity × 4) + (BargainingPower × 2) + max(0, CommodityIndex − 50)
```

**Rank card (stamped, names *why*):**

| Rank | Condition | Stamp copy |
|---|---|---|
| **F — Collapse** | Treasury hit 0 | "You exported your way to ruin." |
| **C — Resource Colony** | Capacity < 30 | "Still digging and shipping. The terms of trade ate your gains." |
| **B — Emerging Economy** | Capacity ≥ 30, Score < 700 | "You started to break out. Not fast enough." |
| **A — Diversified Nation** | Capacity ≥ 50 AND CommodityIndex ≥ 55, Score ≥ 700 | "You added value and weathered the squeeze." |
| **S — Geneva Consensus** | Capacity ≥ 50 AND Bargaining ≥ 60 AND Score ≥ 1000 | "You diversified AND demanded fairer terms. This is what UNCTAD fights for." |

A pure-exporter **cannot exceed C** — mathematically capped by the falling index. The top tier **requires both pillars** (capacity + bargaining), exactly UNCTAD's prescription.

---

## 8. Difficulty & Balance (tuning targets)

**The deliberate arc:**
- **Years 1–3 (False Spring):** No events. CommodityIndex ~100. Export pays ~$30/turn. Player feels smart. *Bait set.*
- **Years 4–6 (The Squeeze):** Events begin. Drift compounds (index ~75→62). Export now pays ~$19. The diversifier's capacity crosses break-even (~turn 5–6). *Dawning horror.*
- **Years 7–9 (Pivot or Pit):** Industry income snowballs ($100+/turn); pure exporters stall. UNCTAD lever comes online for the prepared. *Comeback vs. spiral.*
- **Years 10–12 (Verdict):** Compounding decides it.

**Target outcomes (tune to hit these):**
- **Pure-export spam:** ends Year 12 around **Treasury ~250–350, Capacity 5** → **Rank C**, never higher. Often flirts with debt after a crash. *"Just export" loses.*
- **Naive diversify-only (no levers):** survives, ~**Rank B**.
- **Smart line** (diversify turns 1–4 weathering the dip → join bloc ~turn 4 → build Bargaining → time UNCTAD demand onto a Price Crash): a first-timer playing well **barely reaches A**; near-optimal play with good event luck reaches **S**.
- **Crossover point** (build > export per-turn income) must land at **turn 5–6** — verify in a spreadsheet pass; if it's later than turn 7, raise the Build multiplier (22→24) or capacity gain (6→7).

**Balance guardrails:**
- Diversifying *too* hard turns 1–2 (all 5 Labor to build, $0 income) risks an early-event debt spiral — that's intended *tension*, not a softlock; starting Treasury 100 gives ~2 turns of runway.
- Bloc's $30 cost + 10% income bump must pay back by ~turn 8.

---

## 9. Game Feel & Juice

- **The scissor chart is the star.** Two animated lines (commodity red, mfg blue) extend one segment per turn with a 700ms ease; the widening gap is shaded. On a pure-export run it tears open dramatically — *that's the screenshot moment.*
- **The weakening button:** Export's projected payoff (`+$XX`) is printed *on the button* and recomputed live every turn. Watching "+$30" decay to "+$18" is the core teaching beat. Tween the number down.
- **Cash counter** rolls up/down with easing; green for gains, red for losses; subtle coin tick SFX (mutable).
- **Event cards** slide/flip in with a paper-stamp sound; news-ticker crawls along the bottom as foreshadow.
- **UNCTAD demand** when fired: screen-wide pulse, the commodity line visibly *jumps up*, a satisfying low "boom" — the earned catharsis.
- **Rank stamp** thunks onto the debrief card (ink-stamp animation), desaturate-to-color reveal for A/S, grayscale for F.
- **Haptics** on mobile for advance-year and event draws.
- Number tweens, line easing, and a tilting "terms of trade" balance-beam icon (commodity vs mfg) give physical-feeling feedback with zero physics engine — pure CSS/SVG transitions.

---

## 10. How the Lesson Emerges + Debrief Copy

**Emergence (no lectures during play):**
- You *watch* the commodity line fall and the mfg line rise — the scissor IS Prebisch-Singer.
- You *feel* your Export button earn less each year — terms-of-trade decay, self-inflicted.
- You *miss the patience window* if you export-spam — commodity dependence as a trap.
- You *earn* the UNCTAD "Demand Fairer Terms" button only after building leverage — advocacy needs power.
- The only path to **S** forces you to do **both** UNCTAD prescriptions — the lesson is the win condition.

**Debrief screen — copy points (shown after the rank stamp):**

1. **Name the feeling:** *"You watched your best move stop working. That's the **Prebisch-Singer thesis** — raw-commodity prices fall over time against manufactured goods, so commodity exporters' terms of trade steadily decline."*
2. **Name the trap:** *"Today **95 of 143 developing economies** are commodity-dependent — including over **80% of the Least Developed Countries**. Exporting more raw goods deepens the dependence."*
3. **Name the escape:** *"The way out is the way you won (or didn't): **diversify into manufacturing** to add value, and **demand fairer terms** from a position of collective strength."*
4. **Name the institution:** *"This is the work of **UNCTAD** — UN Trade and Development — founded in **Geneva, 1964** under economist **Raúl Prebisch**, to advocate for developing nations. **195 members**, three pillars: research, consensus-building, technical cooperation."*
5. **Name the honest limit (ties to the gated lever):** *"But UNCTAD has **no enforcement power** — unlike the WTO, its influence is analytical and diplomatic. That's why, in the game and in reality, fairer terms required **leverage**, not just a demand. From the 1974 **New International Economic Order** to the 2025 **Geneva Consensus**, the fight continues."*
6. **CTA:** *"Most first-timers score a C. **Try again — diversify earlier.**"* + best-score badge saved to `localStorage`.

---

### Implementation note for the builder
All state is one JS object (`{treasury, commodityIndex, mfgIndex, capacity, bargaining, year, laborSplit, flags, deck}`). Every formula above is plain arithmetic resolved in the order listed in §5. No backend, no libraries required beyond optional lightweight tween — trivially a single self-contained artifact. Seed the event deck with `Date.now()`. Persist only best-score/rank in `localStorage`.
