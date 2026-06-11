# Unfair Trade — A report on UNCTAD

A single-page **scrollytelling report** on UNCTAD (UN Trade and Development) with an
embedded, playable economic simulation. You run a developing nation and *feel*
**declining terms of trade** — the Prebisch-Singer thesis that underpins UNCTAD's
founding mission — then read how UNCTAD has fought that fight since 1964.

Built as an original way to present a class report on UNCTAD (Development, Trade,
and Equity): the audience scrolls the story and plays the simulation on their own
device, then sees the economic theory behind what just happened.

## Structure (static, zero build)

```
index.html        # the scrollytelling page + game markup
css/styles.css    # full design system + game UI
js/sim.js         # pure economy model + balance harness (run: node js/sim.js)
js/game.js        # game controller (HUD, turns, events, debrief)
js/scroll.js      # scrollytelling: reveals, pinned beats, the terms-of-trade spine
favicon.svg
docs/             # design brief, game-mechanics spec, build prompt, verified facts
```

Plain HTML/CSS/vanilla JS — no framework, no build step. Loads Google Fonts and
GSAP (for two pinned scroll beats) from CDNs. Deploys to **Vercel** as a static
site with zero config.

## Run locally
```bash
# any static server, e.g.
python3 -m http.server 8000      # then open http://localhost:8000
# verify the game economy is balanced:
node js/sim.js                   # prints the balance harness table
```

## How it's used
- Delivered over Zoom: link shared in chat; presenter screen-shares and scrolls;
  classmates play the simulation on their own phones/laptops.
- Desktop-first and fully solid on mobile.

## Provenance
Design direction and game mechanics were produced by an expert-panel workflow
(see `docs/design-brief.md`, `docs/game-mechanics.md`), compiled into a build
prompt (`docs/build-prompt.md`), and implemented via claude.ai/design. Content is
sourced from `docs/unctad-facts-verified.md`. The game's numbers are an
illustrative simulation, not real UNCTAD data.
