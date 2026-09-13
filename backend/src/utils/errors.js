class ApiError extends Error {
  constructor(statusCode, errorCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApiError {
  constructor(message, details = null) {
    super(400, 'VAL_001', message, details);
  }
}

class AuthError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, 'AUTH_001', message);
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, 'AUTH_002', message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, 'REQ_001', message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource conflict') {
    super(409, 'BUS_002', message);
  }
}

class ConcurrencyConflictError extends ApiError {
  constructor(message = 'The record was modified by another transaction. Please try again.') {
    super(409, 'CONCURRENCY_CONFLICT', message);
  }
}

class VersionRequiredError extends ApiError {
  constructor(message = 'Optimistic concurrency version is required') {
    super(400, 'VERSION_REQUIRED', message);
  }
}

class BusinessRuleError extends ApiError {
  constructor(message, errorCode = 'BUS_001', details = null) {
    super(400, errorCode, message, details);
  }
}

class InternalError extends ApiError {
  constructor(message = 'Internal Server Error', details = null) {
    super(500, 'SYS_001', message, details);
  }
}

module.exports = {
  ApiError,
  ValidationError,
  AuthError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ConcurrencyConflictError,
  VersionRequiredError,
  BusinessRuleError,
  InternalError
};
