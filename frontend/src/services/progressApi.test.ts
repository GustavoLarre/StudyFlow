import { describe, it, expect, vi } from 'vitest'
import { createProgressApi } from './progressApi'

describe('progressApi', () => {
  it('get devolve xp e subjects', async () => {
    const client = { get: vi.fn().mockResolvedValue({
      success: true,
      xp: { total: 120, level: 2, currentLevelXp: 20, nextLevelXp: 200 },
      subjects: [{ subjectId: 's1', title: 'Redes', total: 0, stats: { muitoFacil: 0, facil: 0, medio: 0, dificil: 0 } }],
    }) }

    const result = await createProgressApi(client).get()

    expect(client.get).toHaveBeenCalledWith('/progress')
    expect(result.xp.level).toBe(2)
    expect(result.subjects).toHaveLength(1)
  })
})