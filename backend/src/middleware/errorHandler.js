const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const { ApiError, InternalError } = require('../utils/errors');
const fs = require('fs');
const path = require('path');

function globalErrorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    logger.warn('API_ERROR_HANDLED', { 
      status: err.statusCode, 
      type: err.errorCode, 
      message: err.message, 
      url: req.originalUrl,
      requestId: req.requestId
    });
    return ApiResponse.error(req, res, err);
  }

  // SQLite constraint error handling (e.g., NOT NULL constraint)
  if (err.message && err.message.includes('constraint failed')) {
    logger.warn('DB_CONSTRAINT_FAILED', { error: err.message, url: req.originalUrl });
    const validationError = new ApiError(400, 'BAD_REQUEST', 'Validasi database gagal: Data tidak lengkap atau format salah.');
    return ApiResponse.error(req, res, validationError);
  }

  // Unhandled / Unexpected Errors
  logger.error('UNHANDLED_ERROR', { 
    error: err.message, 
    stack: err.stack, 
    url: req.originalUrl,
    requestId: req.requestId
  });

  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      user: req.user ? `${req.user.nama || 'User'} (${req.user.level_otoritas})` : 'anonymous',
      error: err.message,
    };
    const logPath = path.join(__dirname, '../../logs/error.log');
    fs.appendFileSync(logPath, JSON.stringify(errorLog) + '\n');
  } catch (e) {
    console.error('Gagal menulis log ke logs/error.log', e.message);
  }
  
  const isProd = process.env.NODE_ENV === 'production';
  const safeMessage = isProd ? 'Terjadi kesalahan internal pada server' : (err.message || 'Terjadi kesalahan internal pada server');
  const internalError = new InternalError(safeMessage);
  
  if (!isProd && err.stack) {
    internalError.stack = err.stack;
  }
  
  return ApiResponse.error(req, res, internalError);
}

module.exports = globalErrorHandler;
