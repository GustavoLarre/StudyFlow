export async function createTestUser({ email = `user_${Date.now()}@teste.com`, password = 'senha123' } = {}) {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!host) {
    throw new Error('FIREBASE_AUTH_EMULATOR_HOST não definido: use o emulator.');
  }

  const response = await fetch(
    `http://${host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao criar usuário no Auth Emulator (${response.status})`);
  }

  const data = await response.json();
  return { uid: data.localId, email, idToken: data.idToken };
}