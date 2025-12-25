const rateLimit = require('express-rate-limit');

//  General API rate limit
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, 
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/health' || req.user?.role === 'ADMIN';
  }
});

//  Admin endpoints 
exports.adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, 
  message: { error: 'Too many admin requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

//  Auth endpoints
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

//  Upload rate limit
exports.uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50, 
  message: { error: 'Upload limit exceeded, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

//  Read-only endpoints 
exports.readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

//  User-specific rate limiter 
exports.dynamicLimiter = (req, res, next) => {
  const limits = {
    ADMIN: 500,
    USER: 200,
    GUEST: 100
  };

  const userRole = req.user?.role || 'GUEST';
  const maxRequests = limits[userRole];

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID for authenticated users, IP for guests
      return req.user?._id?.toString() || req.ip;
    }
  });

  return limiter(req, res, next);
};