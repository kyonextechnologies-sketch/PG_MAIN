import { Request } from 'express';
import { UserRole } from '@prisma/client';

// Extended Request type with user authentication
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Standard API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// JWT Payload
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

// File Upload
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// Email Template Data
export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Query Filters
export interface QueryFilters {
  search?: string;
  status?: string;
  propertyId?: string;
  tenantId?: string;
  ownerId?: string;
  startDate?: Date;
  endDate?: Date;
  [key: string]: any;
}

