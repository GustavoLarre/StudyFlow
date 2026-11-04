import {
  createUserDb, getUserByUidDb, reserveAiGeneration, releaseAiGeneration
} from '../../src/repositories/userRepository.js';
import { buildNewUser } from '../../src/config/users.js';
import { PlanLimitError, ConflictError } from '../../src/errors/AppError.js';
import { clearAll } from '../helpers/emulator.js';

const LOCK_MS = 60000;

async function seedUser(uid = 'u1') {
  await createUserDb(buildNewUser({ uid, email: `${uid}@t.com` }));
  return uid;
}

describe('Repositório de Usuários - cota de IA', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('Reserva incrementa o contador e grava a trava', async () => {
    const uid = await seedUser();

    const result = await reserveAiGeneration(uid, { limit: 3, lockMs: LOCK_MS });
    const user = await getUserByUidDb(uid);

    expect(result).toEqual({ count: 1, limit: 3 });
    expect(user.usage.aiGenerations.count).toBe(1);
    expect(user.usage.aiInFlight).toMatchObject({ startedAt: expect.any(String), expiresAt: expect.any(String) });
  });

  it('Segunda reserva com trava ativa lança ConflictError (409) sem consumir cota', async () => {
    const uid = await seedUser();
    await reserveAiGeneration(uid, { limit: 3, lockMs: LOCK_MS });

    await expect(reserveAiGeneration(uid, { limit: 3, lockMs: LOCK_MS })).rejects.toBeInstanceOf(ConflictError);

    expect((await getUserByUidDb(uid)).usage.aiGenerations.count).toBe(1);
  });

  it('Lança PlanLimitError (403) quando o limite é atingido', async () => {
    const uid = await seedUser();

    for (let i = 0; i < 3; i++) {
      await reserveAiGeneration(uid, { limit: 3, lockMs: LOCK_MS });
      await releaseAiGeneration(uid, { refund: false });
    }

    await expect(reserveAiGeneration(uid, { limit: 3, lockMs: LOCK_MS })).rejects.toBeInstanceOf(PlanLimitError);
    expect((await getUserByUidDb(uid)).usage.aiGenerations.count).toBe(3);
  });

  it('Liberar sem reembolso limpa a trava e mantém o contador', async () => {
    const uid = await seedUser();
    await reserveAiGeneration(uid, { limit: 3, lockMs: LOCK_MS });

    await releaseAiGeneration(uid, { refund: false });
    const user = await getUserByUidDb(uid);

    expect(user.usage.aiInFlight).toBeNull();
    expect(user.usage.aiGenerations.count).toBe(1);
  });

  it('Liberar com reembolso devolve a cota e nunca fica abaixo de zero', async () => {
    const uid = await seedUser();
    await reserveAiGeneration(uid, { limit: 3, lockMs: LOCK_MS });

    await releaseAiGeneration(uid, { refund: true });
    expect((await getUserByUidDb(uid)).usage.aiGenerations.count).toBe(0);

    await releaseAiGeneration(uid, { refund: true });
    expect((await getUserByUidDb(uid)).usage.aiGenerations.count).toBe(0);
  });

  it('Trava expirada é ignorada e a cota da tentativa morta é devolvida', async () => {
    const uid = await seedUser();
    const t0 = new Date('2026-01-01T00:00:00.000Z');
    await reserveAiGeneration(uid, { limit: 3, lockMs: 1000, now: t0 });

    const later = new Date(t0.getTime() + 5000);
    const result = await reserveAiGeneration(uid, { limit: 3, lockMs: 1000, now: later });

    expect(result.count).toBe(1); // 1 (morta, devolvida) -> 0 -> reserva nova -> 1
  });

  it('Concorrência: 6 reservas simultâneas do mesmo usuário, só 1 passa', async () => {
    const uid = await seedUser();

    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => reserveAiGeneration(uid, { limit: 3, lockMs: LOCK_MS }))
    );

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.reason instanceof ConflictError)).toHaveLength(5);
    expect((await getUserByUidDb(uid)).usage.aiGenerations.count).toBe(1);
  });

  it('Usuário inexistente falha', async () => {
    await expect(reserveAiGeneration('fantasma', { limit: 3, lockMs: LOCK_MS })).rejects.toThrow();
  });
});