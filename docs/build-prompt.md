You are an **award-winning interactive designer and front-end engineer** building a piece of editorial data-journalism that doubles as a polished indie game. Your reference bar is **The New York Times graphics desk, The Pudding, and Bloomberg Graphics, crossed with a restrained, tactile indie game**. You are building a single-page scrollytelling experience about **UNCTAD (UN Trade and Development)** with an embedded, genuinely fun game called **"Unfair Trade."**

This is a university report shown over Zoom (presenter screen-shares and scrolls; classmates open the link and play on their own phones/laptops; ~5–10 min slot). It must look hand-crafted and distinctive — **explicitly NOT the generic "AI website" aesthetic.** If it looks like a default SaaS template, you have failed.

---

## 0. NON-NEGOTIABLE QUALITY BAR

- **Banned, on sight:** purple/blue SaaS gradients, glassmorphism, neon-on-black "dashboard" cliché, drop-shadow soup, emoji flags, generic hero-with-centered-blob layouts, the "everything floats up 80px" reveal, zoom/spin reveals, and **confetti (ever)**.
- **The palette is the argument.** The whole page moves on one emotional axis: cold/bleached **extraction** → warm/saturated **agency**. Color, motion, and the game all enact one thesis: *declining terms of trade (Prebisch-Singer) keep commodity exporters poor; the escape is to add value and demand fairer terms.* Saturated pixels must be **earned by good play**, never given.
- **Restraint in the trap, release in the escape.** No decoration that doesn't carry meaning.
- **Accuracy is mandatory.** Use ONLY the verified facts in §11. Do not invent statistics, dates, or names. The game's numbers are an illustrative **simulation** and must be labeled as such.

---

## 1. BUILD PRIORITY TIERS (read first — this governs everything)

You are producing ONE self-contained artifact in one pass. If you cannot complete everything to a polished standard, **ship fewer features fully working — never stub.** No `// sound would go here`, no placeholder comments standing in for missing behavior. Build strictly in this order:

- **P0 (must ship, fully working):** correct game loop + economy (the §6 model, including upkeep), the scissor chart drawing one segment/turn, all 5 ranks firing correctly, the gated "Demand Fairer Terms" lever reachable by skill, accurate editorial prose for all 11 sections, full responsive layout solid at 360px, keyboard play, `prefers-reduced-motion` + JS-off legibility, WCAG AA contrast, and the **`simulate()` console harness in §6.3**.
- **P1 (add once P0 is solid):** the saturation mechanic (background layer only — see §2), all count-up tweens, the 8-card event deck with telegraphing, the two GSAP-pinned scrubbed beats, the persistent terms-of-trade spine.
- **P2 (polish, only if budget remains):** Web Audio synthesis, haptics, balance-beam tilt icon, ink-stamp verdict animation, screen-shake.

Whatever tier you reach, everything below it must be complete and bug-free.

---

## 2. TECH & DELIVERY

- **Plain semantic HTML + CSS + vanilla JS. No framework — this is mandated, do not deliberate React vs vanilla mid-build.** A single `index.html` that runs by opening the file. Deploys to **Vercel as a static single-page app**, zero backend, zero build step.
- **Allowed external loads:** Google Fonts (Fraunces, Inter, IBM Plex Mono) and **GSAP + ScrollTrigger from a CDN, used for the two pinned data beats only** (§7.4, §7.5). Everything else is hand-written. **Do not** use Lenis or any smooth-scroll library — the base scroll engine is **native scroll + `IntersectionObserver`.**
- **Scroll architecture (one coordinated system — do not treat these as independent features):**
  - The spine progress indicator reads `window.scrollY` directly. It must **never** read GSAP progress.
  - `scroll-snap-align: start` is applied **only** to the game-handoff section and the game-exit/debrief section — **never** on the two pinned scrub beats (snap fights scrub).
  - GSAP ScrollTrigger pinning is used **only** on §7.4 and §7.5; wrap both in `gsap.matchMedia()` so reduced-motion renders them in final state, unpinned.
- **Production-quality, desktop-first, fully solid on mobile** (test mentally at 360px width). Responsive via `clamp()` fluid type and a 12-col desktop grid collapsing to single column. **Use `dvh`, not `vh`, for any full-height element** (iOS toolbar).
- **Accessible (WCAG AA):** all text meets AA contrast; `:focus-visible` rings everywhere; game keyboard-playable; respects `prefers-reduced-motion`; all scroll-revealed content present in the DOM at load and screen-reader-linear if JS/motion fails. **No fact may depend on motion or color alone** — every chart annotation and verdict also exists as visible text.
- Performance: animate only `transform`/`opacity`; target 60fps on a mid laptop while screen-sharing. Crisp, decisive motion (Zoom compression eats sub-pixel drift).
- **Storage:** wrap **all** `localStorage` access in `try/catch` with graceful degradation — a storage failure (sandboxed iframe `SecurityError`) must never break the game. Persist only best-score/rank.
- **Seeding:** seed the event deck from a small PRNG (e.g. mulberry32). Default seed is `Date.now()`, but read an optional **`?seed=` URL param** first so the presenter can demo a known-good run.

