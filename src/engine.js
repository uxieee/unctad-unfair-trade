export const CONFIG = {
  maxTurns: 8,
  startTreasury: 100,
  exportDecay: 0.93,        // commodity export prices drift down ~7%/yr
  importInflation: 1.05,    // import prices drift up ~5%/yr
  importCostFactor: 0.8,    // share of import price paid as cost each year
  manufacturingValue: 2.2,  // income per point of diversification (the payoff)
  exportBurst: 0.3,         // extra commodity cash from "export more"
  dependencyPenalty: 0.95,  // "export more" deepens commodity dependence
  diversifyCost: 25,        // up-front cost of diversifying
  diversifyStep: 15,        // diversification gained per "diversify"
  blocDiscount: 0.93,       // import-price cut from joining a regional bloc
  demandBoost: 1.1,         // export-price gain from demanding fairer terms
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
  const manufacturing = state.diversification * CONFIG.manufacturingValue;
  const importCost = state.importPrice * CONFIG.importCostFactor;
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
      next.treasury += Math.round(income + state.exportPrice * CONFIG.exportBurst);
      next.exportPrice = Math.round(next.exportPrice * CONFIG.dependencyPenalty);
      break;
    case 'diversify':
      next.treasury += income - CONFIG.diversifyCost;
      next.diversification = Math.min(100, next.diversification + CONFIG.diversifyStep);
      break;
    case 'join_bloc':
      next.treasury += income;
      next.importPrice = Math.round(next.importPrice * CONFIG.blocDiscount);
      break;
    case 'demand_terms':
      next.treasury += income;
      next.exportPrice = Math.round(next.exportPrice * CONFIG.demandBoost);
      break;
  }
  return next;
}

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
