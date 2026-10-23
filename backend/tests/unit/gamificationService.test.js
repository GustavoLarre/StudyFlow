import { describe, it, expect } from '@jest/globals';
import { addXp, calculateLevel } from '../../src/services/gamificationService.js';

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