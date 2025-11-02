import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  // Handle null, undefined, or empty string
  if (!date) {
    return 'N/A';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.warn('Error formatting date:', error, 'Date value:', date);
    return 'N/A';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  // Handle null, undefined, or empty string
  if (!date) {
    return 'N/A';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.warn('Error formatting date:', error, 'Date value:', date);
    return 'N/A';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
    case 'PAID':
    case 'SUCCESS':
    case 'VERIFIED':
    case 'RESOLVED':
      return 'bg-green-100 text-green-800';
    case 'INACTIVE':
    case 'DUE':
    case 'FAILED':
    case 'PENDING':
      return 'bg-red-100 text-red-800';
    case 'PARTIAL':
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    case 'OPEN':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-100 text-red-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'LOW':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function calculateDaysBetween(date1: string | Date | null | undefined, date2: string | Date | null | undefined): number {
  try {
    if (!date1 || !date2) return 0;
    
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.warn('Error calculating days between dates:', error);
    return 0;
  }
}

export function isOverdue(dueDate: string | Date | null | undefined): boolean {
  try {
    if (!dueDate) return false;
    
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    
    if (isNaN(due.getTime())) return false;
    
    return due < new Date();
  } catch (error) {
    console.warn('Error checking if overdue:', error);
    return false;
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
