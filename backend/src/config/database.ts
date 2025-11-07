import { PrismaClient } from '@prisma/client';

// Enhanced Prisma client with connection pooling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Connection retry logic
let connectionRetries = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function connectWithRetry(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    connectionRetries = 0; // Reset retry counter on success
  } catch (error: unknown) {
    connectionRetries++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a connection termination error (common with managed databases)
    if ((errorMessage.includes('terminating connection') || 
         errorMessage.includes('E57P01') ||
         errorMessage.includes('connection')) && 
        connectionRetries < MAX_RETRIES) {
      
      console.warn(`⚠️ Database connection failed (attempt ${connectionRetries}/${MAX_RETRIES}), retrying in ${RETRY_DELAY}ms...`);
      setTimeout(() => connectWithRetry(), RETRY_DELAY);
      return;
    }
    
    // For non-retryable errors or after max retries, log but don't exit
    if (connectionRetries >= MAX_RETRIES) {
      console.error('❌ Database connection failed after retries');
      console.warn('⚠️ Server will continue running. Database will reconnect automatically on next query.');
    } else {
      console.error('❌ Database connection failed:', errorMessage);
      console.warn('⚠️ Server will continue running. Database will reconnect automatically on next query.');
    }
  }
}

// Initial connection (non-blocking)
connectWithRetry().catch(() => {
  // Error already handled in connectWithRetry
});

// Graceful shutdown
const shutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    // Ignore disconnect errors during shutdown
  }
};

process.on('beforeExit', shutdown);
process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

export default prisma;

