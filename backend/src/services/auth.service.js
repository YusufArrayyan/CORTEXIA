const bcrypt = require('bcrypt');
const { prisma } = require('../config/database.config');
const { generateTokenPair } = require('../utils/jwt');
const config = require('../config/app.config');
const logger = require('../utils/logger');

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Object} Created user and tokens
 */
const register = async (userData) => {
  const { email, username, password, role, profile } = userData;

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error('Email already registered');
    }
    if (existingUser.username === username) {
      throw new Error('Username already taken');
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

  // Create user with profile in transaction
  const user = await prisma.$transaction(async (tx) => {
    // Create base user
    const newUser = await tx.user.create({
      data: {
        email,
        username,
        passwordHash,
        role,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });

    // Create role-specific profile
    switch (role) {
      case 'siswa':
        await tx.siswa.create({
          data: {
            userId: newUser.id,
            namaLengkap: profile.namaLengkap,
            tanggalLahir: new Date(profile.tanggalLahir),
            jenisKelamin: profile.jenisKelamin,
            kelas: profile.kelas,
            sekolah: profile.sekolah,
            nomorInduk: profile.nomorInduk,
            alamat: profile.alamat,
            nomorTelepon: profile.nomorTelepon,
            orangTuaId: profile.orangTuaId,
            guruId: profile.guruId,
          }
        });
        break;

      case 'guru':
        await tx.guru.create({
          data: {
            userId: newUser.id,
            namaLengkap: profile.namaLengkap,
            nip: profile.nip,
            mataPelajaran: profile.mataPelajaran,
            sekolah: profile.sekolah,
            nomorTelepon: profile.nomorTelepon,
            spesialisasi: profile.spesialisasi,
          }
        });
        break;

      case 'orang_tua':
        await tx.orangTua.create({
          data: {
            userId: newUser.id,
            namaLengkap: profile.namaLengkap,
            hubunganDenganAnak: profile.hubunganDenganAnak,
            nomorTelepon: profile.nomorTelepon,
            pekerjaan: profile.pekerjaan,
            alamat: profile.alamat,
          }
        });
        break;

      case 'admin':
        await tx.admin.create({
          data: {
            userId: newUser.id,
            namaLengkap: profile.namaLengkap,
            level: profile.level || 'admin',
            permissions: profile.permissions || {},
          }
        });
        break;

      default:
        throw new Error('Invalid role');
    }

    return newUser;
  });

  // Generate tokens
  const tokens = generateTokenPair(user);

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    }
  });

  // Log registration
  logger.info(`New user registered: ${user.email} (${user.role})`);

  return {
    user,
    tokens,
  };
};

/**
 * Login user
 * @param {string} emailOrUsername - Email or username
 * @param {string} password - Password
 * @returns {Object} User and tokens
 */
const login = async (emailOrUsername, password) => {
  // Find user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    },
    include: {
      siswa: true,
      guru: true,
      orangTua: true,
      admin: true,
    }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if account is active
  if (user.status !== 'active') {
    throw new Error('Account is not active');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const tokens = generateTokenPair(user);

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    }
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  // Remove sensitive data
  delete user.passwordHash;

  // Log login
  logger.info(`User logged in: ${user.email}`);

  return {
    user,
    tokens,
  };
};

/**
 * Logout user
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token to invalidate
 */
const logout = async (userId, refreshToken) => {
  // Delete refresh token
  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      token: refreshToken,
    }
  });

  logger.info(`User logged out: ${userId}`);
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New tokens
 */
const refreshAccessToken = async (refreshToken) => {
  // Find refresh token in database
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      expiresAt: {
        gt: new Date() // Not expired
      }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
        }
      }
    }
  });

  if (!storedToken) {
    throw new Error('Invalid or expired refresh token');
  }

  if (storedToken.user.status !== 'active') {
    throw new Error('Account is not active');
  }

  // Generate new token pair
  const tokens = generateTokenPair(storedToken.user);

  // Delete old refresh token
  await prisma.refreshToken.delete({
    where: { id: storedToken.id }
  });

  // Store new refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: storedToken.user.id,
      token: tokens.refreshToken,
      expiresAt,
    }
  });

  logger.info(`Token refreshed for user: ${storedToken.user.email}`);

  return tokens;
};

/**
 * Change password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash }
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });

  logger.info(`Password changed for user: ${user.email}`);
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {string} Reset token
 */
const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if email exists
    logger.warn(`Password reset requested for non-existent email: ${email}`);
    return null;
  }

  // Generate reset token (simplified - in production use crypto.randomBytes)
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  const resetTokenHash = await bcrypt.hash(resetToken, 10);

  // Store reset token (would need a separate table in production)
  // For now, we'll use a temporary solution
  
  logger.info(`Password reset requested for: ${email}`);

  return resetToken;
};

/**
 * Verify email
 * @param {string} userId - User ID
 */
const verifyEmail = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true }
  });

  logger.info(`Email verified for user: ${userId}`);
};

/**
 * Get user profile with role-specific data
 * @param {string} userId - User ID
 * @returns {Object} User profile
 */
const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      siswa: true,
      guru: true,
      orangTua: true,
      admin: true,
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Remove sensitive data
  delete user.passwordHash;

  return user;
};

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  changePassword,
  requestPasswordReset,
  verifyEmail,
  getUserProfile,
};
