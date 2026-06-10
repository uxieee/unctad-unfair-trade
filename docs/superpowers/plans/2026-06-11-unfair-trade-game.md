# Unfair Trade Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Unfair Trade," a solo browser simulation where the player runs a developing nation and experiences declining terms of trade (the Prebisch-Singer thesis), then deploy it to Vercel.

**Architecture:** Static Vite site. Pure, testable game logic in `src/engine.js` (no DOM) is separated from DOM rendering in `src/ui.js`; `src/main.js` wires them together. This separation keeps the economy model unit-testable and leaves room to add shared multiplayer later without rewriting the core.

**Tech Stack:** Vite (vanilla), Vitest (unit tests), plain HTML/CSS/JS. No backend.

---

## File Structure

- `package.json` — Vite + Vitest scripts and deps
- `.gitignore` — node_modules, dist
- `index.html` — single entry point, mounts `#app`
- `src/main.js` — bootstraps game, binds events, owns the run loop
- `src/engine.js` — pure game logic: constants, initial state, drift, actions, turn resolution, status. No DOM.
- `src/engine.test.js` — Vitest unit tests for engine
- `src/ui.js` — pure-ish render functions that take state and produce DOM
- `src/content.js` — UNCTAD teaching copy (action descriptions, results-card text)
- `src/styles.css` — responsive styling (desktop-first, mobile solid)

---

## Task 1: Scaffold Vite + Vitest project

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `index.html`
- Create: `src/main.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "unctad-unfair-trade",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules
dist
.DS_Store
```

- [ ] **Step 3: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Unfair Trade — A UNCTAD Simulation</title>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Create placeholder `src/main.js`**

```js
document.querySelector('#app').textContent = 'Unfair Trade — loading…';
```

- [ ] **Step 5: Create placeholder `src/styles.css`**

```css
:root { color-scheme: dark; }
body { margin: 0; font-family: system-ui, sans-serif; }
```

- [ ] **Step 6: Install and verify dev server boots**

Run: `npm install && npm run build`
Expected: install succeeds; `vite build` completes and writes `dist/` with no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore index.html src/main.js src/styles.css
git commit -m "chore: scaffold Vite + Vitest project"
```

---

## Task 2: Engine constants and initial state

**Files:**
- Create: `src/engine.js`
- Test: `src/engine.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { createInitialState, CONFIG } from './engine.js';

