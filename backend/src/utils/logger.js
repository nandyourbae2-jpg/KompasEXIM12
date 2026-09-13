const RequestContext = require('./RequestContext');

// Sensitive fields to mask
const SENSITIVE_KEYS = new Set([
  'password', 'password_hash', 'jwt', 'token', 'authorization', 'cookie', 'apikey', 'api_key',
  'bank_account', 'npwp', 'credit_card', 'norek', 'rekening',
  'email', 'phone', 'phone_number', 'telepon', 'no_hp'
]);

/**
 * Recursively masks sensitive fields in an object.
 */
function maskSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const maskedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        maskedObj[key] = '[MASKED]';
      } else {
        maskedObj[key] = maskSensitiveData(obj[key]);
      }
    }
  }
  return maskedObj;
}

class Logger {
  static _log(level, event, context = {}, moduleName = 'APP') {
    const store = RequestContext.getStore();
    
    // Core payload structure
    const payload = {
      level,
      timestamp: new Date().toISOString(),
      module: moduleName,
      event,
      correlationId: store.correlationId || null,
      requestId: store.requestId || null,
      transactionId: store.transactionId || null,
      userId: store.userId || null,
      ...maskSensitiveData(context)
    };

    const jsonLog = JSON.stringify(payload);
    
    // Ship to appropriate output stream
    if (level === 'ERROR' || level === 'FATAL' || level === 'WARN') {
      console.error(jsonLog);
    } else if (level === 'DEBUG' || level === 'TRACE') {
      // In a real environment, you might only log DEBUG/TRACE if a flag is enabled
      if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'TRACE') {
        console.debug(jsonLog);
      }
    } else {
      console.log(jsonLog);
    }
  }

  static trace(event, context, moduleName) { this._log('TRACE', event, context, moduleName); }
  static debug(event, context, moduleName) { this._log('DEBUG', event, context, moduleName); }
  static info(event, context, moduleName) { this._log('INFO', event, context, moduleName); }
  static warn(event, context, moduleName) { this._log('WARN', event, context, moduleName); }
  static error(event, context, moduleName) { this._log('ERROR', event, context, moduleName); }
  static fatal(event, context, moduleName) { this._log('FATAL', event, context, moduleName); }

  /**
   * Specifically designed for the upcoming Observability workstream.
   * Standardizes execution time, slow query, and memory usage profiling.
   * @param {string} event - The performance event (e.g., 'DB_QUERY', 'HTTP_REQUEST')
   * @param {number} durationMs - Execution time in milliseconds
   * @param {object} metadata - Additional context
   */
  static performance(event, durationMs, metadata = {}, moduleName = 'PERF') {
    this._log('INFO', event, { ...metadata, durationMs, type: 'performance_metric' }, moduleName);
  }
}

module.exports = Logger;
