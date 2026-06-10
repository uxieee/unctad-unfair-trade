import { describe, it, expect } from 'vitest';
import { createInitialState, CONFIG } from './engine.js';

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
