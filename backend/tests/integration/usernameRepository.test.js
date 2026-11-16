import { claimUsername } from '../../src/repositories/usernameRepository.js';
import { createUserDb, getUserByUidDb } from '../../src/repositories/userRepository.js';
import { buildNewUser } from '../../src/config/users.js';
import { ConflictError, ForbiddenError } from '../../src/errors/AppError.js';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';

const seed = (uid) => createUserDb(buildNewUser({ uid, email: `${uid}@t.com` }));
const owner = async (name) => (await db.collection('usernames').doc(name).get()).data()?.uid;

describe('Repositório de usernames - Firestore', () => {
  beforeEach(async () => {
    await clearAll();
    await seed('u1');
    await seed('u2');
  });

  it('Define o username inicial sem consumir a troca', async () => {
    await claimUsername('u1', 'gustavo');

    const user = await getUserByUidDb('u1');
    expect(user.username).toBe('gustavo');
    expect(user.usernameChanges).toBe(0);
    expect(await owner('gustavo')).toBe('u1');
  });

  it('Permite uma única troca, liberando o nome antigo', async () => {
    await claimUsername('u1', 'gustavo');
    await claimUsername('u1', 'gustavo.dev');

    const user = await getUserByUidDb('u1');
    expect(user.username).toBe('gustavo.dev');
    expect(user.usernameChanges).toBe(1);
    expect(await owner('gustavo')).toBeUndefined();
    expect(await owner('gustavo.dev')).toBe('u1');
  });

  it('Bloqueia a segunda troca com 403', async () => {
    await claimUsername('u1', 'gustavo');
    await claimUsername('u1', 'gustavo2');

    await expect(claimUsername('u1', 'gustavo3')).rejects.toBeInstanceOf(ForbiddenError);
    expect((await getUserByUidDb('u1')).username).toBe('gustavo2');
  });

  it('Nome igual ao atual não consome a troca', async () => {
    await claimUsername('u1', 'gustavo');
    await claimUsername('u1', 'gustavo');

    expect((await getUserByUidDb('u1')).usernameChanges).toBe(0);
  });

  it('Nome em uso por outro usuário responde 409 e não altera nada', async () => {
    await claimUsername('u1', 'gustavo');

    await expect(claimUsername('u2', 'gustavo')).rejects.toBeInstanceOf(ConflictError);
    expect((await getUserByUidDb('u2')).username).toBeUndefined();
    expect(await owner('gustavo')).toBe('u1');
  });

  it('Conflito na troca não consome a troca nem libera o nome atual', async () => {
    await claimUsername('u1', 'gustavo');
    await claimUsername('u2', 'maria');

    await expect(claimUsername('u1', 'maria')).rejects.toBeInstanceOf(ConflictError);

    const user = await getUserByUidDb('u1');
    expect(user.username).toBe('gustavo');
    expect(user.usernameChanges).toBe(0);
  });

  it('Corrida: dois usuários pedindo o mesmo nome, só um vence', async () => {
    const results = await Promise.allSettled([
      claimUsername('u1', 'disputado'),
      claimUsername('u2', 'disputado')
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.reason instanceof ConflictError)).toHaveLength(1);
  });

  it('Usuário inexistente falha', async () => {
    await expect(claimUsername('fantasma', 'qualquer')).rejects.toThrow();
  });
});