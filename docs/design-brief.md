# DESIGN BRIEF — "Unfair Trade" / UN Trade and Development
### A scrollytelling experience on UNCTAD, development, and trade justice

---

## 1. Creative Concept & Tone

**The palette is the argument.** This experience makes the reader *feel* the injustice UNCTAD fights before it ever explains it. The whole page moves along one emotional axis: from **extraction** (cold, depleted, draining toward a bleached neutral) to **agency** (warm, saturated, alive). Exporting raw commodities visibly bleeds color and value out of the screen; diversifying and demanding fairer terms re-saturates it. Color, motion, and the embedded game all enact a single thesis — **declining terms of trade (Prebisch-Singer) keep commodity exporters poor; the escape is to add value and demand fairer terms.**

Tone: **award-winning editorial data-journalism** (NYT / The Pudding / Bloomberg Graphics) crossed with a **restrained indie game**. Authoritative but human, never corporate-UN. The rule that governs every decision: **restraint in the trap, release in the escape — every saturated pixel must be earned by good play.** No decoration that doesn't carry meaning.

One persistent device ties the whole scroll together: a **terms-of-trade line** — a thin commodity-price sparkline — that lives in the page and trends *downward* as you scroll the "trap" sections, then is redrawn *upward* in the resolution. It is the connective tissue from hero to conclusion.

---

## 2. Color System

Two opposing worlds, one bridging institutional accent. All chroma is meaningful: cold/bleached = the trap, warm/saturated = the escape, UN blue = the institution speaking.

**The Periphery (raw-commodity trap — cold, depleting)**
- `#0B1E2D` **Deep Atlantic** — primary ground / game table surface (near-black blue)
- `#16323F` **Slate Sea** — section fills, panels
- `#C9C6BE` **Bleached Clay** — the depleted neutral everything drains toward when you "export more"
- `#8A9BA8` **Cold Tin** — muted data lines, secondary labels

**The Core (value-added escape — warm, alive)**
- `#E8743B` **Terracotta** — THE hero accent (commodity-orange → forge warmth); primary CTAs, "Play again," diversification
- `#F2B705` **Brass** — gains, upticks, Treasury/GDP, "Join Bloc"
- `#0E8A6B` **Verdant** — diversification / manufacturing / growth, "Diversify"

**Institutional bridge**
- `#4B92DB` **UN Blue** — used *sparingly*, only when the institution enters: UNCTAD logo/voice, citations, the "Demand Fairer Terms" mechanic, the recovery/prescriptions sections, the honest-caveat section.

**Deterioration / alarm (single canonical value)**
- `#C24A3A` **Alarm Rust** — price shocks, terms-of-trade decline, the widening Prebisch-Singer gap, "STILL DEPENDENT" verdict. (This replaces the three competing reds proposed; use only this one.)

**Editorial paper (light scroll sections)**
- `#F4EFE6` **Parchment** — body background for reading beats (origins, prescriptions, conclusion)
- `#0B0E14` **Ink** — body text on parchment

**The saturation mechanic (signature):** the game stage carries a live `filter: saturate()` bound to score — full chroma at start, draining ~15% per bad "export" turn toward `#C9C6BE`, re-injecting on diversify/demand turns. The escape section is the most saturated, warmest frame in the entire scroll.

---

## 3. Typography

Three roles, three faces, all free and Google-Fonts-loadable. **Hard rule: Fraunces only for emotional/argument beats; Plex Mono only for machine/data; never mix faces within a single line.**

- **Display / headlines — Fraunces** (`opsz` high, `wght` 600, slight negative tracking ~-0.01em). Soft-serif editorial gravitas. Big scroll beats, years, pull-quotes ("Sell more. Earn less.").
- **Body / deck — Inter** at 1.65 line-height. All prose, captions, UI labels. Tabular figures on for any inline number (`font-variant-numeric: tabular-nums`).
- **Data / game HUD — IBM Plex Mono.** Treasury, terms-of-trade ratio, turn counter, diversification %, stat verdicts. **Tabular figures mandatory** so values don't jitter as they tick.

**Type scale (desktop, fluid via `clamp()`):**
- Hero display: `clamp(3rem, 7vw, 6.5rem)` Fraunces 600
- Section heading: `clamp(2rem, 4vw, 3.25rem)` Fraunces 600
- Subhead / deck: `clamp(1.25rem, 2vw, 1.6rem)` Inter 500
- Body: `clamp(1.125rem, 1.3vw, 1.25rem)` Inter 400 (min 18px — Zoom legibility)
- Data large (HUD numbers): `clamp(1.5rem, 2.5vw, 2.25rem)` Plex Mono 500
- Labels / mono caps: `0.8125rem` Plex Mono 500, `letter-spacing: 0.08em`, uppercase

