const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./config/database');
// Import models to establish associations
require('./models/index');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/chambres');
const issueRoutes = require('./routes/problematiques');
const taskRoutes = require('./routes/taches');
const expenseRoutes = require('./routes/depenses');
const inventoryRoutes = require('./routes/inventaire');
const affectationRoutes = require('./routes/affectations');
const dashboardRoutes = require('./routes/dashboard');
const fournisseurRoutes = require('./routes/fournisseurs');
const achatRoutes = require('./routes/achats');
const mouvementStockRoutes = require('./routes/mouvements-stock');
const entrepotRoutes = require('./routes/entrepots');
const caisseRoutes = require('./routes/caisses');
const paiementsRoutes = require('./routes/paiements');
const demandesRoutes = require('./routes/demandes');
const demandesAffectationRoutes = require('./routes/demandes-affectation');
const notificationsRoutes = require('./routes/notifications');
const departementRoutes = require('./routes/departements');
const sousDepartementRoutes = require('./routes/sous-departements');
const demandesFondsRoutes = require('./routes/demandes-fonds');
const fichesExecutionRoutes = require('./routes/fiches-execution');
const cycleVieArticlesRoutes = require('./routes/cycle-vie-articles');
const buanderieRoutes = require('./routes/buanderie');
const paiementsPartielsRoutes = require('./routes/paiements-partiels');
const rappelsPaiementRoutes = require('./routes/rappels-paiement');
const resetRoutes = require('./routes/reset');
const employeeRoutes = require('./routes/employees');
const organigrammeRoutes = require('./routes/organigramme');
const bonsMenageRoutes = require('./routes/bons-menage');
const contratsRoutes = require('./routes/contrats');
const documentsRHRoutes = require('./routes/documents-rh');
const offresEmploiRoutes = require('./routes/offres-emploi');
const offresEmploiPublicRoutes = require('./routes/offres-emploi-public');
const dependantsRoutes = require('./routes/dependants');
const sanctionsRoutes = require('./routes/sanctions');
const gratificationsRoutes = require('./routes/gratifications');
const offreNotificationService = require('./services/offreNotificationService');

