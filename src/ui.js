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

export function renderChart(history) {
  const w = 320, h = 120, pad = 8;
  // Scale the Y axis to the data so a strong advocacy run (terms of trade > 120)
  // never clips above the top edge.
  const maxToT = Math.max(120, ...history.map(p => p.termsOfTrade));
  const coords = history.map((p, i) => {
    const x = pad + (i / Math.max(1, history.length - 1)) * (w - pad * 2);
    const y = h - pad - (p.termsOfTrade / maxToT) * (h - pad * 2);
    return { x, y };
  });
  const pts = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const last = coords[coords.length - 1];
  const el = document.createElement('div');
  el.className = 'chart';
  el.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Terms of trade over time">
      <title>Terms of trade over time</title>
      <polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3" fill="currentColor"/>
    </svg>
    <p class="chart-label">Terms of trade over time (lower = worse)</p>
  `;
  return el;
}
