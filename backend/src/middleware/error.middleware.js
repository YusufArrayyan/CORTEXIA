const logger = require('../utils/logger');
const { error } = require('../utils/response');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, res);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expired', 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return error(res, err.message, 422, err.errors);
  }

  // Mongoose errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return handleMongooseError(err, res);
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    return handleMulterError(err, res);
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return error(res, 'CORS policy violation', 403);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return error(res, message, statusCode, {
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Handle Prisma errors
 */
const handlePrismaError = (err, res) => {
  switch (err.code) {
    case 'P2002':
      return error(res, 'Unique constraint violation', 409, {
        field: err.meta?.target,
      });
    
    case 'P2025':
      return error(res, 'Record not found', 404);
    
    case 'P2003':
      return error(res, 'Foreign key constraint failed', 400, {
        field: err.meta?.field_name,
      });
    
    case 'P2014':
      return error(res, 'Invalid relation', 400);
    
    default:
      logger.error('Unhandled Prisma error:', err);
      return error(res, 'Database error occurred', 500);
  }
};

/**
 * Handle Mongoose errors
 */
const handleMongooseError = (err, res) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return error(res, 'Validation failed', 422, errors);
  }

  if (err.code === 11000) {
    return error(res, 'Duplicate key error', 409, {
      field: Object.keys(err.keyPattern)[0],
    });
  }

  return error(res, 'Database error occurred', 500);
};

/**
 * Handle Multer errors (file upload)
 */
const handleMulterError = (err, res) => {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return error(res, 'File size exceeds limit', 413);
    
    case 'LIMIT_FILE_COUNT':
      return error(res, 'Too many files', 400);
    
    case 'LIMIT_UNEXPECTED_FILE':
      return error(res, 'Unexpected file field', 400);
    
    default:
      return error(res, 'File upload error', 400);
  }
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;
