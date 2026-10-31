import { describe, it, expect } from '@jest/globals';
import { db } from '../../src/config/firebase.js';

describe('Integração - Emulator do Firestore', () => {
  it('Deve gravar e ler um documento no emulator', async () => {
    const ref = await db.collection('_emulator_check').add({ ok: true });
    const snap = await ref.get();

    expect(snap.exists).toBe(true);
    expect(snap.data()).toEqual({ ok: true });

    await ref.delete();
  });
});