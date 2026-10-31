const required = ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(
    `Testes de integração só rodam com os emulators ativos. ` +
    `Variáveis ausentes: ${missing.join(', ')}. ` +
    `Use: npm run test:integration:emu`
  );
}

// Segunda camada: nunca usar credenciais reais nos testes
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;