'use client';

import dynamic from 'next/dynamic';
import { Loading } from '@/components/common/Loading';

// Lazy load owner pages
export const OwnerDashboard = dynamic(
  () => import('@/app/owner/dashboard/page'),
  {
    loading: () => <Loading text="Loading dashboard..." />,
    ssr: false,
  }
);

export const OwnerProperties = dynamic(
  () => import('@/app/owner/properties/page'),
  {
    loading: () => <Loading text="Loading properties..." />,
    ssr: false,
  }
);

export const OwnerTenants = dynamic(
  () => import('@/app/owner/tenants/page'),
  {
    loading: () => <Loading text="Loading tenants..." />,
    ssr: false,
  }
);

export const OwnerBilling = dynamic(
  () => import('@/app/owner/billing/page'),
  {
    loading: () => <Loading text="Loading billing..." />,
    ssr: false,
  }
);

export const OwnerReports = dynamic(
  () => import('@/app/owner/reports/page'),
  {
    loading: () => <Loading text="Loading reports..." />,
    ssr: false,
  }
);

export const OwnerSettings = dynamic(
  () => import('@/app/owner/settings/page'),
  {
    loading: () => <Loading text="Loading settings..." />,
    ssr: false,
  }
);

// Lazy load tenant pages
export const TenantDashboard = dynamic(
  () => import('@/app/tenant/dashboard/page'),
  {
    loading: () => <Loading text="Loading dashboard..." />,
    ssr: false,
  }
);

export const TenantPayments = dynamic(
  () => import('@/app/tenant/payments/page'),
  {
    loading: () => <Loading text="Loading payments..." />,
    ssr: false,
  }
);

