import { describe, it, expect } from '@jest/globals';
import { addXp, calculateLevel, getLevelProgress } from '../../src/services/gamificationService.js';

describe('Unidade - Serviço de Gamificação e XP', () => {
  it('Deve calcular o nível corretamente com base no XP acumulado', () => {
    // 0 XP = Nível 1
    expect(calculateLevel(0)).toEqual({ level: 1, currentXp: 0, nextLevelXp: 100 });

    // 50 XP = Nível 1 (ainda não atingiu 100)
    expect(calculateLevel(50)).toEqual({ level: 1, currentXp: 50, nextLevelXp: 100 });

    // 100 XP = Transição para o Nível 2
    expect(calculateLevel(100)).toEqual({ level: 2, currentXp: 100, nextLevelXp: 200 });
  });

  it('Deve somar XP ao usuário corretamente e retornar o progresso atualizado', () => {
    const initialUser = { xp: 80, level: 1 };
    const updatedUser = addXp(initialUser, 30); // 80 + 30 = 110 XP (Passa para o nível 2)

    expect(updatedUser.xp).toBe(110);
    expect(updatedUser.level).toBe(2);
    expect(updatedUser.gainedXp).toBe(30);
  });
});

describe('Unidade - getLevelProgress', () => {
  it.each([
    [0,   { level: 1, currentLevelXp: 0,  nextLevelXp: 100 }],
    [50,  { level: 1, currentLevelXp: 50, nextLevelXp: 100 }],
    [99,  { level: 1, currentLevelXp: 99, nextLevelXp: 100 }],
    [100, { level: 2, currentLevelXp: 0,  nextLevelXp: 200 }],
    [120, { level: 2, currentLevelXp: 20, nextLevelXp: 200 }],
    [300, { level: 3, currentLevelXp: 0,  nextLevelXp: 300 }]
  ])('XP total %i', (totalXp, expected) => {
    expect(getLevelProgress(totalXp)).toEqual(expected);
  });

  it('Trata XP ausente ou negativo como 0', () => {
    expect(getLevelProgress(undefined)).toEqual({ level: 1, currentLevelXp: 0, nextLevelXp: 100 });
    expect(getLevelProgress(-5)).toEqual({ level: 1, currentLevelXp: 0, nextLevelXp: 100 });
  });
});