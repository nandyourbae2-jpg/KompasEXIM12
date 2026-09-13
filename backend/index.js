const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TaskService = require('./src/domain/TaskService');
const MtbService = require('./src/services/mtbService');
const { authenticateToken, requireRole, requirePermission, authorizeDepartment } = require('./src/middleware/auth');
const { validatePayload } = require('./src/middleware/validation');
const globalErrorHandler = require('./src/middleware/errorHandler');

const catchErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const app = express();
const PORT = process.env.PORT || 3001;


// Setup middlewares
const helmet = require('helmet');
app.use(helmet());

app.use(cors({
  origin: ['http://localhost:5173', 'https://kompas-exim.company.com'], 
  credentials: true
}));
app.use(express.json());
const requestContextMiddleware = require('./src/middleware/requestContext');
app.use(requestContextMiddleware);
app.use(morgan('dev'));

const { payloadAdapter } = require('./src/middleware/payloadAdapter');
app.use(payloadAdapter);

// Setup uploads directory
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve static files from uploads
app.use('/uploads', express.static(uploadsDir));

// MOUNT VERSIONED ROUTERS
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use('/api/internal', require('./src/routes/internal'));
app.use('/api/v2', require('./src/routes/v2'));

const v1Router = require('./src/routes/v1');
app.use('/api/v1', v1Router);
// Fallback for Zero Frontend Regression
app.use('/api', v1Router);

// Serve Frontend Static Files
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route to serve React app for non-API routes
// Using a generic app.use to avoid Express 5 path-to-regexp issues
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});



// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Kompas EXIM Backend (SQLite) berjalan di http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;
