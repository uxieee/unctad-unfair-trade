import { createInitialState, takeTurn } from './engine.js';
import { renderStats, renderActions, renderChart } from './ui.js';
import { renderResults } from './results.js';

const app = document.querySelector('#app');
let state = createInitialState();

function render() {
  app.innerHTML = '';
  const shell = document.createElement('main');
  shell.className = 'game';

  if (state.status !== 'playing') {
    shell.appendChild(renderResults(state, restart));
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
