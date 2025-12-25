const morgan = require('morgan');
const logger = require('../config/logger');

//  Custom Morgan tokens
morgan.token('id', (req) => req.id);
morgan.token('body', (req) => {
  // Don't log sensitive data
  const body = { ...req.body };
  if (body.password) body.password = '***REDACTED***';
  if (body.token) body.token = '***REDACTED***';
  return JSON.stringify(body);
});

//  Custom format with more details
const format = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
  : ':method :url :status :response-time ms - :res[content-length]';

//  Skip logging for health checks in production
const skip = (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return req.url === '/api/health';
  }
  return false;
};

const morganMiddleware = morgan(format, {
  stream: logger.stream,
  skip,
});

module.exports = morganMiddleware;