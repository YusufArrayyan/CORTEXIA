const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config/app.config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create transports
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: config.app.env === 'development' ? consoleFormat : logFormat,
  })
);

// File transports (only in production or when LOG_DIR is set)
if (config.app.env === 'production' || config.logging.dir) {
  // Daily rotate file for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(config.logging.dir, 'cortexia-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  );

  // Daily rotate file for error logs
  transports.push(
    new DailyRotateFile({
      level: 'error',
      filename: path.join(config.logging.dir, 'cortexia-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'cortexia-backend' },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'rejections.log'),
    }),
  ],
});

// Stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
