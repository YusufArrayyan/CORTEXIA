const { verifyAccessToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');
const { prisma } = require('../config/database.config');
const logger = require('../utils/logger');

/**
 * Authenticate user middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        siswa: true,
        guru: true,
        orangTua: true,
        admin: true,
      },
    });
    
    if (!user) {
      return unauthorized(res, 'User not found');
    }
    
    if (user.status !== 'active') {
      return unauthorized(res, 'Account is not active');
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return unauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
      },
    });
    
    if (user && user.status === 'active') {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
