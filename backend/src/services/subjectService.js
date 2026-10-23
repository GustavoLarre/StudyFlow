// Simulando uma base em memória por enquanto (depois trocaremamos pelo Firestore)
const subjectsDb = [];

export async function createSubject({ title }) {
  if (!title || title.trim() === '') {
    throw new Error('O título da matéria é obrigatório.');
  }

  const newSubject = {
    subjectId: `sub_${Date.now()}`,
    title: title.trim(),
    createdAt: new Date().toISOString()
  };

  subjectsDb.push(newSubject);
  return newSubject;
}

export async function getAllSubjects() {
  return subjectsDb;
}