---

## 3. DESIGN SYSTEM

### Color tokens (use these exact hex values, as CSS custom properties)
**The Periphery (cold trap):**
`--deep-atlantic:#0B1E2D` (primary ground / game table) · `--slate-sea:#16323F` (panels) · `--bleached-clay:#C9C6BE` (the depleted neutral everything drains toward) · `--cold-tin:#8A9BA8` (muted data lines, secondary labels)

**The Core (warm escape):**
`--terracotta:#E8743B` (THE hero accent; CTAs, "Play Again," diversification) · `--brass:#F2B705` (gains, GDP/Treasury, "Join Bloc") · `--verdant:#0E8A6B` (manufacturing/growth, "Diversify")

**Institutional bridge:** `--un-blue:#4B92DB` — used **sparingly**, only when the institution speaks: UNCTAD voice, citations, the "Demand Fairer Terms" mechanic, prescriptions, and the honest-caveat section.

**Alarm (single canonical red):** `--alarm-rust:#C24A3A` — price shocks, terms-of-trade decline, the Prebisch-Singer gap, "STILL DEPENDENT" verdict. Use only this red.

**Editorial paper (light reading beats):** `--parchment:#F4EFE6` (body bg) · `--ink:#0B0E14` (text on parchment). For body-size text on dark backgrounds, use `#E8E4DA` to hold AA contrast.

### Typography (Google Fonts; three roles, hard rule: never mix faces within one line)
- **Fraunces** — display/headlines/pull-quotes/years only. `wght:600`, high `opsz`, tracking ~−0.01em. Emotional/argument beats.
- **Inter** — all body, decks, UI labels, captions. `line-height:1.65`, min **18px** for body. `font-variant-numeric: tabular-nums` on any inline figure.
- **IBM Plex Mono** — data/game HUD only (Treasury, indices, turn counter, %, verdicts). **Tabular figures mandatory** so values don't jitter while ticking. Mono caps labels: `0.8125rem`, `letter-spacing:0.08em`, uppercase.

**Fluid type scale:** hero `clamp(3rem,7vw,6.5rem)` Fraunces 600 · section heading `clamp(2rem,4vw,3.25rem)` Fraunces 600 · deck `clamp(1.25rem,2vw,1.6rem)` Inter 500 · body `clamp(1.125rem,1.3vw,1.25rem)` Inter 400 · HUD numbers `clamp(1.5rem,2.5vw,2.25rem)` Plex Mono 500. **Reading measure capped at 680px.**

### Layout
12-col desktop grid, 24px gutters, max content 1200px, prose centered in a 680px measure. **Data-viz and the game break grid full-bleed (100vw)** — the contrast between contained prose and full-bleed interactive is part of the rhythm. **120px+ vertical rhythm** between sections. Mobile: single column, full-bleed default, game action cards in the bottom thumb-third.

### The signature device — "the terms-of-trade spine"
A thin **commodity-price sparkline** that lives in the page persistently: anchored to the **left gutter (desktop)** / **top edge (mobile)**, doubling as a scroll-progress indicator (driven by `scrollY`) tinted to the active terms-of-trade value. It **climbs hopefully at the open, sags downward through the trap sections, and is redrawn triumphantly upward in the resolution.** One line carrying the whole argument, hero to conclusion.

### Voice & copy (write the prose yourself — this is half the build)
Confident editorial register, NYT-graphics-desk concision. **Every line carries a concrete object you can hold** — the exemplar is *"Your coffee buys fewer tractors each year."* No abstraction without a thing attached. **Banned tells:** "In today's interconnected world," "delve," "navigate the complexities," "ever-evolving," rhetorical-question openers (the cold-open question in §7.1 is the only one permitted). Short sentences. Let the design breathe; never pad.

