const { forbidden } = require('../utils/response');

/**
 * Role-based authorization middleware
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Authentication required');
    }
    
    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
    
    if (!roles.includes(req.user.role)) {
      return forbidden(res, 'Insufficient permissions');
    }
    
    next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return forbidden(res, 'Admin access required');
  }
  next();
};

/**
 * Check if user is teacher
 */
const isTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== 'guru') {
    return forbidden(res, 'Teacher access required');
  }
  next();
};

/**
 * Check if user is student
 */
const isStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'siswa') {
    return forbidden(res, 'Student access required');
  }
  next();
};

/**
 * Check if user is parent
 */
const isParent = (req, res, next) => {
  if (!req.user || req.user.role !== 'orang_tua') {
    return forbidden(res, 'Parent access required');
  }
  next();
};

/**
 * Check if user can access resource
 * Used for checking if user can access their own data or their children's data
 */
const canAccessResource = (req, res, next) => {
  const resourceUserId = req.params.userId || req.params.siswaId;
  
  // Admin can access everything
  if (req.user.role === 'admin') {
    return next();
  }
  
  // User accessing their own resource
  if (req.user.id === resourceUserId) {
    return next();
  }
  
  // Teacher can access their students
  if (req.user.role === 'guru') {
    // Check if student belongs to teacher
    // This will be implemented in the controller
    return next();
  }
  
  // Parent can access their children
  if (req.user.role === 'orang_tua') {
    // Check if student is child of parent
    // This will be implemented in the controller
    return next();
  }
  
  return forbidden(res, 'Cannot access this resource');
};

module.exports = {
  authorize,
  isAdmin,
  isTeacher,
  isStudent,
  isParent,
  canAccessResource,
};
