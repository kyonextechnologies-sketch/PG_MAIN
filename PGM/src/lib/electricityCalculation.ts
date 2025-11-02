/**
 * Electricity Bill Calculation Service
 * 
 * This service handles electricity bill calculations, integration with rent,
 * and billing logic for the PG management system.
 */

import { ElectricitySettings, ElectricityBill, Invoice } from '@/lib/types';

export interface BillCalculationResult {
  units: number;
  amount: number;
  ratePerUnit: number;
  previousReading: number;
  currentReading: number;
  isValid: boolean;
  errors: string[];
}

export interface RentIntegrationResult {
  totalRent: number;
  electricityAmount: number;
  finalAmount: number;
  breakdown: {
    baseRent: number;
    electricity: number;
    lateFees?: number;
    otherCharges?: number;
  };
}

class ElectricityCalculationService {
  /**
   * Calculate electricity bill amount
   */
  calculateBill(
    previousReading: number,
    currentReading: number,
    ratePerUnit: number,
    settings?: ElectricitySettings
  ): BillCalculationResult {
    const errors: string[] = [];
    let isValid = true;

    // Validate readings
    if (previousReading < 0) {
      errors.push('Previous reading cannot be negative');
      isValid = false;
    }

    if (currentReading < 0) {
      errors.push('Current reading cannot be negative');
      isValid = false;
    }

    if (currentReading < previousReading) {
      errors.push('Current reading cannot be less than previous reading');
      isValid = false;
    }

    const units = currentReading - previousReading;

    // Check minimum and maximum units if settings are provided
    if (settings) {
      if (units < settings.minimumUnits) {
        errors.push(`Units consumed (${units}) is below minimum threshold (${settings.minimumUnits})`);
        isValid = false;
      }

      if (units > settings.maximumUnits) {
        errors.push(`Units consumed (${units}) exceeds maximum threshold (${settings.maximumUnits})`);
        isValid = false;
      }
    }

    // Check for unusually high consumption
    if (units > 500) {
      errors.push('Warning: Unusually high consumption detected');
    }

    const amount = units * ratePerUnit;

    return {
      units,
      amount,
      ratePerUnit,
      previousReading,
      currentReading,
      isValid,
      errors
    };
  }

  /**
   * Calculate late fees for overdue electricity bills
   */
  calculateLateFees(
    billAmount: number,
    dueDate: string,
    lateFeePercentage: number
  ): number {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (today <= due) {
      return 0; // Not overdue
    }

    const daysOverdue = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const lateFeeAmount = (billAmount * lateFeePercentage) / 100;
    
    // Cap late fees at 50% of bill amount
    const maxLateFee = billAmount * 0.5;
    return Math.min(lateFeeAmount * daysOverdue, maxLateFee);
  }

  /**
   * Integrate electricity bill with rent
   */
  integrateWithRent(
    baseRent: number,
    electricityBill: ElectricityBill,
    settings?: ElectricitySettings
  ): RentIntegrationResult {
    const breakdown = {
      baseRent,
      electricity: electricityBill.amount,
      lateFees: 0,
      otherCharges: 0
    };

    // Calculate late fees if applicable
    if (settings && electricityBill.status === 'APPROVED') {
      const dueDate = this.calculateDueDate(settings.dueDate);
      const lateFees = this.calculateLateFees(
        electricityBill.amount,
        dueDate,
        settings.lateFeePercentage
      );
      breakdown.lateFees = lateFees;
    }

    const finalAmount = breakdown.baseRent + breakdown.electricity + breakdown.lateFees + breakdown.otherCharges;

    return {
      totalRent: baseRent,
      electricityAmount: electricityBill.amount,
      finalAmount,
      breakdown
    };
  }

  /**
   * Calculate due date for electricity bill
   */
  private calculateDueDate(dueDayOfMonth: number): string {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Create due date for current month
    const dueDate = new Date(currentYear, currentMonth, dueDayOfMonth);
    
    // If due date has passed this month, use next month
    if (dueDate < today) {
      dueDate.setMonth(currentMonth + 1);
    }
    
    return dueDate.toISOString().split('T')[0];
  }

