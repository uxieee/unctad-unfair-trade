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
