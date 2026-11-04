import { SCHEDULER } from '../config/scheduler.js';

const MINUTE_MS = 60000;
const DAY_MS = 86400000;
const ACTIONS = ['again', 'hard', 'good', 'easy'];

const addMinutes = (now, n) => new Date(now.getTime() + n * MINUTE_MS).toISOString();
const addDays = (now, n) => new Date(now.getTime() + n * DAY_MS).toISOString();

function roundEase(value) {
  return Math.round(value * 100) / 100;
}

function nextEase(ease, action) {
  return roundEase(Math.max(SCHEDULER.minEase, ease + SCHEDULER.easeDelta[action]));
}

function reviewLearning(card, action, now) {
  const steps = SCHEDULER.learningStepsMinutes;
  const current = card.state === 'new' ? 0 : card.step;

  if (action === 'easy') {
    const days = SCHEDULER.easyIntervalDays;
    return {
      state: 'review',
      step: 0,
      interval: days,
      easeFactor: nextEase(card.easeFactor, 'easy'),
      lapses: card.lapses,
      dueDate: addDays(now, days)
    };
  }

  if (action === 'good' && current + 1 >= steps.length) {
    const days = SCHEDULER.graduatingIntervalDays;
    return {
      state: 'review',
      step: 0,
      interval: days,
      easeFactor: card.easeFactor,
      lapses: card.lapses,
      dueDate: addDays(now, days)
    };
  }

  const step = action === 'again' ? 0 : action === 'good' ? current + 1 : current;

  return {
    state: 'learning',
    step,
    interval: 0,
    easeFactor: card.easeFactor,
    lapses: card.lapses,
    dueDate: addMinutes(now, steps[step])
  };
}

function reviewMature(card, action, now) {
  const { interval, easeFactor } = card;

  if (action === 'again') {
    return {
      state: 'relearning',
      step: 0,
      interval,
      easeFactor: nextEase(easeFactor, 'again'),
      lapses: card.lapses + 1,
      dueDate: addMinutes(now, SCHEDULER.relearningStepsMinutes[0])
    };
  }

  const hard = Math.max(interval + 1, Math.round(interval * SCHEDULER.hardMultiplier));
  const good = Math.max(hard + 1, Math.round(interval * easeFactor));
  const easy = Math.max(good + 1, Math.round(interval * easeFactor * SCHEDULER.easyBonus));
  const next = { hard, good, easy }[action];

  return {
    state: 'review',
    step: 0,
    interval: next,
    easeFactor: nextEase(easeFactor, action),
    lapses: card.lapses,
    dueDate: addDays(now, next)
  };
}

function reviewRelearning(card, action, now) {
  const steps = SCHEDULER.relearningStepsMinutes;

  if (action === 'easy' || (action === 'good' && card.step + 1 >= steps.length)) {
    const base = Math.max(1, card.interval);
    const days = action === 'easy' ? Math.max(2, base + 1) : base;

    return {
      state: 'review',
      step: 0,
      interval: days,
      easeFactor: nextEase(card.easeFactor, action),
      lapses: card.lapses,
      dueDate: addDays(now, days)
    };
  }

  const step = action === 'again' ? 0 : action === 'good' ? card.step + 1 : card.step;

  return {
    state: 'relearning',
    step,
    interval: card.interval,
    easeFactor: card.easeFactor,
    lapses: card.lapses,
    dueDate: addMinutes(now, steps[step])
  };
}

export function calculateNextReview(card, action, now = new Date()) {
  if (!ACTIONS.includes(action)) {
    throw new Error(`Avaliação inválida: ${action}`);
  }

  if (card.state === 'new' || card.state === 'learning') {
    return reviewLearning(card, action, now);
  }

  if (card.state === 'review') {
    return reviewMature(card, action, now);
  }

  if (card.state === 'relearning') {
    return reviewRelearning(card, action, now);
  }

  throw new Error(`Estado não suportado: ${card.state}`);
}