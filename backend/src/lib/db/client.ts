/**
 * Database Client with Read-Replica Support
 * 
 * Abstracts database access to support read-replica routing.
 * Reads go to replica (if available), writes go to primary.
 */

import { PrismaClient } from '@prisma/client';

// Primary database connection (for writes)
const primaryPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Read replica connection (for reads, if available)
let replicaPrisma: PrismaClient | null = null;

if (process.env.DATABASE_READ_URL) {
  try {
    replicaPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_READ_URL,
        },
      },
    });

    // Test replica connection
    replicaPrisma.$connect()
      .then(() => {
        console.log('✅ Read replica connected');
      })
      .catch((error) => {
        console.warn('⚠️  Read replica connection failed, using primary for reads:', error.message);
        replicaPrisma = null;
      });
  } catch (error) {
    console.warn('⚠️  Read replica initialization failed, using primary for reads');
    replicaPrisma = null;
  }
} else {
  console.log('ℹ️  DATABASE_READ_URL not set, using primary for all operations');
}

/**
 * Get database client for read operations
 * Uses replica if available, falls back to primary
 */
export function getReadClient(): PrismaClient {
  return replicaPrisma || primaryPrisma;
}

/**
 * Get database client for write operations
 * Always uses primary
 */
export function getWriteClient(): PrismaClient {
  return primaryPrisma;
}

/**
 * Execute read operation (uses replica if available)
 */
export async function read<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const client = getReadClient();
  try {
    return await operation(client);
  } catch (error) {
    // If replica fails, retry with primary
    if (replicaPrisma && client === replicaPrisma) {
      console.warn('⚠️  Read replica failed, retrying with primary');
      return await operation(primaryPrisma);
    }
    throw error;
  }
}

/**
 * Execute write operation (always uses primary)
 */
export async function write<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  return await operation(primaryPrisma);
}

/**
 * Execute transaction (always uses primary)
 */
export async function transaction<T>(
  operation: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return await primaryPrisma.$transaction(operation);
}

// Export clients for direct access if needed
export const dbRead = getReadClient();
export const dbWrite = getWriteClient();

// Default export (primary for backward compatibility)
export default primaryPrisma;

