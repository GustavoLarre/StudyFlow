export const SCHEDULER = Object.freeze({
  learningStepsMinutes: Object.freeze([1, 10]),
  relearningStepsMinutes: Object.freeze([10]),
  graduatingIntervalDays: 1,
  easyIntervalDays: 4,
  initialEase: 2.5,
  minEase: 1.3,
  easeDelta: Object.freeze({ again: -0.2, hard: -0.15, good: 0, easy: 0.15 }),
  hardMultiplier: 1.2,
  easyBonus: 1.3
});
