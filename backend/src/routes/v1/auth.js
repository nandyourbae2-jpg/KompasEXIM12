const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../../database/db');
const RequestContext = require('../../utils/RequestContext');
const ApiResponse = require('../../utils/ApiResponse');
const { AuthError, ValidationError, AuthorizationError } = require('../../utils/errors');

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    code: "AUTH_RATE_LIMIT",
    message: "Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit."
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { employee_id, password } = req.body;
    
    if (!employee_id) {
      throw new ValidationError('Employee ID wajib diisi');
    }

    const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);

    let isMatch = false;
    if (user && user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!user || !isMatch) {
      return res.status(401).json({
        success: false,
        code: "AUTH_001",
        message: "Invalid credentials"
      });
    }

    if (!user.status_aktif) {
      throw new AuthorizationError('Akun ini sudah tidak aktif, hubungi Supervisor Anda');
    }

    // Never return the password or password_hash
    const { password_hash: _, ...userWithoutPassword } = user;
    
    // Also inject into RequestContext if any further middleware runs
    RequestContext.set('userId', user.employee_id);
    
    // Sign JWT Token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
    }
    const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '8h' });
    
    ApiResponse.send(req, res, { user: userWithoutPassword, token });
  } catch (error) { next(error); }
});

module.exports = router;