Body measure capped at **680px**.

---

## 4. Layout & Grid

- **12-column desktop grid**, gutters 24px, max content width 1200px. Reading prose centered within a **680px measure**.
- **Data-viz and the game break the grid full-bleed** (100vw). The contrast between contained prose and full-bleed interactives is itself part of the rhythm.
- **Vertical rhythm:** generous 120px+ between sections. Sections breathe; never crowd.
- **The terms-of-trade spine:** a thin sticky sparkline anchored to the **left gutter on desktop**, **top edge on mobile**, persistent across the scroll and degrading as the story darkens. It doubles as a scroll-progress indicator, tinted to the active terms-of-trade value.
- **Mobile:** single column, full-bleed by default, game becomes thumb-first (action cards reachable in the bottom third).

---

## 5. Scroll Structure (hero → conclusion)

1. **Cold open** — Full-bleed `#0B1E2D` void. One Fraunces line: *"In 1964, the poor countries of the world asked one question: why does trade keep them poor?"* A slow-drifting cargo-ship silhouette; the terms-of-trade sparkline already trending faintly down. Hold, then the question shrinks into a dateline as you scroll.
2. **Birth of UNCTAD (1964, Geneva)** — Parchment. Duotone (`#0B1E2D` + `#C9C6BE`) Prebisch portrait fades in; the year **1964** set huge as a typographic anchor. Facts: UNCTAD I, Geneva; emerged from decolonization / North-South tensions; G77 formed here. First SG **Raúl Prebisch** (1964–69), structuralist / centre-periphery economist.
3. **What UNCTAD is** — Quiet fact beat: permanent UN intergovernmental body, **195 member states**, HQ Geneva, **three pillars** (research & analysis; consensus-building; technical cooperation). Quadrennial conferences. Stat numbers count up in Plex Mono.
4. **The thesis — Prebisch-Singer (pinned centerpiece)** — Full-bleed dark, *pinned*. Two lines draw on scroll: commodities (flat/sagging) vs. manufactures (rising); the widening gap fills with `#C24A3A` hatch. Narration: "your coffee buys fewer tractors each year." Ends on the deteriorating terms-of-trade reveal. Number ticks in Plex Mono.
5. **Commodity dependence today** — Dot grid: **95 of 143** developing economies (incl. >80% of LDCs) are commodity-dependent (State of Commodity Dependence 2025). 95 dots flip to `#C24A3A` on a scroll-scrubbed stagger; ticker counts `0 → 95`. Prescription previewed: diversify + add value.
6. **The handoff → GAME** — Full-viewport interstitial that breaks the editorial calm: *"Reading about it isn't the same as living it. Run a nation."* Single pulsing **▶ Play** affordance. This section uses `scroll-snap-align: start` so the presenter lands cleanly and classmates know to stop scrolling and start tapping.
7. **THE GAME — "Unfair Trade"** (full-bleed cockpit; see §7). Page scroll locks while playing.
8. **The debrief** — Scroll resumes; the same spine line shown two ways: **your run vs. the historical line**, tying play back to the data. The post-game verdict carries here.
9. **UNCTAD's real prescriptions** — Re-saturated, warm (Verdant + Terracotta). A scroll-revealed checklist that literally checks off the moves the winning player made: **diversify / add value; GSP (Generalized System of Preferences); NIEO (1974); the LDC category (1971, now 44); demand fairer terms.** Diversification bars grow upward; the spine line is redrawn *upward*.
10. **The honest limit** — Deliberately quieter, UN-blue, indented "editor's note" treatment, smaller type. Unlike the WTO, UNCTAD has **no binding or enforcement power**; its influence is **analytical and advocacy-based.** Restraint reads as integrity. Don't oversell.
11. **Close (present tense)** — **UNCTAD16, Geneva, Oct 2025 ("Geneva Consensus")**; current SG **Rebeca Grynspan** (since 2021); 195 members; rebranded 2024 as **"UN Trade and Development"** (acronym retained). The warmest, most resolved frame. Quiet credit line.

---

## 6. Motion & Interaction