### Hero visuals — construction recipes (do NOT leave to imagination; faking these produces the banned generic look)
- **Cargo-ship silhouette (§7.1):** one inline SVG `<path>` of a low container-ship profile (hull + stacked container blocks + single funnel), filled `--cold-tin` at ~12% opacity, translating slowly across on a long linear `transform` loop. Not a CSS triangle.
- **Prebisch portrait (§7.2):** do not fabricate a photo. Use a **two-tone halftone-style SVG illustration or a large Fraunces monogram "RP"** in a duotone frame (`--deep-atlantic` + `--bleached-clay`). Tasteful, clearly an illustration.
- **Cargo crates / commodity tiles (game):** real bevel via **layered inset/outset `box-shadow`** (light top-left, dark bottom-right), corner geometry with a small clipped chamfer, and grain from a low-opacity inline SVG `feTurbulence` overlay. Never a flat `<div>`.
- **Cockpit ground (game):** `--deep-atlantic` base + a hex/topographic grid as a repeating inline-SVG background at ~4% opacity + a CSS radial-gradient scanline vignette. Subtle, not neon.

### Motion vocabulary
- Reveals: **opacity + 8–24px translateY only.** Stagger siblings ~60ms. Easing: reveals `cubic-bezier(0.16,1,0.3,1)`; state changes `cubic-bezier(0.65,0,0.35,1)`.
- One shared **count-up util** for every number (195, 44, 95, years, game stats): in-view only, ~1.2s expo-out, tabular figures.
- **The saturation mechanic (critical a11y constraint):** the live `filter: saturate()` bound to score is applied **only to a decorative/background layer** of the game stage — **never** to text, to the scissor chart's data lines, or to any meter that must be read. The data lines (`--alarm-rust` commodity, `--un-blue`/`--verdant` mfg) and all HUD text keep full contrast at every saturation level; verify the most-bleached state still passes AA. The escape section (§7.9) is the most saturated, warmest frame in the page.
- **Reduced motion:** collapse to instant opacity; tickers snap to final; pinned charts render in final state.

---

## 4. (reserved)

---

## 5. (reserved)

---

## 6. THE GAME — "Unfair Trade" (full spec)

> One developing nation. Twelve years (1964 → 2026). Watch your best move stop working. Target ~2.5–3 min/run, replayable 2–3× in a Zoom slot. A first-timer must get from market headline → decision in **under 5 seconds.**

### 6.0 Handoff & cockpit treatment
On entry, the editorial column slides away and the viewport seats into a dark **"war-room cockpit"** (ground + grid + vignette per §3 recipe). HUD chrome drops in from the edges over ~600ms (corners draw first, then panels fill). On exit, the cockpit recedes and parchment returns. The contrast IS the juice. Commodities render as tactile **cargo crates/tiles** (§3 recipe) — not flat icons. Panel `--slate-sea`, stroke `#2A3038`, primary text `#E8E4DA`.

### 6.1 State object
`{treasury, commodityIndex, mfgIndex, capacity, bargaining, year, laborSplit, flags, deck}`. All arithmetic resolves in the order in §6.2. No backend.

### Stats (5; three hero-sized, two secondary)
| Stat | Start | Range | Role | Display |
|---|---|---|---|---|
| **Treasury ($)** | 100 | 0→∞ (lose at ≤0) | score + fuel | HERO big counter (Brass) |
| **Commodity Price Index** | 100 | 0–200 | the villain, drifts **down** | HERO red line on chart |
| **Manufactures Price Index** | 100 | 0–200 | drifts **up** | HERO blue line on chart |
| **Industrial Capacity** | 5 | 0–100 | the escape asset | secondary bar (Verdant) |
| **Bargaining Power** | 10 | 0–100 | unlocks fair-terms lever | secondary bar (UN Blue) |

**Derived & felt (not shown as a number):** the **scissor gap** = MfgIndex − CommodityIndex. Starts ~0, widens all game. This visual IS the thesis. **Labor** = a per-turn pool of **5 tokens** (refreshes each year, modifiable by events), allocated across the two production actions.

### HUD layout
Top: nation name + **turn counter as a segmented pip row** `TURN 3 / 12` (not a bare number). Left rail: **three vertical capsule meters ("tanks")** — Treasury/GDP (Brass), Diversification/Capacity % (Verdant, made to feel rare and precious), Dependence (Alarm Rust). Right: the **live Terms-of-Trade line chart** (the star metric) drawing one new segment per turn — healthy=teal/Verdant, collapsing=bleeds toward `--alarm-rust`. Bottom: the **action deck.** Keyboard: **number keys 1–4 map to the four moves**; advance-year on a clear key (Enter or Space) too. All buttons ≥44px touch targets.

