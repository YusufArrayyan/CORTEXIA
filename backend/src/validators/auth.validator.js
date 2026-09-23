const { body } = require('express-validator');

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .trim(),
  
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(['siswa', 'guru', 'orang_tua', 'admin'])
    .withMessage('Invalid role'),
  
  body('profile')
    .isObject()
    .withMessage('Profile data is required'),
  
  body('profile.namaLengkap')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Full name must be between 3 and 255 characters')
    .trim(),
];

/**
 * Validation rules for student registration profile
 */
const studentProfileValidation = [
  body('profile.tanggalLahir')
    .isDate()
    .withMessage('Valid date of birth is required'),
  
  body('profile.jenisKelamin')
    .optional()
    .isIn(['Laki-laki', 'Perempuan'])
    .withMessage('Gender must be either Laki-laki or Perempuan'),
  
  body('profile.kelas')
    .optional()
    .trim(),
  
  body('profile.sekolah')
    .optional()
    .trim(),
  
  body('profile.nomorInduk')
    .optional()
    .trim(),
];

/**
 * Validation rules for teacher registration profile
 */
const teacherProfileValidation = [
  body('profile.nip')
    .optional()
    .trim(),
  
  body('profile.mataPelajaran')
    .optional()
    .trim(),
  
  body('profile.sekolah')
    .optional()
    .trim(),
  
  body('profile.spesialisasi')
    .optional()
    .trim(),
];

/**
 * Validation rules for parent registration profile
 */
const parentProfileValidation = [
  body('profile.hubunganDenganAnak')
    .optional()
    .isIn(['ayah', 'ibu', 'wali'])
    .withMessage('Relationship must be ayah, ibu, or wali'),
  
  body('profile.pekerjaan')
    .optional()
    .trim(),
];

/**
 * Validation rules for login
 */
const loginValidation = [
  body('emailOrUsername')
    .notEmpty()
    .withMessage('Email or username is required')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation rules for refresh token
 */
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),
];

/**
 * Validation rules for change password
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('newPassword')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];

/**
 * Validation rules for forgot password
 */
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .trim(),
];

/**
 * Validation rules for reset password
 */
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

/**
 * Validation rules for check availability
 */
const checkAvailabilityValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
];

module.exports = {
  registerValidation,
  studentProfileValidation,
  teacherProfileValidation,
  parentProfileValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  checkAvailabilityValidation,
};