**Engine:** native scroll + `IntersectionObserver` as the base (buttery on trackpads, touch, and Zoom; no scroll-jacking). Add **lightweight GSAP ScrollTrigger only for the two pinned data beats** (§5.4 Prebisch-Singer, §5.5 dot grid) where scrubbing must be reversible and presenter-controllable. Do not pull in Lenis/heavy smooth-scroll — keep the artifact self-contained and dependable.

- **Global easing:** reveals `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out, confident, no bounce); state changes `cubic-bezier(0.65, 0, 0.35, 1)`.
- **Reveal vocabulary:** opacity + **8–24px translateY only**. Never zoom, spin, or the 80px "everything floats up" cliché (the AI-website tell). Stagger siblings ~60ms.
- **Number tickers:** one shared count-up util, runs only when in-view, 1.2s expo-out, tabular figures. Every stat (195, 44, 95, years, game values) flows through it.
- **The spine line** climbs hopefully at the open, then sags downward as you scroll the trap — dragging the eye down with the periphery's fortunes.
- **Performance guardrail:** animate only `transform` / `opacity`; `will-change` sparingly; target 60fps on a mid laptop screen-sharing. Zoom compression eats sub-pixel drift — favor crisp, decisive moves.

**Reduced motion (non-negotiable):** wrap all motion in `prefers-reduced-motion: reduce` guards (and `gsap.matchMedia()` for the pinned beats). Collapse to instant opacity; tickers snap to final; pinned charts render in final state. **All scroll-revealed content is present in the DOM at load** — fully legible and screen-reader-linear if JS or motion fails. Graded content must never depend on motion.

---

## 7. Game UI Treatment — "Unfair Trade"

**The handoff transforms the page, it doesn't embed a widget.** On entry the editorial column slides away and the viewport seats into a dark **"war-room cockpit"**: ground `#0B1E2D`, a faint topographic/hex grid at ~4% opacity, a subtle scanline vignette. HUD chrome drops in from the edges over ~600ms (corners draw first, then panels fill). On exit, the cockpit recedes and parchment returns. The contrast *is* the juice.

**Stage:** a tactile **ledger-meets-board** — commodities rendered as physical **cargo crates/tiles** with subtle bevels and grain, not flat icons. Panel surface `#16323F`, stroke `#2A3038`, primary text `#E8E4DA`.

**HUD (IBM Plex Mono, tabular):**
- Top: nation name + **turn counter as a segmented pip row** `TURN 3 / 8` (not a bare number).
- Left rail: **three vertical capsule meters** ("tanks") — **Treasury/GDP** (Brass `#F2B705`), **Diversification %** (Verdant `#0E8A6B`, made to feel rare and precious), **Dependence** (Alarm Rust `#C24A3A`).
- Right: the **live Terms-of-Trade line chart** — the star metric and the teaching weapon — drawing one new segment per turn. Healthy = teal/Verdant; collapsing = it visibly bleeds toward `#C24A3A`. Keep exporting and the player *watches* the thesis happen.
- Bottom: the **action deck.**

**Four actions as tactile cards** (icon + one-line cost/effect preview on hover + faint risk/reward microcopy), color-coded to their outcome world:
- **Export More** — bleached/cold (`#C9C6BE`). The seductive trap: cheapest, biggest *immediate* Brass bump with a satisfying coin-burst — then quietly worsens terms of trade and **drains the stage's saturation meter.** Reward fires *before* the consequence so the trap closes on the player.
- **Diversify** — Verdant. Slower payoff: a manufacturing bar grows with an elastic settle; the terms-of-trade line flattens, then tilts up. Delayed gratification, animated.
- **Join Bloc** — Brass. Regional bloc; steadies prices, modest shared gains.
- **Demand Fairer Terms at UNCTAD** — UN Blue `#4B92DB`. A brief flash-to-white nudges the line up a notch — but a small **"non-binding"** tag flickers in, honoring the real limitation.

**Game-feel specifics** — every action resolves with: (1) 120ms card press-down + spring-back; (2) count-up tween on affected stats (never hard-cut; year advances with a mechanical digit-flip); (3) a floating delta chip `+$2.4B` that rises and fades; (4) a 2–3px screen-shake **only on bad outcomes / price shocks**; (5) a red pulse on any meter that drops. **Confetti is banned** — wins read as the world **re-saturating + a warm bloom**; losing reads as a **vignette closing in and chroma draining to `#C9C6BE`.**

**Sound (Web Audio, mute toggle, default on but quiet):** export = hollow low tone; diversify = bright rising chime; shocks = a short mechanical tick. Reward the right play sonically. **Mobile haptics:** `navigator.vibrate(8)` on tap.

