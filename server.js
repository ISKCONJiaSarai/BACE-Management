const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const loadAppConfig = require('./config/env');

// Load environment variables
dotenv.config();
loadAppConfig();

const app = express();

app.use((req, res, next) => {
  req.requestId = req.headers['x-vercel-id'] || `local-${Date.now().toString(36)}`;
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5000',
  'http://localhost:3000'
];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev mode
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Vercel serves public/ directly; Express serves it during local development.
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    project: 'ISKCON BACE Jia Sarai Management API',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', async (req, res, next) => {
  if (req.method === 'GET' && req.path === '/auth/config') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (error) {
    error.failureStage = 'mongodb_connection';
    next(error);
  }
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/devotees', require('./routes/devoteeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/followups', require('./routes/followupRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/camps', require('./routes/campRoutes'));
app.use('/api/outings', require('./routes/outingRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  const stage = err.failureStage || 'request_processing';
  const code = err.code || err.name || 'INTERNAL_ERROR';
  console.error(`[${requestId}] ${stage}:`, err.stack || err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    stage,
    code,
    error: err.message || String(err),
    requestId
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api/devotees`);
  });
}

module.exports = app;
