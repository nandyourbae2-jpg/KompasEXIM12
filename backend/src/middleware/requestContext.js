const crypto = require('crypto');
const RequestContext = require('../utils/RequestContext');

const requestContextMiddleware = (req, res, next) => {
  // Use provided header or generate a new unique UUID for the request
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  // Correlation ID defaults to requestId if not provided by upstream gateway
  const correlationId = req.headers['x-correlation-id'] || requestId;

  // Ensure downstream services or responses can trace back
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Correlation-Id', correlationId);

  const store = {
    requestId,
    correlationId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };

  RequestContext.run(store, () => {
    next();
  });
};

module.exports = requestContextMiddleware;
