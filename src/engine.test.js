import { describe, it, expect } from 'vitest';
import { createInitialState, CONFIG, applyDrift, termsOfTrade } from './engine.js';

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
