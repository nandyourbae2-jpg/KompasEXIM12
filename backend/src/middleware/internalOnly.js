const { AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');

function internalOnly(req, res, next) {
  // In a real production environment, this should be protected by
  // a Reverse Proxy (e.g. Nginx, API Gateway, AWS VPC security groups)
  // that strips or validates X-Internal-Token, or relies on IP allowlisting.
  
  const internalToken = req.headers['x-internal-token'];
  const expectedToken = process.env.INTERNAL_API_TOKEN || 'kompas-exim-internal-secret-token';
  
  if (!internalToken || internalToken !== expectedToken) {
    logger.warn('INTERNAL_ACCESS_DENIED', { 
      ip: req.ip, 
      url: req.originalUrl,
      reason: 'Missing or invalid internal token'
    });
    return next(new AuthorizationError('Forbidden: Internal access only'));
  }
  
  next();
}

module.exports = { internalOnly };
