export const APP_NAME = 'Smart PG Manager';
export const APP_DESCRIPTION = 'A comprehensive PG management system for owners and tenants';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  OWNER_DASHBOARD: '/owner/dashboard',
  TENANT_DASHBOARD: '/tenant/dashboard',
  OWNER_PROPERTIES: '/owner/properties',
  OWNER_TENANTS: '/owner/tenants',
  OWNER_BILLING: '/owner/billing',
  OWNER_REPORTS: '/owner/reports',
  OWNER_SETTINGS: '/owner/settings',
  TENANT_PAYMENTS: '/tenant/payments',
  TENANT_REQUESTS: '/tenant/requests',
  TENANT_PROFILE: '/tenant/profile',
} as const;

export const USER_ROLES = {
  OWNER: 'OWNER',
  TENANT: 'TENANT',
} as const;

export const INVOICE_STATUS = {
  DUE: 'DUE',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
} as const;

export const PAYMENT_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
} as const;

export const MAINTENANCE_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
