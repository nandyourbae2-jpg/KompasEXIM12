const jwt = require('jsonwebtoken');
const { AuthError, AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');
const RequestContext = require('../utils/RequestContext');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('FATAL_ERROR', { reason: 'JWT_SECRET environment variable is missing' });
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  logger.info('REQUEST_STARTED', { method: req.method, url: req.originalUrl, origin: req.get('origin') });
  
  if (!token) {
    logger.warn('AUTHENTICATION_FAILED', { reason: 'Missing token', method: req.method, url: req.originalUrl });
    return next(new AuthError('Tidak ada token autentikasi. Harap login.'));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('AUTHENTICATION_FAILED', { reason: 'Invalid token', error: err.message, method: req.method, url: req.originalUrl });
      return next(new AuthError('Token tidak valid atau sudah kedaluwarsa.'));
    }
    req.user = user;
    RequestContext.set('userId', user.employee_id);
    
    logger.info('AUTHENTICATION_SUCCESS', { userId: user.employee_id, role: user.level_otoritas, method: req.method, url: req.originalUrl });
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.level_otoritas) {
      return next(new AuthorizationError('Akses ditolak. Peran tidak dikenali.'));
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.level_otoritas)) {
      logger.warn('AUTHORIZATION_FAILED', { reason: 'Role mismatch', userId: req.user.employee_id, role: req.user.level_otoritas, allowedRoles });
      return next(new AuthorizationError(`Akses ditolak. Dibutuhkan peran: ${allowedRoles.join(', ')}`));
    }
    
    logger.info('AUTHORIZATION_SUCCESS', { step: 'RoleCheck', userId: req.user.employee_id, role: req.user.level_otoritas });
    next();
  };
}

function requirePermission(requiredPermissions) {
  return (req, res, next) => {
    // Extensible Permission Check (For Future Implementation)
    // Currently auto-failing to enforce secure-by-default until implemented.
    const hasPermissions = false;    
    if (!hasPermissions) {
      logger.warn('AUTHORIZATION_FAILED', { reason: 'Permission mismatch', userId: req.user.employee_id, requiredPermissions });
      return next(new AuthorizationError(`Akses ditolak. Dibutuhkan izin khusus.`));
    }
    
    logger.info('AUTHORIZATION_SUCCESS', { step: 'PermissionCheck', userId: req.user.employee_id });
    next();
  };
}

function authorizeDepartment(requiredDept = null) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('User not authenticated.'));
    }
    if (req.user.level_otoritas === 'Manager' || req.user.level_otoritas === 'Supervisor') {
      logger.info('DEPARTMENT_AUTHORIZATION_BYPASSED', { reason: `User is ${req.user.level_otoritas}`, userId: req.user.employee_id });
      return next(); // Managers & Supervisors have cross-department access
    }
    
    if (requiredDept && req.user.departemen !== requiredDept) {
      return next(new AuthorizationError(`Akses ditolak. Bukan bagian dari departemen: ${requiredDept}`));
    }

    req.scope = { departemen: req.user.departemen };
    req.scopedDepartment = req.user.departemen;
    logger.info('DEPARTMENT_AUTHORIZATION_APPLIED', { userId: req.user.employee_id, scopedDepartment: req.user.departemen });
    next();
  };
}

module.exports = { authenticateToken, requireRole, requirePermission, authorizeDepartment };
