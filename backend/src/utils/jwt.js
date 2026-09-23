const jwt = require('jsonwebtoken');
const config = require('../config/app.config');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiration,
    issuer: config.app.name,
    jwtid: uuidv4(),
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiration,
    issuer: config.app.name,
    jwtid: uuidv4(),
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokenPair = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Get expiration time from token
 * @param {string} token - JWT token
 * @returns {Date} Expiration date
 */
const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  return decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration < new Date() : true;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
};
