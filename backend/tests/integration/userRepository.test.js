import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getUserByUidDb,
  createUserDb,
  updateUserDb
} from '../../src/repositories/userRepository.js';
import { buildNewUser } from '../../src/config/users.js';
import { clearAll } from '../helpers/emulator.js';

describe('Repositório de Usuários - Firestore', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('Deve retornar null para um uid inexistente', async () => {
    const user = await getUserByUidDb('uid_que_nao_existe');

    expect(user).toBeNull();
  });

  it('Deve criar o usuário usando o uid como ID do documento', async () => {
    const newUser = buildNewUser({ uid: 'user_1', email: 'a@b.com' });

    const created = await createUserDb(newUser);
    const found = await getUserByUidDb('user_1');

    expect(created.uid).toBe('user_1');
    expect(found).toMatchObject({
      uid: 'user_1',
      email: 'a@b.com',
      xp: 0,
      level: 1,
      plan: 'free'
    });
  });

  it('Deve falhar ao criar um usuário que já existe, sem sobrescrever os dados', async () => {
    await createUserDb(buildNewUser({ uid: 'user_1', email: 'a@b.com' }));
    await updateUserDb('user_1', { xp: 50 });

    await expect(
      createUserDb(buildNewUser({ uid: 'user_1', email: 'a@b.com' }))
    ).rejects.toThrow();

    const found = await getUserByUidDb('user_1');
    expect(found.xp).toBe(50);
  });

  it('Deve atualizar campos do usuário e retornar o resultado', async () => {
    await createUserDb(buildNewUser({ uid: 'user_1', email: 'a@b.com' }));

    const updated = await updateUserDb('user_1', { xp: 120, level: 2 });

    expect(updated.xp).toBe(120);
    expect(updated.level).toBe(2);
    expect(updated.email).toBe('a@b.com');
  });

  it('Deve falhar ao atualizar um usuário inexistente', async () => {
    await expect(updateUserDb('fantasma', { xp: 1 })).rejects.toThrow();
  });
});