const app = express();
// Socket.io for realtime notifications
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, {
  cors: {
    origin: ['https://hotelbeatricesys.com', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});
app.set('io', io);

// Initialiser le service de notifications avec Socket.io
offreNotificationService.setSocketIO(io);

const PORT = process.env.PORT || 5002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More requests allowed in development
  message: {
    error: 'Too many requests from this IP',
    message: 'Trop de requêtes depuis cette adresse IP'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// CORS configuration - Production-ready with fallback
app.use(cors({
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      'https://hotelbeatricesys.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // For production, be more strict
    if (process.env.NODE_ENV === 'production') {
      // Only allow hotelbeatricesys.com in production
      if (origin === 'https://hotelbeatricesys.com') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS in production'));
    }
    
    // In development, allow all localhost origins
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'X-File-Name'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// Additional CORS headers for all responses
app.use((req, res, next) => {
  // Determine allowed origin based on request origin and environment
  let allowedOrigin = 'http://localhost:3000'; // default
  
  if (req.headers.origin) {
    if (req.headers.origin === 'https://hotelbeatricesys.com') {
      allowedOrigin = 'https://hotelbeatricesys.com';
    } else if (req.headers.origin.startsWith('http://localhost:')) {
      allowedOrigin = req.headers.origin;
    }
  }
    
  // Debug CORS requests
  console.log(`🌐 CORS Request: ${req.method} ${req.originalUrl}`);
  console.log(`📍 Origin: ${req.headers.origin}`);
  console.log(`🏭 Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Allowed Origin: ${allowedOrigin}`);
    
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-File-Name');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    console.log(`🔄 Preflight request handled for: ${req.originalUrl}`);
    res.status(200).end();
    return;
  }
  next();
});

// Body parsing middleware with increased limits
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 1000
}));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes with error handling
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chambres', roomRoutes);
app.use('/api/problematiques', issueRoutes);
app.use('/api/taches', taskRoutes);
app.use('/api/depenses', expenseRoutes);
app.use('/api/inventaire', inventoryRoutes);
app.use('/api/affectations', affectationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fournisseurs', fournisseurRoutes);
app.use('/api/achats', achatRoutes);
app.use('/api/mouvements-stock', mouvementStockRoutes);
app.use('/api/entrepots', entrepotRoutes);
app.use('/api/caisses', caisseRoutes);
app.use('/api/paiements', paiementsRoutes);
app.use('/api/demandes', demandesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/demandes-affectation', demandesAffectationRoutes);
app.use('/api/departements', departementRoutes);
app.use('/api/sous-departements', sousDepartementRoutes);
app.use('/api/demandes-fonds', demandesFondsRoutes);
app.use('/api/fiches-execution', fichesExecutionRoutes);
app.use('/api/cycle-vie-articles', cycleVieArticlesRoutes);
app.use('/api/buanderie', buanderieRoutes);
app.use('/api/paiements-partiels', paiementsPartielsRoutes);
app.use('/api/rappels-paiement', rappelsPaiementRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/organigramme', organigrammeRoutes);
app.use('/api/bons-menage', bonsMenageRoutes);
app.use('/api/contrats', contratsRoutes);
app.use('/api/documents-rh', documentsRHRoutes);
app.use('/api/offres-emploi', offresEmploiRoutes);
app.use('/api/offres-emploi/public', offresEmploiPublicRoutes);
app.use('/api/dependants', dependantsRoutes);
app.use('/api/sanctions', sanctionsRoutes);
app.use('/api/gratifications', gratificationsRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    res.json({ 
      status: 'OK', 
      message: 'Hôtel Beatrice Management System is running',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      uptime: process.uptime(),
      cors: {
        origin: req.headers.origin || 'No origin',
        environment: process.env.NODE_ENV || 'development',
        allowedOrigins: ['https://hotelbeatricesys.com', 'http://localhost:3000', 'http://localhost:3001']
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message
    });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    cors: {
      requestOrigin: req.headers.origin || 'No origin',
      environment: process.env.NODE_ENV || 'development',
      allowedOrigins: ['https://hotelbeatricesys.com', 'http://localhost:3000', 'http://localhost:3001'],
      isAllowed: ['https://hotelbeatricesys.com', 'http://localhost:3000', 'http://localhost:3001'].includes(req.headers.origin)
    }
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Erreur de validation des données',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'Cette entrée existe déjà',
      field: err.errors[0]?.path
    });
  }

  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      error: 'Database Connection Error',
      message: 'Erreur de connexion à la base de données'
    });
  }

  // Handle timeout errors
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
    return res.status(408).json({
      error: 'Request Timeout',
      message: 'La requête a pris trop de temps'
    });
  }

  // Default error response
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('🛑 Received shutdown signal, closing server gracefully...');
  
  try {
    // Close database connection
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

// Database connection and server start
async function startServer() {
  try {
    // Test database connection with retry
    let retries = 5;
    while (retries > 0) {
      try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        break;
      } catch (error) {
        retries--;
        console.log(`❌ Database connection failed, retrying... (${retries} attempts left)`);
        if (retries === 0) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
    
    // Configure database connection pool
    sequelize.connectionManager.config.pool = {
      max: 20, // Maximum number of connections
      min: 5,  // Minimum number of connections
      acquire: 60000, // Maximum time to acquire connection
      idle: 10000, // Maximum time connection can be idle
      evict: 1000, // How often to run eviction checks
      handleDisconnects: true
    };
    
    console.log('✅ Database connection ready with connection pooling.');
    
    const server = http.listen(PORT, () => {
      console.log(`🚀 Hôtel Beatrice Management System running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💾 Database: ${sequelize.getDatabaseName()}`);
      console.log(`👥 Max connections: ${sequelize.connectionManager.config.pool.max}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`❌ Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Handle connection errors
    server.on('connection', (socket) => {
      socket.setTimeout(30000); // 30 seconds timeout
    });

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer(); 