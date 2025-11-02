/**
 * Tenant Data Isolation Utility
 * 
 * Ensures proper data isolation for tenants at the frontend level
 * - Filters data based on current user's session
 * - Prevents unauthorized data access
 * - Works with backend data isolation (headers: X-User-ID, X-User-Role)
 */

import { Session } from "next-auth";

/**
 * Validate that a piece of data belongs to the current tenant
 * @param userId - ID from session
 * @param dataOwnerId - Owner/tenant ID of the data
 * @returns boolean indicating if data is accessible
 */
export function isTenantDataAccessible(userId: string | undefined, dataOwnerId: string): boolean {
  if (!userId) return false;
  return userId === dataOwnerId;
}

/**
 * Filter array of data by tenant ID
 * @param data - Array of data items
 * @param userId - Current user's ID from session
 * @param tenantIdField - Field name that contains tenant/owner ID (default: 'tenantId')
 * @returns Filtered data array
 */
export function filterTenantData<T extends Record<string, any>>(
  data: T[],
  userId: string | undefined,
  tenantIdField: string = 'tenantId'
): T[] {
  if (!userId) return [];
  return data.filter(item => item[tenantIdField] === userId);
}

/**
 * Ensure data belongs to current tenant
 * @param data - Single data item
 * @param userId - Current user's ID from session
 * @param tenantIdField - Field name that contains tenant/owner ID
 * @returns Data if accessible, null otherwise
 */
export function ensureTenantDataAccess<T extends Record<string, any>>(
  data: T | null | undefined,
  userId: string | undefined,
  tenantIdField: string = 'tenantId'
): T | null {
  if (!data || !userId) return null;
  if (data[tenantIdField] !== userId) return null;
  return data;
}

/**
 * Get tenant ID from session
 * @param session - NextAuth session
 * @returns Tenant ID or undefined
 */
export function getTenantIdFromSession(session: Session | null): string | undefined {
  return session?.user?.id;
}

/**
 * Validate session exists and has required fields
 * @param session - NextAuth session
 * @returns boolean indicating if session is valid for data access
 */
export function isSessionValid(session: Session | null): boolean {
  return !!(session?.user?.id && session?.user?.email);
}

/**
 * Create API headers for authenticated requests with data isolation
 * @param session - NextAuth session
 * @returns Object with headers for API requests
 */
export function createTenantIsolationHeaders(session: Session | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.user?.id) {
    headers['X-User-ID'] = session.user.id;
  }

  if (session?.user?.role) {
    headers['X-User-Role'] = session.user.role;
  }

  return headers;
}

/**
 * Validate API response contains only user's data
 * @param response - API response data
 * @param userId - Current user's ID
 * @param ownerId Field in response - default: 'tenantId'
 * @returns Data if valid, throws error otherwise
 */
export function validateTenantDataResponse<T extends Record<string, any>>(
  response: T | T[],
  userId: string | undefined,
  ownerField: string = 'tenantId'
): T | T[] {
  if (!userId) {
    throw new Error('No user session found');
  }

  if (Array.isArray(response)) {
    // Validate all items in array belong to user
    const invalidItems = response.filter(item => item[ownerField] !== userId);
    if (invalidItems.length > 0) {
      console.warn('🚨 Data isolation violation detected!', {
        invalidCount: invalidItems.length,
        userId,
        expectedOwnerField: ownerField,
      });
      // Filter out invalid items instead of throwing
      return response.filter(item => item[ownerField] === userId);
    }
  } else {
    // Single item validation
    if (response[ownerField] !== userId) {
      throw new Error('Data access denied: Resource does not belong to current user');
    }
  }

  return response;
}
