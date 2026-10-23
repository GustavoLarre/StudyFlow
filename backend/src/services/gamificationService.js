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