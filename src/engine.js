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

export const ACTIONS = [
  { id: 'export_more', label: 'Export more commodities' },
  { id: 'diversify', label: 'Diversify into manufacturing' },
  { id: 'join_bloc', label: 'Join a regional bloc' },
  { id: 'demand_terms', label: 'Demand fairer terms at UNCTAD' },
];

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
      next.exportPrice = Math.round(next.exportPrice * 0.95);
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
