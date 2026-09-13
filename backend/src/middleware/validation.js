const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Creates a validation middleware based on a simple required fields schema.
 * @param {string[]} requiredFields Array of field names that must be present in req.body
 */
function validatePayload(requiredFields = []) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      logger.warn('VALIDATION_FAILED', { missingFields, url: req.originalUrl });
      return next(new ValidationError(`Field wajib tidak boleh kosong: ${missingFields.join(', ')}`, { missingFields }));
    }
    
    logger.info('VALIDATION_SUCCESS', { url: req.originalUrl });
    next();
  };
}

module.exports = { validatePayload };
