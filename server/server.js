const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { supabase, isConfigured } = require('./config/supabase');

// Route Handlers & Middlewares
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const { requireAuth } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for local dev / testing
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Product Inventory Management System API',
    version: '1.0.0',
    adminUsername: process.env.ADMIN_USERNAME || 'Adminclyde',
    endpoints: {
      auth: '/api/auth/login',
      health: '/api/health',
      products: '/api/products',
      categories: '/api/categories',
      dashboard: '/api/dashboard/stats',
    },
  });
});

// System Health & Diagnostics Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbMessage = 'Supabase credentials not configured';
  let latencyMs = 0;

  if (isConfigured) {
    const start = Date.now();
    try {
      const { error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
      latencyMs = Date.now() - start;
      if (error) {
        dbStatus = 'error';
        dbMessage = error.message;
      } else {
        dbStatus = 'connected';
        dbMessage = 'Connected to Supabase PostgreSQL';
      }
    } catch (err) {
      dbStatus = 'error';
      dbMessage = err.message;
    }
  }

  res.status(200).json({
    success: true,
    server: {
      status: 'online',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      port: PORT,
    },
    database: {
      configured: isConfigured,
      status: dbStatus,
      message: dbMessage,
      latency: latencyMs ? `${latencyMs}ms` : 'N/A',
    },
    admin: {
      configuredUsername: process.env.ADMIN_USERNAME || 'Adminclyde',
      configuredEmail: process.env.ADMIN_EMAIL ? 'Configured' : 'Missing',
    },
  });
});

// Public Auth Routes (Login)
app.use('/api/auth', authRoutes);

// Protected API Routes (Requires valid Supabase Admin JWT)
app.use('/api/products', requireAuth, productRoutes);
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Express Server running on: http://localhost:${PORT}`);
    console.log(`🔐 Admin Username: ${process.env.ADMIN_USERNAME || 'Adminclyde'}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📦 Protected Products API: http://localhost:${PORT}/api/products`);
    console.log(`🏷️  Protected Categories API: http://localhost:${PORT}/api/categories`);
    console.log(`📈 Protected Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
    console.log(`====================================================`);
  });
}

module.exports = app;
