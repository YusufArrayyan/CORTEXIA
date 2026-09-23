require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const bodyParser = require('body-parser');

// Configuration
const config = require('./config/app.config');
const logger = require('./utils/logger');
const { 
  prisma, 
  connectMongoDB, 
  connectRedis, 
  testConnections 
} = require('./config/database.config');

// Middleware
const errorHandler = require('./middleware/error.middleware');
const { notFound } = require('./utils/response');

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: config.cors.allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: config.websocket.pingTimeout,
  pingInterval: config.websocket.pingInterval,
});

// Make io accessible to routes
app.set('io', io);

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (config.cors.allowedOrigins.indexOf(origin) !== -1 || config.app.env === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsers
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
if (config.app.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnections();
    
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.app.env,
      database: dbStatus ? 'connected' : 'disconnected',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// API version info
app.get('/', (req, res) => {
  res.json({
    name: config.app.name,
    version: '1.0.0',
    description: 'CORTEXIA Backend API - Multimodal AI-Based Reading Difficulty Profiling',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs',
    },
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/teacher', require('./routes/teacher.routes'));
app.use('/api/parent', require('./routes/parent.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/assessments', require('./routes/assessment.routes'));
app.use('/api/analysis', require('./routes/analysis.routes'));
app.use('/api/profiles', require('./routes/profile.routes'));
app.use('/api/recommendations', require('./routes/recommendation.routes'));
app.use('/api/materials', require('./routes/material.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  // Authentication
  socket.on('authenticate', async (data) => {
    try {
      // Verify JWT token
      const { token } = data;
      // Add authentication logic here
      
      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('authentication_error', { message: error.message });
      socket.disconnect();
    }
  });
  
  // Assessment events
  socket.on('assessment:start', (data) => {
    logger.info(`Assessment started: ${data.assessmentId}`);
    socket.join(`assessment:${data.assessmentId}`);
  });
  
  socket.on('gaze:data', (data) => {
    // Handle real-time gaze data
    io.to(`assessment:${data.assessmentId}`).emit('gaze:update', data);
  });
  
  socket.on('speech:start', (data) => {
    logger.info(`Speech recording started: ${data.assessmentId}`);
  });
  
  socket.on('speech:stop', (data) => {
    logger.info(`Speech recording stopped: ${data.assessmentId}`);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use((req, res) => {
  notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
});

// Global error handler
app.use(errorHandler);

// Initialize databases and start server
const startServer = async () => {
  try {
    logger.info('Starting CORTEXIA Backend Server...');
    
    // Connect to databases
    logger.info('Connecting to databases...');
    await connectMongoDB();
    await connectRedis();
    await prisma.$connect();
    
    // Test connections
    const dbConnected = await testConnections();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Start server
    const PORT = config.app.port;
    server.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${config.app.env}`);
      logger.info(`✓ API URL: ${config.app.url}`);
      logger.info(`✓ WebSocket enabled`);
      
      if (config.app.env === 'development') {
        logger.info(`✓ API Documentation: ${config.app.url}/api/docs`);
      }
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

module.exports = { app, server, io };