  /**
   * Generate electricity bill invoice
   */
  generateElectricityInvoice(
    electricityBill: ElectricityBill,
    baseRent: number,
    settings?: ElectricitySettings
  ): Invoice {
    const integration = this.integrateWithRent(baseRent, electricityBill, settings);
    const dueDate = settings ? this.calculateDueDate(settings.dueDate) : new Date().toISOString().split('T')[0];

    return {
      id: `invoice-${Date.now()}`,
      ownerId: electricityBill.ownerId,
      tenantId: electricityBill.tenantId,
      month: electricityBill.month,
      amount: integration.finalAmount,
      status: 'DUE',
      dueDate,
      receiptNo: `EL-${electricityBill.id}`
    };
  }

  /**
   * Validate electricity settings
   */
  validateSettings(settings: Partial<ElectricitySettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.ratePerUnit !== undefined && settings.ratePerUnit <= 0) {
      errors.push('Rate per unit must be greater than 0');
    }

    if (settings.dueDate !== undefined && (settings.dueDate < 1 || settings.dueDate > 31)) {
      errors.push('Due date must be between 1 and 31');
    }

    if (settings.lateFeePercentage !== undefined && settings.lateFeePercentage < 0) {
      errors.push('Late fee percentage cannot be negative');
    }

    if (settings.minimumUnits !== undefined && settings.minimumUnits < 0) {
      errors.push('Minimum units cannot be negative');
    }

    if (settings.maximumUnits !== undefined && settings.maximumUnits < 0) {
      errors.push('Maximum units cannot be negative');
    }

    if (settings.minimumUnits !== undefined && settings.maximumUnits !== undefined && 
        settings.minimumUnits > settings.maximumUnits) {
      errors.push('Minimum units cannot be greater than maximum units');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get electricity consumption statistics
   */
  getConsumptionStats(bills: ElectricityBill[]): {
    totalUnits: number;
    averageUnits: number;
    totalAmount: number;
    averageAmount: number;
    highestConsumption: number;
    lowestConsumption: number;
  } {
    if (bills.length === 0) {
      return {
        totalUnits: 0,
        averageUnits: 0,
        totalAmount: 0,
        averageAmount: 0,
        highestConsumption: 0,
        lowestConsumption: 0
      };
    }

    const approvedBills = bills.filter(bill => bill.status === 'APPROVED');
    const units = approvedBills.map(bill => bill.units);
    const amounts = approvedBills.map(bill => bill.amount);

    return {
      totalUnits: units.reduce((sum, unit) => sum + unit, 0),
      averageUnits: units.reduce((sum, unit) => sum + unit, 0) / units.length,
      totalAmount: amounts.reduce((sum, amount) => sum + amount, 0),
      averageAmount: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
      highestConsumption: Math.max(...units),
      lowestConsumption: Math.min(...units)
    };
  }

  /**
   * Predict next month's bill based on historical data
   */
  predictNextBill(
    bills: ElectricityBill[],
    currentReading: number,
    ratePerUnit: number
  ): { predictedUnits: number; predictedAmount: number; confidence: number } {
    if (bills.length < 3) {
      return {
        predictedUnits: 0,
        predictedAmount: 0,
        confidence: 0
      };
    }

    const recentBills = bills
      .filter(bill => bill.status === 'APPROVED')
      .slice(-6) // Last 6 months
      .map(bill => bill.units);

    const averageUnits = recentBills.reduce((sum, units) => sum + units, 0) / recentBills.length;
    const variance = recentBills.reduce((sum, units) => sum + Math.pow(units - averageUnits, 2), 0) / recentBills.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Confidence based on consistency (lower variance = higher confidence)
    const confidence = Math.max(0, 1 - (standardDeviation / averageUnits));

    return {
      predictedUnits: Math.round(averageUnits),
      predictedAmount: Math.round(averageUnits * ratePerUnit),
      confidence: Math.min(confidence, 0.95) // Cap at 95%
    };
  }
}

// Export singleton instance
export const electricityCalculationService = new ElectricityCalculationService();
export default electricityCalculationService;

