export const PLANS = Object.freeze({
  free: Object.freeze({
    aiGenerations: Object.freeze({ limit: 3, period: 'lifetime' })
  }),
  plus: Object.freeze({
    // Regra de 10 por mês volta na Fase 3
    aiGenerations: Object.freeze({ limit: Infinity, period: 'lifetime' })
  })
});

export function getPlanLimits(planId) {
  return PLANS[planId] ?? PLANS.free;
}