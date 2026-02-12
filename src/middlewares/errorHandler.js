// src/middlewares/errorHandler.js
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  let { statusCode = 500, message = 'Something went wrong' } = err;

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = `File too large. Max size: ${process.env.MAX_FILE_SIZE || '100MB'}`;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  // Log error
  logger.error(`${statusCode} - ${message}`, err);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};