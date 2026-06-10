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
