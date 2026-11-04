export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, 404);
  }
}

export class PlanLimitError extends AppError {
  constructor(message = 'Limite do plano atingido.') {
    super(message, 403, 'PLAN_LIMIT_REACHED');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Já existe uma geração em andamento.') {
    super(message, 409, 'AI_GENERATION_IN_PROGRESS');
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Serviço de IA indisponível.') {
    super(message, 502, 'AI_SERVICE_UNAVAILABLE');
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message = 'O serviço de IA demorou demais para responder.') {
    super(message, 504, 'AI_SERVICE_TIMEOUT');
  }
}