import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Loading...</span>
  </div>
);

// Lazy load heavy components
export const LazyElectricityBillsList = lazy(() => 
  import('@/components/electricity/ElectricityBillsList').then(module => ({
    default: module.ElectricityBillsList
  }))
);

export const LazyElectricitySettingsForm = lazy(() => 
  import('@/components/electricity/ElectricitySettingsForm').then(module => ({
    default: module.ElectricitySettingsForm
  }))
);

export const LazyUPIPaymentModal = lazy(() => 
  import('@/components/payments/UPIPaymentModal').then(module => ({
    default: module.UPIPaymentModal
  }))
);

// Wrapper component for lazy loading with Suspense
export const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);


