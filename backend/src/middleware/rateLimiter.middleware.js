const rateLimit = require('express-rate-limit');
const { redisClient } = require('../config/database.config');
const logger = require('../utils/logger');

/**
 * Redis store for rate limiting
 */
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.expiry = options.expiry || 60;
  }

  async increment(key) {
    const redisKey = this.prefix + key;
    const current = await redisClient.incr(redisKey);
    
    if (current === 1) {
      await redisClient.expire(redisKey, this.expiry);
    }
    
    return {
      totalHits: current,
      resetTime: new Date(Date.now() + this.expiry * 1000),
    };
  }

  async decrement(key) {
    const redisKey = this.prefix + key;
    await redisClient.decr(redisKey);
  }

  async resetKey(key) {
    const redisKey = this.prefix + key;
    await redisClient.del(redisKey);
  }
}

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user && req.user.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      emailOrUsername: req.body.emailOrUsername || req.body.email,
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again after 15 minutes',
      },
    });
  },
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: {
      code: 'REGISTRATION_LIMIT_EXCEEDED',
      message: 'Too many registration attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
      username: req.body.username,
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'REGISTRATION_LIMIT_EXCEEDED',
        message: 'Too many registration attempts from this IP',
      },
    });
  },
});

/**
 * Password reset rate limiter
 * 3 requests per hour
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_LIMIT_EXCEEDED',
      message: 'Too many password reset requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_LIMIT_EXCEEDED',
        message: 'Too many password reset requests',
      },
    });
  },
});

/**
 * Upload rate limiter
 * 10 uploads per minute
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many file uploads, please slow down',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Create custom rate limiter
 */
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

module.exports = {
  apiLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  uploadLimiter,
  createRateLimiter,
};
