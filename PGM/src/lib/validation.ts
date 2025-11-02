/**
 * Validation System
 * 
 * Industry-level validation with comprehensive rules,
 * error messages, and type safety
 */

import { z } from 'zod';
import { createValidationError } from './errors';

// Base validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number format');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const positiveNumberSchema = z.number().positive('Value must be positive');
export const nonNegativeNumberSchema = z.number().min(0, 'Value cannot be negative');

// Login and Register schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(8, 'Password confirmation is required'),
  phone: phoneSchema.optional(),
  company: z.string().optional(),
  role: z.enum(['OWNER', 'TENANT']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: emailSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  phone: phoneSchema.optional(),
  role: z.enum(['OWNER', 'TENANT']),
});

// Property validation schemas
export const propertySchema = z.object({
  id: z.string().uuid('Invalid property ID format'),
  ownerId: z.string().uuid('Invalid owner ID format'),
  name: z.string().min(2, 'Property name must be at least 2 characters').max(100, 'Property name too long'),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500, 'Address too long'),
  city: z.string().min(2, 'City must be at least 2 characters').max(50, 'City name too long'),
  totalRooms: positiveNumberSchema,
  totalBeds: positiveNumberSchema,
  amenities: z.array(z.string()).optional(),
  active: z.boolean(),
});

// Electricity validation schemas
export const electricitySettingsSchema = z.object({
  id: z.string().uuid('Invalid settings ID format'),
  ownerId: z.string().uuid('Invalid owner ID format'),
  ratePerUnit: z.number().positive('Rate per unit must be positive').max(100, 'Rate per unit too high'),
  dueDate: z.number().int('Due date must be an integer').min(1, 'Due date must be at least 1').max(31, 'Due date cannot exceed 31'),
  isEnabled: z.boolean(),
  lateFeePercentage: z.number().min(0, 'Late fee cannot be negative').max(50, 'Late fee too high'),
  minimumUnits: z.number().min(0, 'Minimum units cannot be negative'),
  maximumUnits: z.number().min(0, 'Maximum units cannot be negative'),
  billingCycle: z.enum(['MONTHLY', 'BI_MONTHLY', 'QUARTERLY']),
  createdAt: z.string().datetime('Invalid date format'),
  updatedAt: z.string().datetime('Invalid date format'),
}).refine(
  (data) => data.minimumUnits <= data.maximumUnits,
  {
    message: 'Minimum units cannot be greater than maximum units',
    path: ['minimumUnits'],
  }
);

export const electricityBillSchema = z.object({
  id: z.string().uuid('Invalid bill ID format'),
  ownerId: z.string().uuid('Invalid owner ID format'),
  tenantId: z.string().uuid('Invalid tenant ID format'),
  month: z.string().min(1, 'Month is required'),
  previousReading: z.number().min(0, 'Previous reading cannot be negative'),
  currentReading: z.number().min(0, 'Current reading cannot be negative'),
  units: z.number().min(0, 'Units cannot be negative'),
  ratePerUnit: z.number().positive('Rate per unit must be positive'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']),
  submittedAt: z.string().datetime('Invalid date format'),
  approvedAt: z.string().datetime('Invalid date format').optional(),
  paidAt: z.string().datetime('Invalid date format').optional(),
  imageUrl: z.string().url('Invalid image URL format').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
}).refine(
  (data) => data.currentReading >= data.previousReading,
  {
    message: 'Current reading cannot be less than previous reading',
    path: ['currentReading'],
  }
);

// Meter reading validation
export const meterReadingSchema = z.object({
  previousReading: z.number().min(0, 'Previous reading cannot be negative'),
  currentReading: z.number().min(0, 'Current reading cannot be negative'),
}).refine(
  (data) => data.currentReading >= data.previousReading,
  {
    message: 'Current reading cannot be less than previous reading',
    path: ['currentReading'],
  }
).refine(
  (data) => (data.currentReading - data.previousReading) <= 1000,
  {
    message: 'Consumption seems unusually high (over 1000 units)',
    path: ['currentReading'],
  }
);

// File upload validation
export const imageFileSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().optional().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z.array(z.string()).optional().default(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
}).refine(
  (data) => data.file.size <= data.maxSize,
  {
    message: `File size must be less than 10MB`,
    path: ['file'],
  }
).refine(
  (data) => data.allowedTypes.includes(data.file.type),
  {
    message: 'File type not supported. Please upload a valid image file.',
    path: ['file'],
  }
);

// Validation helper functions
export class ValidationHelper {
  /**
   * Validate data against schema with custom error handling
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: string[];
  } {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        return { success: false, errors };
      }
      return { success: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate meter reading with business rules
   */
  static validateMeterReading(previous: number, current: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (previous < 0) {
      errors.push('Previous reading cannot be negative');
    }

    if (current < 0) {
      errors.push('Current reading cannot be negative');
    }

    if (current < previous) {
      errors.push('Current reading cannot be less than previous reading');
    }

    const units = current - previous;
    if (units > 1000) {
      errors.push('Consumption seems unusually high (over 1000 units)');
    }

    if (units < 0) {
      errors.push('Invalid meter reading - consumption cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate electricity settings with business rules
   */
  static validateElectricitySettings(settings: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (settings.ratePerUnit <= 0) {
      errors.push('Rate per unit must be greater than 0');
    }

    if (settings.ratePerUnit > 100) {
      errors.push('Rate per unit seems unusually high');
    }

    if (settings.dueDate < 1 || settings.dueDate > 31) {
      errors.push('Due date must be between 1 and 31');
    }

    if (settings.lateFeePercentage < 0) {
      errors.push('Late fee percentage cannot be negative');
    }

    if (settings.lateFeePercentage > 50) {
      errors.push('Late fee percentage seems unusually high');
    }

    if (settings.minimumUnits < 0) {
      errors.push('Minimum units cannot be negative');
    }

    if (settings.maximumUnits < 0) {
      errors.push('Maximum units cannot be negative');
    }

    if (settings.minimumUnits > settings.maximumUnits) {
      errors.push('Minimum units cannot be greater than maximum units');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize input data
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: File, options?: {
    maxSize?: number;
    allowedTypes?: string[];
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options?.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not supported. Please upload a valid image file.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export validation schemas (already exported above)