**Random shock events** (the replayability engine): a slim toast slides from the top — *"⚠ COPPER PRICES CRASH 18%"* — and the chart goes red live. Shocks re-seed each playthrough.

**Debrief / game-over card** — the emotional payoff, styled as an **UNCTAD policy dossier** (Plex Mono header, ratio verdict): a **VERDICT stamp** — *STILL DEPENDENT* in `#C24A3A` or *DIVERSIFIED ECONOMY* in Verdant — your terms-of-trade line replayed as a hero animation, and a single grounding stat: *"You exported raw goods 6 turns. Real-world result: 95 of 143 developing economies remain commodity-dependent."* One Terracotta **"Play Again"** (re-seeds shocks) + a **"Return to story ↓"** that re-enables scroll and auto-advances. Losing must feel **meaningful, not punishing.** Winnable with smart play (diversify + demand early), punishing if you only export.

**Balance note:** "export only" should be unwinnable across 8 turns; a mix weighted toward Diversify + Demand Fairer Terms wins. Make the optimal path mirror UNCTAD's real prescription.

---

## 8. Accessibility & Responsive (desktop-first, mobile-solid)

- **Body min 18px, line-height ≥1.6.** All scroll-revealed content in the DOM at load (legible without JS/motion; screen-reader linear).
- Every annotation the line chart shows **also exists as visible text** — never color- or motion-only.
- **Game buttons ≥44px touch targets**, `:focus-visible` rings everywhere, and **keyboard-playable: number keys 1–4 map to the four moves** so the presenter can demo without a mouse.
- **The game seam (critical):** while playing, **lock page scroll** (`overscroll-behavior: contain`, body lock) so finger-swipes drive the game, not the document — this prevents the classic "I scrolled past the game on my phone" failure on Zoom-from-phone. The end-screen's explicit **"Return to story ↓"** re-enables scroll; a small **"skip to results"** link respects the presenter's clock.
- **Color is never the sole signal:** verdicts carry text labels and icons alongside hue.
- **Mobile layout:** single column; spine line moves to the top edge; game HUD reflows to a stacked layout with action cards in the thumb zone; charts stay full-bleed and legible. Test at 360px width.
- **Contrast:** all text meets WCAG AA against its background (verify Bleached Clay and Cold Tin on dark — bump to `#E8E4DA` for body-size text if needed).

---

## 9. Signature "Wow" Moments

1. **The saturation drain.** The whole game viewport literally loses chroma as you export and re-saturates as you diversify — the lesson is felt in your peripheral vision, not read.
2. **The descending spine.** One sparkline threads the entire page, sagging as you scroll the trap and redrawn triumphantly upward in the resolution — a single line that carries the whole argument.
3. **The pinned Prebisch-Singer reveal.** Two lines diverge on scroll, the widening gap bleeding rust — the moment the abstract thesis becomes visceral.
4. **The cockpit handoff.** The page mechanically transforms from editorial calm into a war-room, then recedes — a clean "you are now playing / now back to the story" gear-shift.
5. **The dossier verdict.** A stamped UNCTAD-style trade report that ties *your* choices to the real-world 95-of-143 statistic — closing the loop between play and reality.

---

## 10. Pitfalls to Avoid

- **The generic-AI look, above all:** no SaaS/purple-blue gradients, no glassmorphism, no neon-on-black "dashboard" cliché, no drop-shadow soup, no emoji flags. No zoom/spin reveals or 80px float-ups.
- **No confetti, ever.** Wins re-saturate and bloom; they don't throw a party.
- **Don't decorate the lesson** — if an effect doesn't carry meaning (color = argument), cut it. Restraint in the trap; release only when earned.
- **Don't let chroma leak.** The trap sections must stay genuinely cold/bleached so the escape's warmth lands. Saturated pixels are earned by good play, never given.
- **Don't oversell UNCTAD.** The honest-limit section (no enforcement power) must stay quiet and credible — balance reads as integrity.
- **Don't break the scroll on mobile.** The game scroll-lock + explicit return is mandatory; a classmate on a phone must never get stuck or scroll past the game.
- **Don't mix type roles** within a line (Fraunces = argument, Plex Mono = data, Inter = body).
- **Don't depend on motion for meaning** — every graded fact survives `prefers-reduced-motion` and JS-off.
- **Don't invent facts.** Use only the verified UNCTAD content; the game's numbers are illustrative and labeled as a simulation, not real data.
