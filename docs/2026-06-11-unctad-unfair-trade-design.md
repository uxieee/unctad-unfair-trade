# Unfair Trade — A UNCTAD Simulation (Design Spec)

**Date:** 2026-06-11
**Course:** Contemporary Global, International and Regional Organizations
**Report subject:** United Nations Conference on Trade and Development (UNCTAD) — Development, Trade, and Equity
**Author:** Xander Roque

## 1. Purpose

Report on UNCTAD in an original, memorable way by letting the audience *feel*
the unequal trade relations UNCTAD exists to fight, rather than only hearing
about them. Delivered as a playable browser simulation plus a formal written
report.

## 2. Deliverables

1. **The game** — "Unfair Trade," a solo browser simulation, hosted on Vercel
   (GitHub-connected, auto-deploy).
2. **The written report** — a formal, graded **Word (.docx)** document on
   UNCTAD, written in the author's academic voice. This is the deliverable the
   instructor grades.

There is **no** separate audience worksheet. The game carries the interactive
lesson; the .docx is the academic substance.

## 3. Presentation context

- Delivered in a **Zoom meeting**, not in a physical classroom.
- Presenter **screen-shares** their own playthrough as the shared focal point.
- The play link is **pasted into the Zoom chat**; attendees click and play their
  own solo copy on their own device.
- Debrief happens via **Zoom chat / reactions** (e.g. "drop a 💀 if your economy
  collapsed").
- Time slot: **~5–10 minutes** total.

### Run-of-show (~7 min)
1. **Hook (~45s)** — Title screen shared; pose the question "Why do some
   countries export tons of goods and still stay poor?" Paste link in chat.
2. **Play (~3 min)** — Attendees play one quick round; presenter plays the same
   on screen-share.
3. **Reveal (~2 min)** — The game's results screen does the teaching. Chat
   debrief on who collapsed.
4. **Land it (~1.5 min)** — Tie to the Prebisch-Singer thesis and UNCTAD's 1964
   founding; point to the full report.

## 4. The game

### Premise
The player is a developing nation. Each turn represents one year. The player
starts economically dependent on exporting **one commodity**.

### Core mechanic — declining terms of trade
Each turn, the player's **export prices drift downward** while **import prices
drift upward**. This models the **Prebisch-Singer thesis**, the intellectual
foundation of UNCTAD. A "just keep exporting" strategy slowly loses.

### Turn actions (choose ONE per turn)
- **Export more** — short-term cash, but keeps the nation commodity-dependent.
- **Diversify into manufacturing** — expensive and slow, but the only real
  escape from declining terms of trade.
- **Join a regional bloc** — improves trade terms / stability (mirrors regional
  cooperation).
- **Demand fairer terms at UNCTAD** — models real UNCTAD advocacy; nudges terms
  of trade in the player's favor.

### Length & ending
- Roughly **8 turns** per round (~2–3 min).
- **Results screen** shows the player's terms-of-trade line over the round
  (typically crashing), followed by a **teaching card**: the player just
  experienced declining terms of trade — the Prebisch-Singer thesis — which is
  why UNCTAD exists. Names the UNCTAD functions that map to the actions taken.

### Teaching goal
Most players who simply "export more" stagnate or collapse. The lesson is felt,
not lectured. The results screen guarantees the teaching lands even if the live
debrief is rushed.

## 5. Architecture

- **Static site** — plain HTML/CSS/JS (or a tiny Vite build). No backend, no
  database, no login. This is what makes solo play bulletproof off a shared
  link.
- **Separation of concerns** — game logic (state, economy model, turn
  resolution) kept independent of rendering, so shared multiplayer can be added
  later without rewriting the core.
- **Hosting** — GitHub repo → Vercel import → auto-deploy on push → stable URL.
- **Location** — self-contained in `unctad-unfair-trade/` per repo conventions.

### Responsive requirements
- **Desktop-first**: looks clean and readable when screen-shared from a laptop
  during Zoom (large text, high contrast, survives video compression).
- **Mobile is first-class**: fully playable and solid on phones for attendees
  who join Zoom from mobile. Not an afterthought.

## 6. The written report (.docx)

Formal Word document covering:
- UNCTAD overview and purpose.
- Founding and history (1964, Raúl Prebisch, the developing-world context).
- Mandate and core functions.
- How UNCTAD advocates for developing nations' interests.
- Analysis of unequal trade relations and global economic justice
  (terms of trade, commodity dependence, Prebisch-Singer thesis).
- A short section presenting the game as an original teaching method, plus a
  **future-work roadmap** (shared multiplayer).

Written in the author's academic voice.

## 7. Build order

1. Build the game (so it can be played and tested).
2. Deploy to Vercel via GitHub.
3. Write the .docx report (so it can reference the finished, live game).

## 8. Future work (out of scope for v1)

- **Shared multiplayer**: one live session, shared leaderboard, real-time
  competition. Requires a realtime backend. Explicitly deferred — solo static
  play ships first because it cannot break during a live Zoom call.

## 9. Out of scope

- Audience worksheet (not required).
- Accounts, persistence, analytics.
- Real-world live data feeds (the economy model is illustrative, not a data
  dashboard).
