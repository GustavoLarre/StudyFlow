import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mockamos apenas o subjectService
jest.unstable_mockModule('../../src/services/subjectService.js', () => ({
  createSubject: jest.fn(),
  getAllSubjects: jest.fn()
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;
const subjectService = await import('../../src/services/subjectService.js');

describe('Integração - Módulo de Matérias (/subjects)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve criar uma matéria com sucesso e retornar status 201', async () => {
    const mockSubject = {
      subjectId: 'sub_123',
      title: 'Estrutura de Dados',
      createdAt: new Date().toISOString()
    };

    subjectService.createSubject.mockResolvedValue(mockSubject);

    const response = await request(app)
      .post('/subjects')
      .send({ title: 'Estrutura de Dados' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.subject).toHaveProperty('title', 'Estrutura de Dados');
  });

  it('Deve listar todas as matérias com sucesso e retornar status 200', async () => {
    const mockSubjectsList = [
      { subjectId: 'sub_123', title: 'Estrutura de Dados' },
      { subjectId: 'sub_456', title: 'Banco de Dados' }
    ];

    subjectService.getAllSubjects.mockResolvedValue(mockSubjectsList);

    const response = await request(app).get('/subjects');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(Array.isArray(response.body.subjects)).toBe(true);
    expect(response.body.subjects.length).toBe(2);
  });
});