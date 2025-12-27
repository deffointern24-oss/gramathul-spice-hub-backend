const express = require('express');
const cron = require('node-cron');
const axios = require('axios');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const profileRoutes = require('./routes/profileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const gmailRoutes = require('./routes/gmailRoutes');

// Middleware
const { 
  apiLimiter, 
  authLimiter, 
  adminLimiter, 
  uploadLimiter,
  readLimiter 
} = require('./middleware/rateLimiter');
const logger = require('./config/logger');
const morganMiddleware = require('./middleware/morganMiddleware');
const requestIdMiddleware = require('./middleware/requestId');
const app = express();
app.set('trust proxy', 1);
app.use(requestIdMiddleware);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());

//  Request logging with Morgan
app.use(morganMiddleware);

//  Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//  CORS configuration
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', {
        origin,
        requestId: origin ? 'external' : 'no-origin'
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
connectDB();

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gramathul Spice Hub API is running! 🌶️',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      profile: '/api/profile'
    },
    documentation: 'https://api.gramathulspicehub.com/docs' // Optional
  });
});

//  Health check
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: 'connected',
    node: process.version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  };
  
  logger.info('Health check', { requestId: req.id });
  res.status(200).json(healthData);
});

//  Razorpay key endpoint
app.get('/api/getkey', apiLimiter, (req, res) => {
  logger.info('Razorpay key requested', { requestId: req.id });
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/products', (req, res, next) => {
  if (req.method === 'GET') {
    return readLimiter(req, res, next);
  }
  return uploadLimiter(req, res, next);
}, productRoutes);
app.use('/api/orders', (req, res, next) => {
  if (req.method === 'GET') {
    return readLimiter(req, res, next);
  }
  return apiLimiter(req, res, next);
}, orderRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/wishlist', apiLimiter, wishlistRoutes);
app.use('/api/profile', apiLimiter, profileRoutes);
app.use('/api/payment', apiLimiter, paymentRoutes);
app.use('/api/gmail', apiLimiter, gmailRoutes);

//  404 handler
app.use((req, res) => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id
  });
  
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    requestId: req.id
  });
});

//  Global error handler
app.use((err, req, res, next) => {
  const errorLog = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.id,
    userId: req.user?._id,
    timestamp: new Date().toISOString()
  };
  if (err.status >= 500 || !err.status) {
    logger.error('Server Error', errorLog);
  } else if (err.status >= 400) {
    logger.warn('Client Error', errorLog);
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message,
      requestId: req.id
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      requestId: req.id
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      requestId: req.id
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      requestId: req.id
    });
  }

  if (err.statusCode === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      requestId: req.id
    });
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    requestId: req.id,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = isProduction ? process.env.RENDER_URL : 'http://localhost:5000';

if (isProduction && baseUrl) {
  cron.schedule('*/14 * * * *', async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/health`, {
        timeout: 10000,
        headers: { 'User-Agent': 'KeepAlive-Cron' }
      });
      logger.info('[KeepAlive] Ping successful', { 
        status: response.data.status,
        uptime: response.data.uptime 
      });
    } catch (error) {
      logger.error('[KeepAlive] Ping failed', { 
        message: error.message 
      });
    }
  });
  
  logger.info('[KeepAlive] Cron job scheduled (every 14 minutes)');
}

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info('='.repeat(50));
  logger.info('🚀 Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    cors: allowedOrigins,
  });
  logger.info('='.repeat(50));
});
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    require('mongoose').connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  setTimeout(() => {
    logger.error('Forcefully shutting down after 10 seconds');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  } else {
    process.exit(1);
  }
});

module.exports = app;