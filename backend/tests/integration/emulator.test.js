import { describe, it, expect, beforeEach } from '@jest/globals';
import { db } from '../../src/config/firebase.js';
import { clearAll } from '../helpers/emulator.js';

describe('Integração - Emulator do Firestore', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('Deve gravar e ler um documento no emulator', async () => {
    const ref = await db.collection('_emulator_check').add({ ok: true });
    const snap = await ref.get();

    expect(snap.exists).toBe(true);
    expect(snap.data()).toEqual({ ok: true });
  });

  it('Deve começar cada teste com o Firestore vazio', async () => {
    const snapshot = await db.collection('_emulator_check').get();

    expect(snapshot.empty).toBe(true);
  });
});