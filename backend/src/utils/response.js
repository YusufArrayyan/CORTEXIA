/**
 * Standard API Response Handler
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Error details
 */
const error = (res, message = 'Error occurred', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors
 */
const validationError = (res, errors) => {
  return res.status(422).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors,
    },
  });
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 */
const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message,
    },
  });
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
const unauthorized = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  });
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
const forbidden = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message,
    },
  });
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
};

/**
 * Created response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
const created = (res, data, message = 'Resource created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

/**
 * No content response
 * @param {Object} res - Express response object
 */
const noContent = (res) => {
  return res.status(204).send();
};

module.exports = {
  success,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  paginated,
  created,
  noContent,
};
