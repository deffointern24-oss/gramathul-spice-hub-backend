const { v4: uuidv4 } = require('uuid');

//  Add unique ID to each request for tracking
const requestIdMiddleware = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};

module.exports = requestIdMiddleware;
