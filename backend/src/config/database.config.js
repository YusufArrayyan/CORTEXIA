const { PrismaClient } = require('@prisma/client');
const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('../utils/logger');

// Prisma Client (PostgreSQL)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: 'pretty',
});

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/cortexia_analytics';
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    logger.info('MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

// Redis Client
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const client = redis.createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis reconnection attempts exhausted');
          return new Error('Redis connection failed');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });
  
  client.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });
  
  client.on('connect', () => {
    logger.info('Redis connected successfully');
  });
  
  client.on('reconnecting', () => {
    logger.warn('Redis reconnecting...');
  });
  
  return client;
};

const redisClient = createRedisClient();

// Connect Redis
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

// Test Database Connections
const testConnections = async () => {
  try {
    // Test Prisma/PostgreSQL
    await prisma.$connect();
    logger.info('✓ PostgreSQL connection successful');
    
    // Test MongoDB
    if (mongoose.connection.readyState === 1) {
      logger.info('✓ MongoDB connection successful');
    }
    
    // Test Redis
    if (redisClient.isOpen) {
      await redisClient.ping();
      logger.info('✓ Redis connection successful');
    }
    
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
};

// Graceful Shutdown
const gracefulShutdown = async () => {
  logger.info('Closing database connections...');
  
  try {
    await prisma.$disconnect();
    logger.info('PostgreSQL disconnected');
    
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
    
    await redisClient.quit();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});

module.exports = {
  prisma,
  mongoose,
  redisClient,
  connectMongoDB,
  connectRedis,
  testConnections,
  gracefulShutdown,
};
