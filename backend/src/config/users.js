export const PLAN_IDS = Object.freeze({
  FREE: 'free',
  PLUS: 'plus'
});

export function buildNewUser({ uid, email = null }) {
  const now = new Date().toISOString();

  return {
    uid,
    email,
    xp: 0,
    level: 1,
    plan: PLAN_IDS.FREE,
    planUpdatedAt: now,
    createdAt: now
  };
}