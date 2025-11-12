/**
 * Zod validation schemas for forms
 * Centralized validation logic for type safety and consistency
 */

import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Please enter a valid email address');
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['OWNER', 'TENANT']),
  phone: phoneSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Profile schemas
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().optional(),
});

// Property schemas
export const propertySchema = z.object({
  name: z.string().min(2, 'Property name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  totalBeds: z.number().min(1, 'Total beds must be at least 1'),
  amenities: z.array(z.string()).optional(),
});

// Tenant schemas
export const tenantSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: emailSchema,
  phone: phoneSchema,
  propertyId: z.string().min(1, 'Property is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  rentAmount: z.number().min(0, 'Rent amount must be positive'),
  moveInDate: z.string().min(1, 'Move-in date is required'),
});

// Invoice schemas
export const invoiceSchema = z.object({
  tenantId: z.string().min(1, 'Tenant is required'),
  month: z.string().min(1, 'Month is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  dueDate: z.string().min(1, 'Due date is required'),
});

// Maintenance ticket schemas
export const maintenanceTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  category: z.string().min(1, 'Category is required'),
});

// Payment settings schema
export const paymentSettingsSchema = z.object({
  upiId: z.string().regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, 'Please enter a valid UPI ID'),
  upiName: z.string().min(2, 'UPI name is required'),
  autoGenerateInvoices: z.boolean(),
  invoiceReminderDays: z.number().min(1).max(30),
  lateFeePercentage: z.number().min(0).max(50),
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type TenantFormData = z.infer<typeof tenantSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type MaintenanceTicketFormData = z.infer<typeof maintenanceTicketSchema>;
export type PaymentSettingsFormData = z.infer<typeof paymentSettingsSchema>;

