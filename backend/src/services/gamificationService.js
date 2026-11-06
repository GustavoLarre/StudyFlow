/**
 * Calcula o nível do usuário com base no XP total acumulado.
 * Regra de progressão: Cada nível exige um custo progressivo de XP.
 */
export function calculateLevel(totalXp) {
  let level = 1;
  let xpRequiredForNextLevel = 100;
  let remainingXp = totalXp;

  // Enquanto o usuário tiver XP suficiente para subir de nível
  while (remainingXp >= xpRequiredForNextLevel) {
    remainingXp -= xpRequiredForNextLevel;
    level += 1;
    // O custo do próximo nível aumenta progressivamente (ex: dobra a cada nível ou cresce de forma escalonada)
    xpRequiredForNextLevel = level * 100;
  }

  return {
    level,
    currentXp: totalXp,
    nextLevelXp: xpRequiredForNextLevel
  };
}

/**
 * Adiciona XP ao perfil do usuário e recalcula o nível.
 */
export function addXp(user, xpToAdd) {
  const currentXp = (user.xp || 0) + xpToAdd;
  const levelInfo = calculateLevel(currentXp);

  return {
    ...user,
    xp: currentXp,
    level: levelInfo.level,
    gainedXp: xpToAdd
  };
}

/**
 * Progresso dentro do nível atual (para a barra de XP).
 * currentLevelXp: XP acumulado no nível; nextLevelXp: custo do nível atual até o próximo.
 */
export function getLevelProgress(totalXp) {
  let remaining = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  let cost = 100;

  while (remaining >= cost) {
    remaining -= cost;
    level += 1;
    cost = level * 100;
  }

  return { level, currentLevelXp: remaining, nextLevelXp: cost };
}