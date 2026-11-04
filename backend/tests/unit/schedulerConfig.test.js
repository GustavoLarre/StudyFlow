import { describe, it, expect } from '@jest/globals';
import { SCHEDULER } from '../../src/config/scheduler.js';

describe('Unidade - config/scheduler', () => {
  it('Passos de aprendizado em minutos', () => {
    expect(SCHEDULER.learningStepsMinutes).toEqual([1, 10]);
    expect(SCHEDULER.relearningStepsMinutes).toEqual([10]);
  });

  it('Intervalos de graduação em dias', () => {
    expect(SCHEDULER.graduatingIntervalDays).toBe(1);
    expect(SCHEDULER.easyIntervalDays).toBe(4);
  });

  it('Ease inicial, piso e ajustes', () => {
    expect(SCHEDULER.initialEase).toBe(2.5);
    expect(SCHEDULER.minEase).toBe(1.3);
    expect(SCHEDULER.easeDelta).toEqual({ again: -0.2, hard: -0.15, good: 0, easy: 0.15 });
  });

  it('Multiplicadores de difícil e fácil em revisão', () => {
    expect(SCHEDULER.hardMultiplier).toBe(1.2);
    expect(SCHEDULER.easyBonus).toBe(1.3);
  });
});