describe('createInitialState', () => {
  it('starts a commodity-dependent nation with healthy treasury', () => {
    const s = createInitialState();
    expect(s.turn).toBe(1);
    expect(s.maxTurns).toBe(CONFIG.maxTurns);
    expect(s.treasury).toBe(CONFIG.startTreasury);
    expect(s.exportPrice).toBe(100);
    expect(s.importPrice).toBe(100);
    expect(s.diversification).toBe(0);
    expect(s.status).toBe('playing');
    expect(s.history).toEqual([{ turn: 0, termsOfTrade: 100, treasury: CONFIG.startTreasury }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine.test.js`
Expected: FAIL — `createInitialState` not exported / undefined.

- [ ] **Step 3: Write minimal implementation**

```js
export const CONFIG = {
  maxTurns: 8,
  startTreasury: 100,
  exportDecay: 0.93,   // export prices drift down ~7%/yr
  importInflation: 1.05, // import prices drift up ~5%/yr
};

export function termsOfTrade(state) {
  return Math.round((state.exportPrice / state.importPrice) * 100);
}

export function createInitialState() {
  return {
    turn: 1,
    maxTurns: CONFIG.maxTurns,
    treasury: CONFIG.startTreasury,
    exportPrice: 100,
    importPrice: 100,
    diversification: 0,
    status: 'playing',
    log: [],
    history: [{ turn: 0, termsOfTrade: 100, treasury: CONFIG.startTreasury }],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine.js src/engine.test.js
git commit -m "feat(engine): initial state and config"
```

---

## Task 3: Terms of trade and yearly drift

**Files:**
- Modify: `src/engine.js`
- Test: `src/engine.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { applyDrift, termsOfTrade } from './engine.js';

describe('applyDrift (the unfair mechanic)', () => {
  it('lowers export price and raises import price, worsening terms of trade', () => {
    const s = createInitialState();
    const before = termsOfTrade(s);
    const after = applyDrift(s);
    expect(after.exportPrice).toBeLessThan(s.exportPrice);
    expect(after.importPrice).toBeGreaterThan(s.importPrice);
    expect(termsOfTrade(after)).toBeLessThan(before);
  });

  it('does not mutate the input state', () => {
    const s = createInitialState();
    applyDrift(s);
    expect(s.exportPrice).toBe(100);
  });

  it('diversification softens the export-price decay', () => {
    const dependent = { ...createInitialState(), diversification: 0 };
    const diversified = { ...createInitialState(), diversification: 80 };
    const dDep = applyDrift(dependent).exportPrice;
    const dDiv = applyDrift(diversified).exportPrice;
    expect(dDiv).toBeGreaterThan(dDep);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine.test.js`
Expected: FAIL — `applyDrift` undefined.

- [ ] **Step 3: Write minimal implementation (append to engine.js)**

```js
// Diversification (0-100) reduces exposure to commodity price decay.
export function applyDrift(state) {
  const exposure = 1 - state.diversification / 100;
  const decay = CONFIG.exportDecay + (1 - CONFIG.exportDecay) * (1 - exposure);
  return {
    ...state,
    exportPrice: Math.round(state.exportPrice * decay),
    importPrice: Math.round(state.importPrice * CONFIG.importInflation),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine.js src/engine.test.js
git commit -m "feat(engine): yearly terms-of-trade drift"
```

---

## Task 4: Action effects

**Files:**
- Modify: `src/engine.js`
- Test: `src/engine.test.js`

Actions: `export_more`, `diversify`, `join_bloc`, `demand_terms`.

- [ ] **Step 1: Write the failing test**

```js
import { applyAction, ACTIONS } from './engine.js';

describe('applyAction', () => {
  it('exposes the four UNCTAD-themed actions', () => {
    expect(ACTIONS.map(a => a.id)).toEqual(
      ['export_more', 'diversify', 'join_bloc', 'demand_terms']
    );
  });

  it('export_more adds the most cash this turn but deepens dependency', () => {
    const s = createInitialState();
    const r = applyAction(s, 'export_more');
    expect(r.treasury).toBeGreaterThan(s.treasury);
    expect(r.exportPrice).toBeLessThan(s.exportPrice); // extra decay next year
    expect(r.diversification).toBe(0);
  });

  it('diversify costs cash now but raises diversification', () => {
    const s = createInitialState();
    const r = applyAction(s, 'diversify');
    expect(r.diversification).toBeGreaterThan(s.diversification);
    expect(r.treasury).toBeLessThan(s.treasury);
  });

  it('demand_terms improves export prices (advocacy)', () => {
    const s = createInitialState();
    const r = applyAction(s, 'demand_terms');
    expect(r.exportPrice).toBeGreaterThan(s.exportPrice);
  });

  it('join_bloc lowers import prices (cooperation)', () => {
    const s = createInitialState();
    const r = applyAction(s, 'join_bloc');
    expect(r.importPrice).toBeLessThan(s.importPrice);
  });

  it('throws on an unknown action', () => {
    expect(() => applyAction(createInitialState(), 'nope')).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine.test.js`
Expected: FAIL — `applyAction` / `ACTIONS` undefined.

- [ ] **Step 3: Write minimal implementation (append to engine.js)**

```js
export const ACTIONS = [
  { id: 'export_more', label: 'Export more commodities' },
  { id: 'diversify', label: 'Diversify into manufacturing' },
  { id: 'join_bloc', label: 'Join a regional bloc' },
  { id: 'demand_terms', label: 'Demand fairer terms at UNCTAD' },
];

// Base income for a turn given current prices/diversification.
function baseIncome(state) {
  const commodity = state.exportPrice * (1 - state.diversification / 100);
  const manufacturing = state.diversification * 1.2;
  const importCost = state.importPrice * 0.8;
  return Math.round(commodity + manufacturing - importCost);
}

export function applyAction(state, actionId) {
  if (!ACTIONS.some(a => a.id === actionId)) {
    throw new Error(`Unknown action: ${actionId}`);
  }
  let next = { ...state };
  const income = baseIncome(state);

  switch (actionId) {
    case 'export_more':
      next.treasury += Math.round(income + state.exportPrice * 0.5);
      next.exportPrice = Math.round(next.exportPrice * 0.95); // deeper dependency
      break;
    case 'diversify':
      next.treasury += income - 40;
      next.diversification = Math.min(100, next.diversification + 15);
      break;
    case 'join_bloc':
      next.treasury += income;
      next.importPrice = Math.round(next.importPrice * 0.95);
      break;
    case 'demand_terms':
      next.treasury += income;
      next.exportPrice = Math.round(next.exportPrice * 1.08);
      break;
  }
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine.js src/engine.test.js
git commit -m "feat(engine): UNCTAD-themed action effects"
```

---

## Task 5: Turn resolution, history, and end status

**Files:**
- Modify: `src/engine.js`
- Test: `src/engine.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { takeTurn, finalOutcome } from './engine.js';

describe('takeTurn', () => {
  it('applies action then drift, advances the turn, and records history', () => {
    const s = createInitialState();
    const r = takeTurn(s, 'export_more');
    expect(r.turn).toBe(2);
    expect(r.history.length).toBe(2);
    expect(r.history.at(-1)).toMatchObject({ turn: 1 });
  });

  it('marks status collapsed when treasury goes negative', () => {
    let s = createInitialState();
    s = { ...s, treasury: -5 };
    const r = takeTurn(s, 'diversify'); // diversify costs 40
    expect(r.status).toBe('collapsed');
  });

  it('ends the game after maxTurns', () => {
    let s = createInitialState();
    for (let i = 0; i < CONFIG.maxTurns; i++) {
      s = takeTurn(s, 'export_more');
    }
    expect(s.status).not.toBe('playing');
  });
});

describe('finalOutcome', () => {
  it('thriving requires diversification and growth', () => {
    const s = { ...createInitialState(), diversification: 60, treasury: 200 };
    expect(finalOutcome(s)).toBe('thriving');
  });
  it('a commodity-dependent survivor is stagnant', () => {
    const s = { ...createInitialState(), diversification: 0, treasury: 50 };
    expect(finalOutcome(s)).toBe('stagnant');
  });
  it('negative treasury is collapsed', () => {
    const s = { ...createInitialState(), treasury: -1 };
    expect(finalOutcome(s)).toBe('collapsed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine.test.js`
Expected: FAIL — `takeTurn` / `finalOutcome` undefined.

- [ ] **Step 3: Write minimal implementation (append to engine.js)**

```js
export function finalOutcome(state) {
  if (state.treasury < 0) return 'collapsed';
  if (state.diversification >= 50 && state.treasury > CONFIG.startTreasury) {
    return 'thriving';
  }
  return 'stagnant';
}

export function takeTurn(state, actionId) {
  if (state.status !== 'playing') return state;
  const acted = applyAction(state, actionId);
  const drifted = applyDrift(acted);
  const completedTurn = state.turn;
  const next = {
    ...drifted,
    turn: state.turn + 1,
    history: [
      ...state.history,
      { turn: completedTurn, termsOfTrade: termsOfTrade(drifted), treasury: drifted.treasury },
    ],
  };

  if (next.treasury < 0) {
    next.status = 'collapsed';
  } else if (next.turn > CONFIG.maxTurns) {
    next.status = finalOutcome(next);
  }
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine.test.js`
Expected: PASS (all engine tests green).

- [ ] **Step 5: Commit**

```bash
git add src/engine.js src/engine.test.js
git commit -m "feat(engine): turn resolution, history, end status"
```

---

## Task 6: UNCTAD teaching content

**Files:**
- Create: `src/content.js`

- [ ] **Step 1: Create `src/content.js`**

```js
// Plain-language descriptions tying each game action to real UNCTAD themes.
export const ACTION_HELP = {
  export_more:
    'Sell more of your single commodity. Fast cash now — but prices keep falling and you stay dependent.',
  diversify:
    'Invest in manufacturing. Costly and slow, but the only real escape from falling commodity prices.',
  join_bloc:
    'Cooperate with neighbouring economies to lower the cost of imports and gain bargaining power.',
  demand_terms:
    'Press for fairer trade terms — exactly what UNCTAD was created to do for developing nations.',
};

export const OUTCOME_CARD = {
  thriving: {
    title: 'You broke the cycle.',
    body: 'By diversifying and demanding fairer terms, you escaped commodity dependence — the path UNCTAD argues developing nations need support to take.',
  },
  stagnant: {
    title: 'You survived — but stayed dependent.',
    body: 'Your terms of trade kept slipping. Exporting raw commodities alone could not get you ahead. This is the trap UNCTAD studies.',
  },
  collapsed: {
    title: 'Your economy collapsed.',
    body: 'Falling export prices and rising import costs drained your treasury. This is declining terms of trade in action.',
  },
};

export const THESIS = {
  title: 'Why this happened: the Prebisch-Singer thesis',
  body: 'Countries that export raw commodities and import manufactured goods tend to see their terms of trade decline over time — they must export ever more to buy the same imports. Raúl Prebisch, UNCTAD’s first Secretary-General, built the case for this in 1964. Confronting this inequality is UNCTAD’s founding purpose.',
};
```

- [ ] **Step 2: Verify it imports without error**

Run: `node --input-type=module -e "import('./src/content.js').then(m => console.log(Object.keys(m)))"`
Expected: prints `[ 'ACTION_HELP', 'OUTCOME_CARD', 'THESIS' ]`.

- [ ] **Step 3: Commit**

```bash
git add src/content.js
git commit -m "content: UNCTAD teaching copy"
```

---

## Task 7: UI render functions

**Files:**
- Create: `src/ui.js`

These are pure functions that build DOM from state. Verified visually in Task 8/9.

- [ ] **Step 1: Create `src/ui.js`**

```js
import { ACTIONS, termsOfTrade, CONFIG } from './engine.js';
import { ACTION_HELP } from './content.js';

export function renderStats(state) {
  const tot = termsOfTrade(state);
  const el = document.createElement('div');
  el.className = 'stats';
  el.innerHTML = `
    <div class="stat"><span>Year</span><strong>${state.turn} / ${state.maxTurns}</strong></div>
    <div class="stat"><span>Treasury</span><strong>${state.treasury}</strong></div>
    <div class="stat"><span>Terms of Trade</span><strong>${tot}</strong></div>
    <div class="stat"><span>Diversification</span><strong>${state.diversification}%</strong></div>
  `;
  return el;
}

export function renderActions(onChoose) {
  const wrap = document.createElement('div');
  wrap.className = 'actions';
  for (const action of ACTIONS) {
    const btn = document.createElement('button');
    btn.className = 'action';
    btn.innerHTML = `<strong>${action.label}</strong><span>${ACTION_HELP[action.id]}</span>`;
    btn.addEventListener('click', () => onChoose(action.id));
    wrap.appendChild(btn);
  }
  return wrap;
}

// Simple inline-SVG line chart of terms of trade over history.
export function renderChart(history) {
  const w = 320, h = 120, pad = 8;
  const pts = history.map((p, i) => {
    const x = pad + (i / Math.max(1, history.length - 1)) * (w - pad * 2);
    const y = h - pad - (p.termsOfTrade / 120) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const el = document.createElement('div');
  el.className = 'chart';
  el.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Terms of trade over time">
      <polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>
    <p class="chart-label">Terms of trade over time (lower = worse)</p>
  `;
  return el;
}
```

- [ ] **Step 2: Verify build still passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui.js
git commit -m "feat(ui): stat, action, and chart render functions"
```

---

## Task 8: Wire the game loop in main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Replace `src/main.js` with the run loop**

```js
import { createInitialState, takeTurn } from './engine.js';
import { renderStats, renderActions, renderChart } from './ui.js';

const app = document.querySelector('#app');
let state = createInitialState();

function render() {
  app.innerHTML = '';
  const shell = document.createElement('main');
  shell.className = 'game';

  if (state.status !== 'playing') {
    // Temporary end screen; replaced by the teaching results screen in Task 9.
    const end = document.createElement('section');
    end.className = 'results';
    end.innerHTML = `<h2>Game over: ${state.status}</h2>`;
    const again = document.createElement('button');
    again.className = 'action';
    again.textContent = 'Play again';
    again.addEventListener('click', restart);
    end.appendChild(again);
    shell.appendChild(end);
    app.appendChild(shell);
    return;
  }

  const header = document.createElement('header');
  header.innerHTML = `<h1>Unfair Trade</h1><p>You run a developing nation. Survive 8 years.</p>`;
  shell.appendChild(header);
  shell.appendChild(renderStats(state));
  shell.appendChild(renderChart(state.history));
  shell.appendChild(renderActions(choose));
  app.appendChild(shell);
}

function choose(actionId) {
  state = takeTurn(state, actionId);
  render();
}

function restart() {
  state = createInitialState();
  render();
}

render();
```

- [ ] **Step 2: Run dev server and play through manually**

Run: `npm run dev`
Expected: open the printed localhost URL. You can pick actions, stats update each year, the chart grows, and after 8 years (or on collapse) a results screen appears. The dev server stays running; stop it with Ctrl-C when done.

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: wire game loop"
```

---

## Task 9: Results / teaching screen

**Files:**
- Create: `src/results.js`

- [ ] **Step 1: Create `src/results.js`**

```js
import { renderChart } from './ui.js';
import { OUTCOME_CARD, THESIS } from './content.js';

export function renderResults(state, onRestart) {
  const card = OUTCOME_CARD[state.status] ?? OUTCOME_CARD.stagnant;
  const el = document.createElement('section');
  el.className = `results results--${state.status}`;
  el.innerHTML = `
    <h2>${card.title}</h2>
    <p class="results-body">${card.body}</p>
  `;
  el.appendChild(renderChart(state.history));

  const thesis = document.createElement('div');
  thesis.className = 'thesis';
  thesis.innerHTML = `<h3>${THESIS.title}</h3><p>${THESIS.body}</p>`;
  el.appendChild(thesis);

  const again = document.createElement('button');
  again.className = 'action restart';
  again.textContent = 'Play again';
  again.addEventListener('click', onRestart);
  el.appendChild(again);
  return el;
}
```

- [ ] **Step 2: Wire `renderResults` into `src/main.js`**

Add the import at the top of `src/main.js`:

```js
import { renderResults } from './results.js';
```

Then replace the temporary end-screen block inside `render()` (the `if (state.status !== 'playing') { ... }` body) with:

```js
  if (state.status !== 'playing') {
    shell.appendChild(renderResults(state, restart));
    app.appendChild(shell);
    return;
  }
```

- [ ] **Step 3: Verify each ending renders**

Run: `npm run dev`
Expected: Play a "just export more" run → collapse/stagnant card with the Prebisch-Singer explanation. Play a diversify-heavy run → thriving card. "Play again" resets.

- [ ] **Step 4: Commit**

```bash
git add src/results.js src/main.js
git commit -m "feat: results screen with UNCTAD teaching card"
```

---

## Task 10: Responsive styling (desktop-first, mobile solid)

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace `src/styles.css`**

```css
:root {
  color-scheme: dark;
  --bg: #0d1b2a;
  --panel: #14283d;
  --ink: #e8eef5;
  --muted: #9fb3c8;
  --accent: #4cc9a4;
  --danger: #e76f6f;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.4;
}
.game { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
header h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 0 0 4px; }
header p { color: var(--muted); margin: 0 0 16px; }

.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.stat {
  background: var(--panel); border-radius: 10px; padding: 10px;
  display: flex; flex-direction: column; gap: 2px;
}
.stat span { color: var(--muted); font-size: .8rem; }
.stat strong { font-size: clamp(1.1rem, 3vw, 1.5rem); }

.chart { background: var(--panel); border-radius: 10px; padding: 12px; margin: 16px 0; color: var(--accent); }
.chart svg { width: 100%; height: auto; display: block; }
.chart-label { color: var(--muted); font-size: .8rem; margin: 6px 0 0; }

.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.action {
  text-align: left; background: var(--panel); color: var(--ink);
  border: 1px solid #24405c; border-radius: 12px; padding: 14px;
  cursor: pointer; display: flex; flex-direction: column; gap: 6px;
  font-size: 1rem; transition: border-color .15s, transform .05s;
}
.action:hover { border-color: var(--accent); }
.action:active { transform: scale(.99); }
.action span { color: var(--muted); font-size: .85rem; }

.results { background: var(--panel); border-radius: 14px; padding: 24px; margin-top: 8px; }
.results h2 { font-size: clamp(1.5rem, 4vw, 2.2rem); margin: 0 0 8px; }
.results--collapsed h2 { color: var(--danger); }
.results--thriving h2 { color: var(--accent); }
.results-body { color: var(--ink); }
.thesis { border-top: 1px solid #24405c; margin-top: 16px; padding-top: 16px; }
.thesis h3 { margin: 0 0 6px; }
.thesis p { color: var(--muted); margin: 0; }
.restart { margin-top: 18px; align-items: center; text-align: center; }

@media (max-width: 540px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .actions { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Verify desktop and mobile layouts**

Run: `npm run dev`
Expected: On a wide window, stats show 4 across and actions 2×2. Resize narrow (or device toolbar) → stats go 2×2, actions stack one per row, text stays readable. No horizontal scroll.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: responsive desktop-first layout, solid on mobile"
```

---

## Task 11: Full test + build gate

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all engine tests PASS.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: `dist/` produced, no errors/warnings that fail the build.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "test: green suite and clean production build" || echo "nothing to commit"
```

---

## Task 12: Deploy to Vercel via GitHub

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# Unfair Trade — A UNCTAD Simulation

A short browser game where you run a developing nation and experience declining
terms of trade — the Prebisch-Singer thesis that underpins UNCTAD's mission.

## Develop
- `npm install`
- `npm run dev`
- `npm test`
- `npm run build`

Static Vite site. Deploys to Vercel with zero config (framework preset: Vite).
```

- [ ] **Step 2: Commit and push to GitHub**

Create a GitHub repo (via `gh repo create unctad-unfair-trade --public --source . --push`, or the web UI) and push `main`.
Expected: repo exists with all commits.

- [ ] **Step 3: Import to Vercel**

In Vercel: New Project → import the GitHub repo → it auto-detects **Vite** → Deploy.
Expected: a live URL (e.g. `https://unctad-unfair-trade.vercel.app`). Open it, play a full round on desktop and on a phone.

- [ ] **Step 4: Confirm auto-deploy**

Push a trivial commit; confirm Vercel rebuilds automatically.
Expected: new deployment triggered on push.

---

## Notes for the writer (report task, separate)

Once the game is live, the `.docx` report references it as the original teaching
method and lists shared multiplayer as future work. The report is a separate
work item, written in the author's academic voice, and is not part of this plan.
