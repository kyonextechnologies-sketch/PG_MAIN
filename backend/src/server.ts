import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import routes from './routes';
import { rateLimiter } from './middleware/rateLimiter';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import path from 'path';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ✅ Trust proxy for Render and other reverse proxies
// This is required for rate limiting and IP detection behind proxies
app.set('trust proxy', true);

// ✅ CORS Configuration
// Parse allowed origins from environment variable (comma-separated) or use defaults
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.CORS_ORIGIN;
  if (envOrigins) {
    // Split by comma and trim whitespace
    return envOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
  }
  // Default origins for development and production
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
  ];
};

const allowedOrigins = getAllowedOrigins();

// Helper function to check if origin is allowed
const isOriginAllowed = (origin: string | undefined): boolean => {
  // Allow requests with no origin (like mobile apps, Postman, curl, etc.)
  if (!origin) {
    console.log('✅ CORS: Allowing request with no origin');
    return true;
  }
  
  // Log the origin being checked
  console.log(`🔍 CORS: Checking origin: "${origin}"`);
  console.log(`📋 CORS: Allowed origins: [${allowedOrigins.join(', ')}]`);
  
  // Check if origin is in allowed list (exact match)
  if (allowedOrigins.includes(origin)) {
    console.log(`✅ CORS: Origin "${origin}" is allowed`);
    return true;
  }
  
  // Check for Vercel patterns (more flexible matching)
  const isVercelOrigin = origin.includes('.vercel.app') || origin.includes('vercel.app');
  if (isVercelOrigin && allowedOrigins.some(allowed => allowed.includes('vercel.app'))) {
    console.log(`✅ CORS: Allowing Vercel origin "${origin}"`);
    return true;
  }
  
  // In development, allow all origins for easier testing
  if (process.env.NODE_ENV === 'development') {
    console.warn(`⚠️  CORS: Allowing origin "${origin}" in development mode`);
    return true;
  }
  
  // In production, be more lenient if CORS_ORIGIN is not set
  if (allowedOrigins.length === 3 && allowedOrigins.every(o => o.includes('localhost'))) {
    console.warn(`⚠️  CORS: CORS_ORIGIN not set in production, allowing origin "${origin}"`);
    return true;
  }
  
  console.warn(`🚫 CORS: Blocked origin "${origin}". Allowed origins: [${allowedOrigins.join(', ')}]`);
  return false;
};

// CORS configuration with safe error handling
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    try {
      const allowed = isOriginAllowed(origin);
      callback(null, allowed);
    } catch (error) {
      // Never throw errors in CORS callback - always call callback
      console.error('CORS origin check error:', error);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-User-ID',
    'X-User-Role',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours - cache preflight requests
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
  preflightContinue: false, // End preflight request immediately
};

// ✅ Handle OPTIONS preflight requests FIRST (before any other middleware)
// This must be before body parsing, rate limiting, and other middleware
app.options('*', (req: Request, res: Response) => {
  const origin = req.headers.origin;
  
  console.log(`🔍 OPTIONS preflight request from origin: "${origin}"`);
  console.log(`📋 Request headers:`, {
    origin: req.headers.origin,
    'access-control-request-method': req.headers['access-control-request-method'],
    'access-control-request-headers': req.headers['access-control-request-headers'],
  });
  
  // Check if origin is allowed
  const allowed = isOriginAllowed(origin);
  
  if (allowed) {
    // Set CORS headers manually for OPTIONS
    const allowOrigin = origin || '*';
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-ID, X-User-Role, Accept, Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    console.log(`✅ OPTIONS: Allowed origin "${allowOrigin}"`);
    res.status(200).end();
  } else {
    // Log the rejection but still send some CORS headers
    console.error(`❌ OPTIONS: Rejected origin "${origin}"`);
    console.error(`📋 Allowed origins: [${allowedOrigins.join(', ')}]`);
    
    // Don't set Access-Control-Allow-Origin for rejected origins
    // This will cause browser to show CORS error (which is correct)
    res.status(403).json({
      success: false,
      message: `CORS: Origin "${origin}" not allowed. Allowed origins: ${allowedOrigins.join(', ')}`,
      allowedOrigins: allowedOrigins,
    });
  }
});

// Security middleware - Configure Helmet to not interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// Apply CORS middleware for all other requests
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware (OPTIONS requests are handled before this)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging
app.use(requestLogger);

// Rate limiting (applied after OPTIONS handling)
app.use(rateLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'API is running',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes - All routes are mounted under /api/v1
// Routes are organized in src/routes/index.ts:
// - /api/v1/auth - Authentication routes
// - /api/v1/properties - Property management routes
// - /api/v1/rooms - Room and bed management routes
// - /api/v1/tenants - Tenant management routes
// - /api/v1/electricity - Electricity bill management routes
// - /api/v1/invoices - Invoice management routes
// - /api/v1/payments - Payment processing routes
// - /api/v1/maintenance - Maintenance ticket routes
// - /api/v1/reports - Reports and analytics routes
// - /api/v1/upload - File upload routes
app.use(`/api/${API_VERSION}`, routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Configuration:`);
  console.log(`   - Allowed Origins: [${allowedOrigins.join(', ')}]`);
  console.log(`   - CORS_ORIGIN env: ${process.env.CORS_ORIGIN || 'NOT SET'}`);
  console.log(`   - Credentials: enabled`);
  console.log(`   - Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`);
});

export default app;

