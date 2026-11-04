import { jest, describe, it, expect } from '@jest/globals';
import { PLANS, getPlanLimits } from '../../src/config/plans.js';
import {
  AppError, ValidationError, NotFoundError,
  PlanLimitError, ConflictError, BadGatewayError, GatewayTimeoutError
} from '../../src/errors/AppError.js';
import { handleError } from '../../src/errors/handleError.js';

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Unidade - config/plans', () => {
  it('Free tem 3 gerações de IA vitalícias', () => {
    expect(PLANS.free.aiGenerations).toEqual({ limit: 3, period: 'lifetime' });
  });

  it('Plus não tem limite de gerações por enquanto', () => {
    expect(PLANS.plus.aiGenerations.limit).toBe(Infinity);
  });

  it('getPlanLimits devolve o plano pedido e cai no free se for desconhecido', () => {
    expect(getPlanLimits('plus')).toBe(PLANS.plus);
    expect(getPlanLimits('qualquer')).toBe(PLANS.free);
    expect(getPlanLimits(undefined)).toBe(PLANS.free);
  });
});

describe('Unidade - erros tipados', () => {
  it.each([
    [ValidationError, 400, null],
    [NotFoundError, 404, null],
    [PlanLimitError, 403, 'PLAN_LIMIT_REACHED'],
    [ConflictError, 409, 'AI_GENERATION_IN_PROGRESS'],
    [BadGatewayError, 502, 'AI_SERVICE_UNAVAILABLE'],
    [GatewayTimeoutError, 504, 'AI_SERVICE_TIMEOUT']
  ])('%p tem status %p e code %p', (ErrorClass, status, code) => {
    const error = new ErrorClass('msg');

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(status);
    expect(error.code).toBe(code);
    expect(error.message).toBe('msg');
  });
});

describe('Unidade - handleError', () => {
  it('Inclui o code na resposta quando o erro tem code', () => {
    const res = buildRes();

    handleError(res, new PlanLimitError('Limite atingido.'));

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false, error: 'Limite atingido.', code: 'PLAN_LIMIT_REACHED'
    });
  });

  it('Não inclui code quando o erro não tem', () => {
    const res = buildRes();

    handleError(res, new NotFoundError('Nada.'));

    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Nada.' });
  });

  it('Erro inesperado continua 500 genérico', () => {
    const res = buildRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    handleError(res, new Error('segredo'));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Erro interno do servidor.' });
    spy.mockRestore();
  });
});