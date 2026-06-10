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
