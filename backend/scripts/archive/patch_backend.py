import re

with open('index.js', 'r') as f:
    content = f.read()

# 1. Inject helpers at the top after imports/middleware
helper_code = """
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
"""

if "catchErrors =" not in content:
    # insert after the cors/express.json() setup
    content = re.sub(r'(app\.use\(express\.json\(\)\);\n)', r'\1' + helper_code + '\n', content)

# 2. Refactor authenticateToken
new_auth_code = """function authenticateToken(req, res, next) {
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
}"""

# replace existing authenticateToken
content = re.sub(r'function authenticateToken\s*\([^)]*\)\s*\{.*?(?=\napp\.)', new_auth_code + '\n\n', content, flags=re.DOTALL)

# 3. Wrap routes with catchErrors
# Match pattern: app.METHOD('...', [middleware,] (req, res[, next]) => {
# We need to wrap the last arrow function in catchErrors()
def route_replacer(match):
    full_match = match.group(0)
    if 'catchErrors(' in full_match:
        return full_match # already wrapped
        
    method = match.group(1)
    path = match.group(2)
    middleware = match.group(3)
    arrow_func_args = match.group(4)
    
    replacement = f"app.{method}({path},{middleware} catchErrors(({arrow_func_args}) => {{"
    return replacement

# Regex explanation:
# app\.(get|post|patch|put|delete)\(('[^']+'|"[^"]+"),\s*(.*?)(?:\s*,)?\s*\((req,\s*res(?:,\s*next)?)\)\s*=>\s*\{
# Group 1: method
# Group 2: path
# Group 3: middleware (like 'authenticateToken,')
# Group 4: args (req, res) or (req, res, next)

pattern = r'app\.(get|post|patch|put|delete)\(([\'"][^\'"]+[\'"]),\s*(.*?)(?:\s*,)?\s*\((req,\s*res(?:,\s*next)?)\)\s*=>\s*\{'
content = re.sub(pattern, route_replacer, content)

# 4. Global Error Handler at the end, before app.listen
global_error_handler = """
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
    route: `${req.method} ${req.path}`
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint tidak ditemukan: ${req.method} ${req.path}`,
    hint: 'Periksa URL dan method yang digunakan'
  });
});
"""

if "GLOBAL ERROR HANDLER" not in content:
    content = re.sub(r'(app\.listen\([^)]+\)\s*;?)', global_error_handler + r'\n\1', content)

with open('index_patched.js', 'w') as f:
    f.write(content)
