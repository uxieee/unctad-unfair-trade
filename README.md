# Unfair Trade — A UNCTAD Simulation

A short browser game where you run a developing nation and experience **declining
terms of trade** — the Prebisch-Singer thesis that underpins the founding mission
of the United Nations Conference on Trade and Development (UNCTAD).

You export one commodity. Each year its price drifts down while your import
prices drift up. Just exporting more keeps you dependent and poor. The only real
escape is to **diversify into manufacturing** and **demand fairer trade terms** —
the path UNCTAD argues developing nations need support to take.

Built as an original way to present a class report on UNCTAD (Development, Trade,
and Equity): the audience plays it on their own device, then sees the economic
theory behind what just happened.

## How it's used
- Delivered over Zoom: the play link is pasted in chat; the presenter
  screen-shares a playthrough.
- Solo play, no backend, no login — a static site that can't break mid-call.
- Desktop-first and fully playable on mobile.

## Develop
```bash
npm install
npm run dev      # local dev server
npm test         # engine unit + balance tests (Vitest)
npm run build    # production build to dist/
```

## Tech
Plain HTML/CSS/JS bundled with Vite. Game logic (`src/engine.js`) is pure and
unit-tested, kept separate from rendering (`src/ui.js`, `src/results.js`) so a
shared-multiplayer mode can be added later without rewriting the core.

Deploys to Vercel with zero config (framework preset: **Vite**).

## Roadmap
- Shared multiplayer: one live session with a class leaderboard (requires a
  realtime backend; deliberately deferred so solo play ships first).
