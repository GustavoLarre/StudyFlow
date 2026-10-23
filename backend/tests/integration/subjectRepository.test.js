import { createSubjectDb, getSubjectsDb, getSubjectByIdDb } from '../../src/repositories/subjectRepository.js';

describe('Repositório de Matérias - Firestore', () => {
  let createdSubjectId;

  it('Deve criar uma matéria no Firestore com sucesso', async () => {
    const subjectData = {
      name: 'Matemática Discreta',
      description: 'Grafos, lógica e combinatória.',
      createdAt: new Date().toISOString()
    };

    const result = await createSubjectDb(subjectData);

    expect(result).toHaveProperty('subjectId');
    expect(result.name).toBe(subjectData.name);

    createdSubjectId = result.subjectId;
  });

  it('Deve listar todas as matérias cadastradas', async () => {
    const subjects = await getSubjectsDb();

    expect(Array.isArray(subjects)).toBe(true);
    expect(subjects.length).toBeGreaterThan(0);
    
    const found = subjects.find(s => s.subjectId === createdSubjectId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Matemática Discreta');
  });

  it('Deve buscar uma matéria específica pelo ID', async () => {
    const subject = await getSubjectByIdDb(createdSubjectId);

    expect(subject).not.toBeNull();
    expect(subject).toHaveProperty('subjectId', createdSubjectId);
    expect(subject.name).toBe('Matemática Discreta');
  });

  it('Deve retornar null ao buscar uma matéria com ID inexistente', async () => {
    const subject = await getSubjectByIdDb('id_subject_inexistente');
    expect(subject).toBeNull();
  });
});