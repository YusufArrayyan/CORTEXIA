require('dotenv').config();

const config = {
  // Application
  app: {
    name: process.env.APP_NAME || 'CORTEXIA',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    url: process.env.APP_URL || 'http://localhost:5000',
  },
  
  // Database
  database: {
    url: process.env.DATABASE_URL,
    mongodb: {
      url: process.env.MONGODB_URL || 'mongodb://localhost:27017/cortexia_analytics',
      dbName: process.env.MONGODB_DB_NAME || 'cortexia_analytics',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || null,
    },
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  },
  
  // File Upload
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'audio/wav,audio/mp3,audio/mpeg,image/jpeg,image/png').split(','),
  },
  
  // AI Service
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.AI_SERVICE_API_KEY || '',
  },
  
  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    },
    from: process.env.SMTP_FROM || 'noreply@cortexia.id',
  },
  
  // Storage
  storage: {
    type: process.env.STORAGE_TYPE || 'local', // 'local' or 's3'
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'ap-southeast-1',
      bucket: process.env.AWS_S3_BUCKET || 'cortexia-uploads',
    },
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
  },
  
  // WebSocket
  websocket: {
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT, 10) || 60000,
    pingInterval: parseInt(process.env.WS_PING_INTERVAL, 10) || 25000,
  },
  
  // Assessment Settings
  assessment: {
    minCalibrationAccuracy: parseFloat(process.env.MIN_CALIBRATION_ACCURACY) || 75.0,
    timeoutMinutes: parseInt(process.env.ASSESSMENT_TIMEOUT_MINUTES, 10) || 30,
    gazeSamplingRateMs: parseInt(process.env.GAZE_SAMPLING_RATE_MS, 10) || 100,
  },
  
  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
  },
};

// Validation
const validateConfig = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate in production
if (config.app.env === 'production') {
  validateConfig();
}

module.exports = config;
