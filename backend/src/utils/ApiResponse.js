const { ApiError } = require('./errors');

class ApiResponse {
  /**
   * Helper to check if the current route is legacy (/api/* except /api/v2/*)
   * This handles the backward-compatibility requirement without monkey-patching res.json
   */
  static isLegacyRoute(req) {
    if (!req || !req.originalUrl) return true;
    return !req.originalUrl.startsWith('/api/v2/');
  }

  /**
   * Sends a successful standard response.
   * Internally unwraps for legacy routes to preserve Zero Regression.
   */
  static send(req, res, data = null, metadata = undefined) {
    const statusCode = res.statusCode || 200;
    if (this.isLegacyRoute(req)) {
      // Legacy routes expect raw data or { success: true, ... } implicitly
      return res.status(statusCode).json(data);
    }

    const payload = {
      success: true,
      code: statusCode,
      message: 'Success',
      data: data,
      requestId: req.requestId || null,
      timestamp: new Date().toISOString()
    };

    if (metadata !== undefined) {
      payload.metadata = metadata;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Sends an error standard response.
   * Maps custom error classes to standard formats.
   */
  static error(req, res, error) {
    let statusCode = 500;
    let errorCode = 'SYS_001';
    let message = 'Internal Server Error';
    let details = null;

    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      errorCode = error.errorCode;
      message = error.message;
      details = error.details;
    } else if (error.code === 'P2002') {
      // Prisma unique constraint violation
      statusCode = 409;
      errorCode = 'DB_001';
      message = 'A unique constraint failed on the database.';
    } else {
      // Uncaught internal errors
      message = error.message || message;
    }

    // Log the error centrally
    console.error(`[${req.requestId || 'UNKNOWN'}] Error:`, error);

    if (this.isLegacyRoute(req)) {
      // Legacy routes usually just return { error: message }
      return res.status(statusCode).json({ error: message });
    }

    const payload = {
      success: false,
      code: statusCode,
      errorCode: errorCode,
      message: message,
      data: null,
      requestId: req.requestId || null,
      timestamp: new Date().toISOString()
    };

    if (details) {
      payload.details = details;
    }

    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
