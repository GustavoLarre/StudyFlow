function getProjectId() {
  return process.env.GCLOUD_PROJECT || 'demo-studyflow';
}

function requireHost(name) {
  const host = process.env[name];
  if (!host) {
    throw new Error(
      `${name} não definido: a limpeza só roda contra o emulator. ` +
      `Use: npm run test:integration:emu`
    );
  }
  return host;
}

async function deleteEmulatorData(url) {
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Falha ao limpar o emulator (${response.status}): ${url}`);
  }
}

export async function clearFirestore() {
  const host = requireHost('FIRESTORE_EMULATOR_HOST');
  await deleteEmulatorData(
    `http://${host}/emulator/v1/projects/${getProjectId()}/databases/(default)/documents`
  );
}

export async function clearAuth() {
  const host = requireHost('FIREBASE_AUTH_EMULATOR_HOST');
  await deleteEmulatorData(
    `http://${host}/emulator/v1/projects/${getProjectId()}/accounts`
  );
}

export async function clearAll() {
  await Promise.all([clearFirestore(), clearAuth()]);
}