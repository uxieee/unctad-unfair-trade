import { describe, it, expect } from 'vitest';
import { createInitialState, CONFIG, applyDrift, termsOfTrade, applyAction, ACTIONS } from './engine.js';

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
    expect(r.exportPrice).toBeLessThan(s.exportPrice);
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
