export type Role = 'OWNER' | 'TENANT';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  ownerId?: string; // multi-tenant scope for owner
  tenantId?: string;
}

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  totalRooms: number;
  totalBeds: number;
  amenities: string[];
  active: boolean;
  rooms?: Room[];
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  roomNumber: string;
  capacity: number;
  occupied: number;
  beds: Bed[];
}

export interface Bed {
  id: string;
  roomId: string;
  name: string;
  occupied: boolean;
  tenantId?: string;
}

export interface TenantProfile {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  phone: string;
  kycId?: string;
  propertyId?: string;
  roomId?: string;
  bedId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  username: string;
  password: string;
}

export interface Invoice {
  id: string;
  ownerId: string;
  tenantId: string;
  month: string;
  amount: number;
  status: 'DUE' | 'PAID' | 'PARTIAL' | 'OVERDUE';
  dueDate: string;
  paidAt?: string;
  // razorpayOrderId?: string; // Commented out - using UPI instead
  upiTransactionId?: string; // UPI transaction ID
  receiptNo?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  // razorpayPaymentId?: string; // Commented out - using UPI instead
  upiTransactionId?: string; // UPI transaction ID
  createdAt: string;
  updatedAt: string;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    property: string;
    room: string;
    bed: string;
  };
}

export interface ElectricitySettings {
  id: string;
  ownerId: string;
  ratePerUnit: number;
  dueDate: number; // day of month
  isEnabled: boolean;
  lateFeePercentage: number;
  minimumUnits: number;
  maximumUnits: number;
  billingCycle: 'MONTHLY' | 'BI_MONTHLY' | 'QUARTERLY';
  createdAt: string;
  updatedAt: string;
}

export interface ElectricityBill {
  id: string;
  ownerId: string;
  tenantId: string;
  month: string;
  previousReading: number;
  currentReading: number;
  units: number;
  ratePerUnit: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  submittedAt: string;
  approvedAt?: string;
  paidAt?: string;
  imageUrl?: string;
  notes?: string;
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    property: string;
    room: string;
    bed: string;
  };
}

export interface MaintenanceTicket {
  id: string;
  ownerId: string;
  tenantId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    property: string;
    room: string;
    bed: string;
  };
}
