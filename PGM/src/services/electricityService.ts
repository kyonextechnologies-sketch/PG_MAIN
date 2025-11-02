/**
 * Electricity Service
 * 
 * Industry-level service for electricity bill management
 * Handles all business logic, validation, and data operations
 */

import { ElectricitySettings, ElectricityBill } from '@/lib/types';
import { electricityCalculationService } from '@/lib/electricityCalculation';
import { imageProcessingService } from '@/lib/imageProcessing';

export interface ElectricityServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ElectricityServiceError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class ElectricityService {
  private static instance: ElectricityService;
  private settings: ElectricitySettings | null = null;
  private bills: ElectricityBill[] = [];

  private constructor() {}

  public static getInstance(): ElectricityService {
    if (!ElectricityService.instance) {
      ElectricityService.instance = new ElectricityService();
    }
    return ElectricityService.instance;
  }

  /**
   * Initialize electricity settings
   */
  async initializeSettings(ownerId: string): Promise<ElectricityServiceResponse<ElectricitySettings>> {
    try {
      // In production, this would fetch from database
      const defaultSettings: ElectricitySettings = {
        id: `settings-${ownerId}`,
        ownerId,
        ratePerUnit: 8.5,
        dueDate: 28,
        isEnabled: true,
        lateFeePercentage: 2,
        minimumUnits: 0,
        maximumUnits: 1000,
        billingCycle: 'MONTHLY',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.settings = defaultSettings;
      
      return {
        success: true,
        data: defaultSettings,
        message: 'Electricity settings initialized successfully'
      };
    } catch (error) {
      return this.handleError('INITIALIZATION_FAILED', 'Failed to initialize electricity settings', error);
    }
  }

  /**
   * Update electricity settings with validation
   */
  async updateSettings(
    settings: Partial<ElectricitySettings>
  ): Promise<ElectricityServiceResponse<ElectricitySettings>> {
    try {
      if (!this.settings) {
        return this.handleError('SETTINGS_NOT_FOUND', 'Electricity settings not initialized');
      }

      // Validate settings
      const validation = electricityCalculationService.validateSettings(settings);
      if (!validation.isValid) {
        return this.handleError('VALIDATION_FAILED', 'Invalid settings', { errors: validation.errors });
      }

      // Update settings
      const updatedSettings = {
        ...this.settings,
        ...settings,
        updatedAt: new Date().toISOString(),
      };

      this.settings = updatedSettings;

      return {
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully'
      };
    } catch (error) {
      return this.handleError('UPDATE_FAILED', 'Failed to update settings', error);
    }
  }

  /**
   * Process meter reading image with OCR
   */
  async processMeterReading(
    imageFile: File,
    options?: { enablePreprocessing?: boolean; confidenceThreshold?: number }
  ): Promise<ElectricityServiceResponse<{ reading: number; confidence: number }>> {
    try {
      const result = await imageProcessingService.extractMeterReading(imageFile, options);
      
      if (!result.success) {
        return this.handleError('OCR_FAILED', result.error || 'Failed to extract meter reading');
      }

      return {
        success: true,
        data: {
          reading: result.reading!,
          confidence: result.confidence || 0.9
        },
        message: 'Meter reading extracted successfully'
      };
    } catch (error) {
      return this.handleError('PROCESSING_FAILED', 'Failed to process meter reading', error);
    }
  }

  /**
   * Submit electricity bill with validation
   */
  async submitBill(
    billData: {
      tenantId: string;
      month: string;
      previousReading: number;
      currentReading: number;
      imageUrl?: string;
    }
  ): Promise<ElectricityServiceResponse<ElectricityBill>> {
    try {
      if (!this.settings) {
        return this.handleError('SETTINGS_NOT_FOUND', 'Electricity settings not initialized');
      }

      // Validate readings
      const isValid = electricityCalculationService.validateSettings({
        ratePerUnit: this.settings.ratePerUnit,
        dueDate: this.settings.dueDate,
        isEnabled: this.settings.isEnabled
      });

      if (!isValid) {
        return this.handleError('INVALID_READINGS', 'Invalid meter readings provided');
      }

      // Calculate bill
      const calculation = electricityCalculationService.calculateBill(
        billData.previousReading,
        billData.currentReading,
        this.settings.ratePerUnit,
        this.settings
      );

      if (!calculation.isValid) {
        return this.handleError('CALCULATION_FAILED', 'Invalid bill calculation', { errors: calculation.errors });
      }

      // Create bill
      const bill: ElectricityBill = {
        id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ownerId: this.settings.ownerId,
        tenantId: billData.tenantId,
        month: billData.month,
        previousReading: billData.previousReading,
        currentReading: billData.currentReading,
        units: calculation.units,
        ratePerUnit: this.settings.ratePerUnit,
        amount: calculation.amount,
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        imageUrl: billData.imageUrl,
      };

      this.bills.push(bill);

      return {
        success: true,
        data: bill,
        message: 'Electricity bill submitted successfully'
      };
    } catch (error) {
      return this.handleError('SUBMISSION_FAILED', 'Failed to submit electricity bill', error);
    }
  }

  /**
   * Approve electricity bill
   */
  async approveBill(billId: string): Promise<ElectricityServiceResponse<ElectricityBill>> {
    try {
      const bill = this.bills.find(b => b.id === billId);
      
      if (!bill) {
        return this.handleError('BILL_NOT_FOUND', 'Electricity bill not found');
      }

      if (bill.status !== 'PENDING') {
        return this.handleError('INVALID_STATUS', 'Bill is not in pending status');
      }

      bill.status = 'APPROVED';
      bill.approvedAt = new Date().toISOString();

      return {
        success: true,
        data: bill,
        message: 'Electricity bill approved successfully'
      };
    } catch (error) {
      return this.handleError('APPROVAL_FAILED', 'Failed to approve electricity bill', error);
    }
  }

  /**
   * Reject electricity bill
   */
  async rejectBill(billId: string, reason?: string): Promise<ElectricityServiceResponse<ElectricityBill>> {
    try {
      const bill = this.bills.find(b => b.id === billId);
      
      if (!bill) {
        return this.handleError('BILL_NOT_FOUND', 'Electricity bill not found');
      }

      if (bill.status !== 'PENDING') {
        return this.handleError('INVALID_STATUS', 'Bill is not in pending status');
      }

      bill.status = 'REJECTED';
      bill.notes = reason;

      return {
        success: true,
        data: bill,
        message: 'Electricity bill rejected'
      };
    } catch (error) {
      return this.handleError('REJECTION_FAILED', 'Failed to reject electricity bill', error);
    }
  }

  /**
   * Get electricity statistics
   */
  async getStatistics(): Promise<ElectricityServiceResponse<{
    totalBills: number;
    pendingBills: number;
    approvedBills: number;
    rejectedBills: number;
    totalAmount: number;
    averageBill: number;
  }>> {
    try {
      const stats = {
        totalBills: this.bills.length,
        pendingBills: this.bills.filter(b => b.status === 'PENDING').length,
        approvedBills: this.bills.filter(b => b.status === 'APPROVED').length,
        rejectedBills: this.bills.filter(b => b.status === 'REJECTED').length,
        totalAmount: this.bills.reduce((sum, bill) => sum + bill.amount, 0),
        averageBill: this.bills.length > 0 ? this.bills.reduce((sum, bill) => sum + bill.amount, 0) / this.bills.length : 0,
      };

      return {
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully'
      };
    } catch (error) {
      return this.handleError('STATS_FAILED', 'Failed to retrieve statistics', error);
    }
  }

  /**
   * Get bills with filtering and pagination
   */
  async getBills(options?: {
    status?: string;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ElectricityServiceResponse<ElectricityBill[]>> {
    try {
      let filteredBills = [...this.bills];

      if (options?.status) {
        filteredBills = filteredBills.filter(bill => bill.status === options.status);
      }

      if (options?.tenantId) {
        filteredBills = filteredBills.filter(bill => bill.tenantId === options.tenantId);
      }

      if (options?.offset) {
        filteredBills = filteredBills.slice(options.offset);
      }

      if (options?.limit) {
        filteredBills = filteredBills.slice(0, options.limit);
      }

      return {
        success: true,
        data: filteredBills,
        message: 'Bills retrieved successfully'
      };
    } catch (error) {
      return this.handleError('FETCH_FAILED', 'Failed to retrieve bills', error);
    }
  }

  /**
   * Error handling utility
   */
  private handleError(
    code: string,
    message: string,
    details?: any
  ): ElectricityServiceResponse<never> {
    console.error(`[ElectricityService] ${code}: ${message}`, details);
    
    return {
      success: false,
      error: message,
    };
  }
}

// Export singleton instance
export const electricityService = ElectricityService.getInstance();

