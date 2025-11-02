import { PaginationParams, PaginatedResponse } from '../types';

// Generate pagination response
export const generatePaginatedResponse = <T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> => {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message: 'Data fetched successfully',
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// Generate receipt number
export const generateReceiptNumber = (month: string): string => {
  const [year, monthNum] = month.split('-');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `RCP-${year}${monthNum}-${random}`;
};

// Calculate late fees
export const calculateLateFees = (
  amount: number,
  dueDate: Date,
  lateFeePercentage: number
): number => {
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 0) {
    return 0;
  }

  const lateFee = (amount * lateFeePercentage) / 100;
  const maxLateFee = amount * 0.5; // Cap at 50% of base amount

  return Math.min(lateFee, maxLateFee);
};

// Format date to YYYY-MM
export const formatMonthYear = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Get due date for month
export const getDueDateForMonth = (month: string, dueDay: number): Date => {
  const [year, monthNum] = month.split('-');
  return new Date(parseInt(year), parseInt(monthNum), dueDay);
};

// Validate Indian phone number
export const isValidIndianPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

// Get days between dates
export const getDaysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if date is in past
export const isPastDate = (date: Date): boolean => {
  return date < new Date();
};

// Check if date is in future
export const isFutureDate = (date: Date): boolean => {
  return date > new Date();
};

// Round to 2 decimal places
export const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Calculate electricity bill amount
export const calculateElectricityAmount = (
  currentReading: number,
  previousReading: number,
  ratePerUnit: number
): { units: number; amount: number } => {
  const units = roundToTwo(currentReading - previousReading);
  const amount = roundToTwo(units * ratePerUnit);

  return { units, amount };
};

