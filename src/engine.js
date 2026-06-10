export const CONFIG = {
  maxTurns: 8,
  startTreasury: 100,
  exportDecay: 0.93,
  importInflation: 1.05,
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

export function applyDrift(state) {
  const exposure = 1 - state.diversification / 100;
  const decay = CONFIG.exportDecay + (1 - CONFIG.exportDecay) * (1 - exposure);
  return {
    ...state,
    exportPrice: Math.round(state.exportPrice * decay),
    importPrice: Math.round(state.importPrice * CONFIG.importInflation),
  };
}
