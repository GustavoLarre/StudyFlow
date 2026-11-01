import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { clearFirestore, clearAuth, clearAll } from '../helpers/emulator.js';

describe('Unidade - Helper de limpeza dos emulators', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.GCLOUD_PROJECT = 'demo-studyflow';
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
  });

  it('clearFirestore deve enviar DELETE ao endpoint de documentos do emulator', async () => {
    await clearFirestore();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8080/emulator/v1/projects/demo-studyflow/databases/(default)/documents',
      { method: 'DELETE' }
    );
  });

  it('clearAuth deve enviar DELETE ao endpoint de contas do emulator', async () => {
    await clearAuth();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:9099/emulator/v1/projects/demo-studyflow/accounts',
      { method: 'DELETE' }
    );
  });

  it('clearAll deve limpar Firestore e Auth', async () => {
    await clearAll();

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('Deve recusar limpar se FIRESTORE_EMULATOR_HOST não estiver definido', async () => {
    delete process.env.FIRESTORE_EMULATOR_HOST;

    await expect(clearFirestore()).rejects.toThrow('emulator');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('Deve recusar limpar se FIREBASE_AUTH_EMULATOR_HOST não estiver definido', async () => {
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

    await expect(clearAuth()).rejects.toThrow('emulator');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('Deve lançar erro se o emulator responder com falha', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(clearFirestore()).rejects.toThrow('500');
  });
});