**Mobile seam (mandatory — this is the #1 failure mode for the Zoom-from-phone audience):** the entire game stage must fit within **`100dvh`** with no page scroll required to reach any control. While the game is active: set `body { position: fixed; width: 100% }`, `touch-action: none` on the stage, and `overscroll-behavior: contain`; **save and restore `scrollY` on enter/exit.** If content cannot fit, the **internal action-deck region may `overflow:auto`** — the page itself never scrolls during play. The end-screen's explicit **"Return to story ↓"** restores scroll position and re-enables scrolling.

### Player actions
Each year: **allocate 5 Labor tokens** between the two production actions, and optionally trigger **at most one strategic lever** (levers cost Treasury/precondition, not Labor).

**A. EXPORT COMMODITIES — the trap (`--bleached-clay` card).**
`income += Labor_export × (commodityIndex/100) × 6`. Side effect: `commodityIndex −= 2` extra this turn (you flood your own market). Builds nothing. *Feel:* turn 1 at index 100, 5 tokens = **+$30**. By ~turn 8 at index ~62, same 5 tokens ≈ **+$19** and falling. **Print the live projected payoff (`+$XX`) ON the button and recompute it every turn — watching "+$30" decay to "+$18" is the core teaching beat; tween it down.** The reward coin-burst fires *before* the consequence so the trap closes on the player.

**B. BUILD INDUSTRY — the patience tax/escape (`--verdant` card).**
`income += Labor_build × (capacity/100) × (mfgIndex/100) × 22`. Side effect: `capacity += 6 × Labor_build/5` (full allocation = +6/turn). Also: `bargaining += 1.5 × Labor_build/5` (full build = +1.5/turn — **diversification earns leverage**; see §6.4). *Feel:* turn 1 ≈ **+$5** (feels terrible vs export). But capacity compounds. The **build-per-turn > export-per-turn crossover MUST land at turn 5–6** — confirm via the §6.3 harness; if later than turn 7, raise the build multiplier (22→24) or capacity gain (6→7) and re-run.

**C. JOIN REGIONAL BLOC (G77 / regional integration) — `--brass` card.** Once per game, costs **$30**: **+25 Bargaining Power**, **+10% to all trade income permanently**, **halves the next shock event's damage.** Must pay back by ~turn 8.

**D. DEMAND FAIRER TERMS AT UNCTAD — `--un-blue` card.** Repeatable, **requires Bargaining ≥ 40** to fire. On use: **commodityIndex += 12 immediately**, and **commodity drift halved for the next 3 turns.** If Bargaining < 40, the button is **visibly locked** with tooltip *"You need leverage first — build it through blocs and diversification."* When fired: screen-wide pulse, the commodity line visibly **jumps up**, a low "boom." A small **"non-binding"** tag flickers in (honors the real limitation). Models UNCTAD's non-binding reality: it **dampens** decline, never eliminates it. **Note the two thresholds clearly in the UI: 40 unlocks the lever; 60 Bargaining is separately required for Rank S.**

### 6.2 The economy model (the trap engine — resolve in this EXACT order each year)
```js
// 0. UPKEEP — fixed cost of running the state. THIS is what creates runway pressure.
//    Without income, Treasury (start 100) drains in ~5 turns. An all-build opening
//    (near-zero early income) is intended tension; a long no-income streak = debt spiral.
treasury -= 12;                                    // flat upkeep every year

// 1. Resolve player actions for the turn:
//    exportIncome = laborExport × (commodityIndex/100) × 6
//    buildIncome  = laborBuild  × (capacity/100) × (mfgIndex/100) × 22
//    treasury += (exportIncome + buildIncome) × incomeMultiplier   // bloc/GSP/royalty modifiers
//    capacity  += 6   × laborBuild/5
//    bargaining += 1.5 × laborBuild/5
//    if (laborExport > 0) commodityIndex -= 2;     // you flood your own market

// 2. Structural drift — Prebisch-Singer, worsened by dependence
const dependence = 1 - (capacity / 100);           // 0..1
let commodityDrift = 2 + dependence * 5;           // pure-commodity ≈ −7/yr, diversified ≈ −2/yr
if (fairTermsActive) commodityDrift *= 0.5;        // UNCTAD price floor
commodityIndex -= commodityDrift;

// 3. Manufactures quietly appreciate
mfgIndex += 1 + rng() * 2;                          // +1..+3/yr  (rng = seeded PRNG, NOT Math.random)

// 4. Clamp both indices to 0..200; then check Treasury ≤ 0 → DEBT CRISIS (instant loss)
```
**Why it's a trap, in one line:** export income scales with `commodityIndex/100`, but exporting *lowers* it while building *nothing* that slows the structural drift — so the only lever that reduces drift is **Industrial Capacity**, and the only lever that lifts the index back is **UNCTAD (gated behind Bargaining)**. Upkeep means standing still loses; linear export gains can never outrun a compounding index decline plus fixed upkeep. The scissor always opens for a pure exporter.

### 6.3 MANDATORY balance harness (ship this in the artifact)
Include a `simulate()` function that runs three fixed strategies over all 12 years using the §6.2 model with a fixed seed, and **`console.table()`s a turn-by-turn row (year, treasury, commodityIndex, mfgIndex, capacity, bargaining, exportPerTurn, buildPerTurn) for each**, plus a final rank. It runs once on page load (behind `if (location.search.includes('debug'))` or always — your call, but it must be present and runnable). **Paste its actual printed output as a comment block** above the function. The three strategies and their required outcomes:
- **PURE EXPORT** (5 export every turn, no levers) → ends Treasury ~250–350, Capacity 5, **Rank C, never higher**; flirts with debt after a crash.
- **PURE BUILD** (5 build every turn, no levers) → survives the early upkeep dip, **Rank ~B**.
- **OPTIMAL** (build-weighted turns 1–4 → Join Bloc ~turn 4 → keep building Bargaining → fire Demand Fairer Terms once Bargaining ≥ 40, ideally onto a Price Crash) → reaches **A, S with good event luck**.
**The crossover (buildPerTurn > exportPerTurn) must appear at year 5 or 6 in the PURE BUILD / OPTIMAL rows.** If any target misses, adjust the constants flagged in §6.1–6.2 and re-run until all pass — then paste the passing table. Do not claim balance without the printed table.

### 6.4 Bargaining reachability (the headline lever must be earnable by skill, not luck)
Bargaining starts at 10. Sources: **Join Bloc (+25), Build Industry (+1.5/turn at full build, per §6.1B), G77 Solidarity event (+15, RNG).** A skilled player must be able to reach **40 by ~turn 7 without relying on any event** — e.g. 10 + 25 (bloc turn 4) + ~1.5×4 build turns = ~41. Verify this path in the §6.3 OPTIMAL run. The "Demand Fairer Terms" mechanic — the thematic payoff of the whole piece — **must never be RNG-gated out of a skilled run.**

### Events (the replayability engine)
After Year 3, each year has **~55% chance** (via seeded `rng()`) to draw **one card** from the deck **without replacement**. **Telegraph with a news-ticker the turn before** (*"Murmurs of a price crash next year…"*). Cards animate in with a paper-stamp sound. Most are choose-1-of-2.

| # | Card | Effect | Teaches |
|---|---|---|---|
| 1 | **Commodity Super-Cycle** | Choose: *Export everything* → CommodityIndex +35 now, **−20 next turn** (hangover). Or *Hold steady* → small +resilience, no crash. | Boom-bust honeytrap |
| 2 | **Price Crash** | CommodityIndex **−18**. Halved if in a bloc. | Undiversified = exposed |
| 3 | **Drought** | Labor pool **−1 next turn** (4 tokens); that turn's export income halved. | Monoculture fragility |
| 4 | **Rich-Nation Tariff Wall** | Raw exports **blocked 1 turn** (export income = 0); industry income unaffected. | Only diversified survive protectionism |
| 5 | **GSP Preference Granted** | +15% trade income for 3 turns. | UNCTAD's real Generalized System of Preferences |
| 6 | **Foreign Factory Offer** | Choose: *Accept* → instant **+15 Capacity** but **−8% income/turn for rest of game** (royalty leak). Or *Decline* → nothing. | Dependency dressed as a gift |
| 7 | **NIEO Reform Window** | Next **Demand Fairer Terms** is **doubled** (+24, drift-halve 4 turns). | The 1974 New International Economic Order |
| 8 | **G77 Solidarity** | +15 Bargaining Power immediately. | Collective bargaining power |

### Win / lose & scoring
**Hard lose (instant):** Treasury ≤ 0 → screen desaturates (background layer only) → **"DEBT CRISIS."**
**End of Year 12:** `Score = Treasury + (Capacity × 4) + (Bargaining × 2) + max(0, CommodityIndex − 50)`.

| Rank | Condition | Stamp copy |
|---|---|---|
| **F — Collapse** | Treasury hit 0 | "You exported your way to ruin." |
| **C — Resource Colony** | Capacity < 30 | "Still digging and shipping. The terms of trade ate your gains." |
| **B — Emerging Economy** | Capacity ≥ 30, Score < 700 | "You started to break out. Not fast enough." |
| **A — Diversified Nation** | Capacity ≥ 50 AND CommodityIndex ≥ 55, Score ≥ 700 | "You added value and weathered the squeeze." |
| **S — Geneva Consensus** | Capacity ≥ 50 AND Bargaining ≥ 60 AND Score ≥ 1000 | "You diversified AND demanded fairer terms. This is what UNCTAD fights for." |

A pure-exporter **cannot exceed C** (mathematically capped). The top tier **requires both pillars** — exactly UNCTAD's prescription.

### Balance arc (the §6.3 harness must confirm these)
- **Years 1–3 (False Spring):** no events, index ~100, export ~$30/turn. Bait set.
- **Years 4–6 (The Squeeze):** events begin, index ~75→62, export ~$19, build crosses break-even turn 5–6. Dawning horror.
- **Years 7–9 (Pivot or Pit):** industry snowballs ($100+/turn); exporters stall; UNCTAD lever comes online for the prepared.
- **Years 10–12 (Verdict):** compounding decides it.
- Upkeep ($12/yr) on start Treasury 100 gives ~5 turns of no-income runway — an all-build opening is intended tension, not a softlock; a pure-export crash can still tip into debt.

### Game feel & juice (build per the §1 tiers)
Every action resolves with: (1) 120ms card press-down + spring-back; (2) **count-up tween** on affected stats (never hard-cut; year advances with a mechanical digit-flip); (3) a floating **delta chip** `+$24` that rises and fades; (4) **2–3px screen-shake only on bad outcomes/price shocks**; (5) a **red pulse** on any meter that drops. **The scissor chart is the star** — two animated lines (commodity `--alarm-rust`, mfg `--un-blue`/`--verdant`) extend one 700ms-eased segment per turn, the widening gap shaded; on a pure-export run it tears open dramatically (the screenshot moment). A tilting "terms of trade" **balance-beam icon** gives physical feedback via pure CSS/SVG transitions — no physics engine.
**Wins = the world re-saturating + a warm bloom. Losing = a vignette closing in and the background draining to `--bleached-clay`. No confetti.**
**Sound (P2; Web Audio, mute toggle, default on but quiet):** export = hollow low tone; diversify = bright rising chime; shock = short mechanical tick; UNCTAD demand = low "boom." **Mobile haptics:** `navigator.vibrate(8)` on tap/advance.

### Debrief / game-over (the emotional payoff) — styled as an **UNCTAD policy dossier**
Plex Mono header; a **VERDICT stamp** that thunks on (ink-stamp animation; desaturate-to-color reveal for A/S, grayscale for F); your terms-of-trade line replayed as a hero animation. Then these **copy points** (write the prose):
1. **Name the feeling:** *"You watched your best move stop working. That's the Prebisch-Singer thesis — raw-commodity prices fall over time against manufactured goods, so commodity exporters' terms of trade steadily decline."*
2. **Name the trap:** *"Today 95 of 143 developing economies are commodity-dependent — including over 80% of the Least Developed Countries. Exporting more raw goods deepens the dependence."*
3. **Name the escape:** *"The way out is the way you won (or didn't): diversify into manufacturing to add value, and demand fairer terms from a position of collective strength."*
4. **Name the institution:** *"This is the work of UNCTAD — UN Trade and Development — founded in Geneva, 1964 under economist Raúl Prebisch. 195 members; three pillars: research, consensus-building, technical cooperation."*
5. **Name the honest limit:** *"But UNCTAD has no enforcement power — unlike the WTO, its influence is analytical and diplomatic. That's why, in the game and in reality, fairer terms required leverage, not just a demand. From the 1974 New International Economic Order to the 2025 Geneva Consensus, the fight continues."*
6. **CTA:** *"Most first-timers score a C. Try again — diversify earlier."* + best-score badge saved to `localStorage` (try/catch-wrapped).
Buttons: one Terracotta **"Play Again"** (re-seeds shocks) + **"Return to story ↓"** (restores scroll + auto-advances). A small **"skip to results"** link respects the presenter's clock. **Losing must feel meaningful, not punishing.**

---

## 7. SCROLL STRUCTURE & COPY

Write the actual prose yourself in the §3 voice — below are the **verified facts, the beat, and the copy points** for each section.

**§7.1 — Cold open.** Full-bleed `--deep-atlantic` void. One Fraunces line: *"In 1964, the poor countries of the world asked one question: why does trade keep them poor?"* A slow-drifting cargo-ship silhouette (§3 SVG recipe); the spine sparkline already faintly trending down. On scroll, the question shrinks into a dateline.

**§7.2 — Birth of UNCTAD (1964, Geneva).** Parchment. Duotone Prebisch illustration/monogram (§3 recipe) fades in. The year **1964** set huge as a typographic anchor. Facts: **UNCTAD I held in Geneva, 1964**; emerged from **decolonization and North–South tensions**; the **Group of 77 (G77) formed at it**; first Secretary-General **Raúl Prebisch (1964–69)**, structuralist / centre-periphery economist.

**§7.3 — What UNCTAD is.** Quiet fact beat, numbers count up in Plex Mono: permanent **UN intergovernmental body**, **195 member states**, **HQ Geneva**, **three pillars — research & analysis; consensus-building; technical cooperation**; **quadrennial conferences**. The 2024 rebrand to **"UN Trade and Development"** (acronym **UNCTAD** retained) lands here or at the close — choose one place.

**§7.4 — The thesis: Prebisch-Singer (PINNED centerpiece, GSAP-scrubbed; no scroll-snap here).** Full-bleed dark, pinned. Two lines draw on scroll: **commodities (flat/sagging)** vs **manufactures (rising)**; the widening gap fills with `--alarm-rust` hatch. Narration: *"Your coffee buys fewer tractors each year."* Plain-language statement of the **Prebisch-Singer thesis**: primary-commodity prices tend to fall over time relative to manufactured goods, so commodity exporters' **terms of trade deteriorate**. Ends on the deteriorating terms-of-trade reveal; number ticks in Plex Mono. **All annotations also exist as visible text.**

**§7.5 — Commodity dependence today (PINNED dot grid, GSAP-scrubbed; no scroll-snap here).** A grid of **exactly 143 dots, rendered as 13 columns × 11 rows = 143** (state this layout in the markup). **95 of them** flip to `--alarm-rust` on a scroll-scrubbed stagger; the other 48 stay neutral. Ticker counts `0 → 95`. Fact: **95 of 143 developing economies** are commodity-dependent (**State of Commodity Dependence 2025**), including **over 80% of the Least Developed Countries**. Preview the prescription: **diversify + add value.**

**§7.6 — The handoff → GAME.** Full-viewport interstitial that breaks the editorial calm: *"Reading about it isn't the same as living it. Run a nation."* Single pulsing **▶ Play** affordance. `scroll-snap-align:start` here (one of only two snap points) so the presenter lands cleanly and classmates know to stop scrolling and start tapping.

**§7.7 — THE GAME** (full spec in §6).

**§7.8 — The debrief (scroll resumes; second and final scroll-snap point).** The same spine line shown two ways: **your run vs the historical line**, tying play back to the data. The post-game verdict carries here.

**§7.9 — UNCTAD's real prescriptions.** Re-saturated, warm (`--verdant` + `--terracotta`). A scroll-revealed checklist that literally checks off the moves a winning player made: **diversify / add value · Generalized System of Preferences (GSP) · New International Economic Order (NIEO, 1974) · the Least Developed Countries category (created 1971, now 44) · demand fairer terms.** Diversification bars grow upward; the spine line is **redrawn upward** here.

**§7.10 — The honest limit.** Deliberately quieter, `--un-blue`, indented "editor's note" treatment, smaller type. Fact: **unlike the WTO, UNCTAD has no binding or enforcement power; its influence is analytical and advocacy-based.** Restraint reads as integrity — do not oversell.

**§7.11 — Close (present tense).** The warmest, most resolved frame. Facts: **UNCTAD16 held in Geneva, October 2025 ("Geneva Consensus")**; current Secretary-General **Rebeca Grynspan (since 2021)**; **195 members** (figures as of late 2025); rebranded **2024** as **"UN Trade and Development"** (acronym retained). Quiet credit line.

---

## 11. VERIFIED UNCTAD FACTS (use ONLY these; do not invent others)
- Founded **1964, Geneva (UNCTAD I)**; emerged from decolonization / North–South tensions; the **G77** formed at it.
- **195 member states (as of late 2025)**; HQ **Geneva**; permanent UN intergovernmental body.
- First Secretary-General **Raúl Prebisch (1964–69)**, centre-periphery / structuralist economist; current SG **Rebeca Grynspan (since 2021)**.
- **Three pillars:** research & analysis; consensus-building; technical cooperation.
- **Quadrennial conferences;** **UNCTAD16 — Geneva, October 2025 ("Geneva Consensus").**
- **Prebisch-Singer thesis:** primary-commodity prices fall over time vs manufactures, so commodity exporters' terms of trade deteriorate.
- Tools/ideas: **Generalized System of Preferences (GSP)**; **New International Economic Order (NIEO, 1974)**; **Least Developed Countries category (created 1971, now 44)**.
- **State of Commodity Dependence 2025:** **95 of 143 developing economies** (incl. **>80% of LDCs**) are commodity-dependent; prescription is **diversify + add value.**
- **Limitation (balance):** unlike the WTO, UNCTAD has **no binding/enforcement power**; influence is analytical/advocacy.
- **2024 rebrand** to **"UN Trade and Development"** (acronym **UNCTAD** retained).
- The game's numbers are an **illustrative simulation**, labeled as such — not real UNCTAD data.

---

## 8. ACCEPTANCE CHECKLIST (the build must satisfy ALL)

**Look & feel**
- [ ] Does NOT read as a generic AI/SaaS site; no banned elements (§0). Hero visuals built per the §3 recipes (SVG ship, duotone Prebisch, beveled grain crates) — not faked with CSS triangles/flat divs.
- [ ] Cold trap sections stay genuinely cold/bleached; the escape's warmth visibly lands. Chroma does not leak.
- [ ] Three type roles never mixed within a line; body ≥18px; reading measure ≤680px.
- [ ] The terms-of-trade spine threads the whole page (driven by `scrollY`, not GSAP): climbs at open, sags through trap, redrawn upward in resolution.
- [ ] Prose is in the §3 voice — concrete objects, no banned tells.

**Scroll & content**
- [ ] All 11 sections present in order; prose accurate to §11 and only §11; numbers count up in-view.
- [ ] The two pinned beats (Prebisch-Singer scissor, 143-dot grid with 95 flipped) scrub reversibly, have text equivalents for every annotation, and carry NO scroll-snap.
- [ ] Scroll-snap exists at exactly two points (§7.6 handoff, §7.8 debrief). Pinned scrub and snap never coexist.
- [ ] Handoff interstitial snaps cleanly; game scroll-lock works on iOS (`position:fixed` body + `touch-action` + scrollY restore); "Return to story" restores scroll position.

**Game (genuinely playable, fun, and balanced)**
- [ ] Headline → decision in <5s; only 3 numbers ever hero-sized.
- [ ] Export's live projected payoff prints on the button and visibly decays each year.
- [ ] The scissor chart draws one eased segment/turn and tears open on a pure-export run.
- [ ] **The `simulate()` harness ships in the artifact, runs, and its printed table is pasted as a comment**; build>export crossover lands at year 5–6; PURE EXPORT ranks ≤ C; PURE BUILD ≈ B; OPTIMAL reaches A/S.
- [ ] Upkeep ($12/yr) is in the model; Treasury can actually reach 0 (DEBT CRISIS / Rank F is reachable).
- [ ] Bargaining ≥ 40 is reachable by ~turn 7 through skill alone (bloc + build), never RNG-gated; the §6.3 OPTIMAL run demonstrates it.
- [ ] "Demand Fairer Terms" gated at Bargaining ≥ 40 with the locked tooltip; Rank S separately requires Bargaining ≥ 60; UI makes both thresholds clear.
- [ ] Events draw after Year 3 (~55%), without replacement, via the seeded PRNG; `?seed=` param honored; news-ticker telegraphs the turn before.
- [ ] First-timer following on-screen hints reaches at least Rank C without instructions; Rank S requires ≥2 correct strategic timings; no seed makes Rank A unreachable.
- [ ] Juice per the §1 tiers: count-up tweens, delta chips, digit-flip year, shake on bad outcomes only, red pulse on dropping meters, saturation drain/restore on the background layer only. No confetti. Sound + haptics if P2 reached.
- [ ] Debrief dossier shows the VERDICT stamp, replays the line, names all six copy points, saves best score to `localStorage` (try/catch), offers Play Again (re-seed) + Return to story.

**Tech, a11y, responsive**
- [ ] Single self-contained `index.html`, vanilla JS only, deploys to Vercel as static, zero backend, works by opening the file. No stubs — features present are fully working (§1 tiers).
- [ ] `localStorage` fully try/catch-wrapped; failure never breaks the game.
- [ ] `prefers-reduced-motion` fully honored; all scroll-revealed content in DOM at load; screen-reader-linear; legible with JS off.
- [ ] WCAG AA contrast throughout, **including the most-bleached saturation state** (saturate filter touches background only — never data lines or text); `:focus-visible` rings; game keyboard-playable (keys 1–4 + Enter/Space advance); ≥44px touch targets.
- [ ] Solid at 360px; game fits within `100dvh` with no page scroll needed to reach controls; mobile HUD reflows with action cards in the thumb zone; charts legible full-bleed.
- [ ] 60fps target; only `transform`/`opacity` animated; no Lenis; GSAP only for the two pinned beats, wrapped in `gsap.matchMedia()`.

---

**Deliver the complete, ready-to-deploy single file (plus any tiny config Vercel needs). Fix the economy first — run the `simulate()` harness, paste its passing table, then build the shell around the proven game. Make it polished, accurate, and genuinely fun to play. Build it now.**
