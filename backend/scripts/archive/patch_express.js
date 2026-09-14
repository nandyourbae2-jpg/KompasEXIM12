const fs = require('fs');

let content = fs.readFileSync('index.js', 'utf8');

const helper_code = `
// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER UTILITIES
// ─────────────────────────────────────────
const catchErrors = (fn) => (req, res, next) => {
  try {
    const result = fn(req, res, next);
    if (result instanceof Promise) {
      result.catch(next);
    }
  } catch (err) {
    next(err);
  }
};

function validateRequired(body, fields) {
  return fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
}

// ─────────────────────────────────────────
// AUTOMATIC ROUTE WRAPPER (Monkey-patching Express)
// ─────────────────────────────────────────
['get', 'post', 'put', 'patch', 'delete'].forEach(method => {
  const original = app[method].bind(app);
  app[method] = function(path, ...handlers) {
    const wrappedHandlers = handlers.map(handler => {
      // Don't wrap simple middleware like authenticateToken (though authenticateToken is updated to handle its own try/catch)
      if (typeof handler === 'function') {
        return catchErrors(handler);
      }
      return handler;
    });
    return original(path, ...wrappedHandlers);
  };
});
`;

if (!content.includes("catchErrors =")) {
    content = content.replace(/(app\.use\(express\.json\(\)\);\n)/, '$1' + helper_code + '\n');
}

const new_auth_code = `function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Tidak ada token autentikasi',
        hint: 'Silakan login ulang'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'kompas_exim_secret_key', (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Sesi sudah habis',
            hint: 'Silakan login ulang',
            code: 'TOKEN_EXPIRED'
          });
        }
        return res.status(401).json({
          error: 'Token tidak valid',
          hint: 'Silakan login ulang',
          code: 'TOKEN_INVALID'
        });
      }
      req.user = user;
      next();
    });
  } catch (err) {
    next(err);
  }
}`;

content = content.replace(/function authenticateToken\s*\([^)]*\)\s*\{.*?(?=\napp\.)/s, new_auth_code + '\n\n');

const global_error_handler = `
// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('=== UNHANDLED ERROR ===');
  console.error('Route:', req.method, req.path);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('=======================');

  res.status(500).json({
    error: 'Terjadi kesalahan internal server',
    detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    route: \`\${req.method} \${req.path}\`
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: \`Endpoint tidak ditemukan: \${req.method} \${req.path}\`,
    hint: 'Periksa URL dan method yang digunakan'
  });
});
`;

if (!content.includes("GLOBAL ERROR HANDLER")) {
    content = content.replace(/(app\.listen\([^)]+\)\s*;?)/, global_error_handler + '\n$1');
}

fs.writeFileSync('index.js', content);
