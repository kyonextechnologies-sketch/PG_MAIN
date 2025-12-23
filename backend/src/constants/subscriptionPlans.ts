export type BillingPeriod = 'MONTH' | 'QUARTER';

export interface FeatureFlags {
  basicReports: boolean;
  advancedReports: boolean;
  advancedAnalytics: boolean;
  autoBilling: boolean;
  prioritySupport: boolean;
  priority24x7: boolean;
  customIntegrations: boolean;
}

export interface SubscriptionPlan {
  code: 'BASIC_M' | 'STANDARD_M' | 'PREMIUM_M' | 'BASIC_Q' | 'STANDARD_Q' | 'PREMIUM_Q';
  name: string;
  billingPeriod: BillingPeriod;
  priceInPaise: number;
  maxProperties: number | null;
  maxTenants: number | null;
  features: FeatureFlags;
}

const BASE_FEATURES: FeatureFlags = {
  basicReports: false,
  advancedReports: false,
  advancedAnalytics: false,
  autoBilling: false,
  prioritySupport: false,
  priority24x7: false,
  customIntegrations: false,
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    code: 'BASIC_M',
    name: 'Basic - Monthly',
    billingPeriod: 'MONTH',
    priceInPaise: 49900, // ₹499 per month
    maxProperties: 1,
    maxTenants: 20,
    features: {
      ...BASE_FEATURES,
      basicReports: true,
    },
  },
  {
    code: 'STANDARD_M',
    name: 'Standard - Monthly',
    billingPeriod: 'MONTH',
    priceInPaise: 99900, // ₹999 per month
    maxProperties: 10,
    maxTenants: 150, // Interpreted upper-bound of provided 100-150 range
    features: {
      ...BASE_FEATURES,
      basicReports: true,
      advancedReports: true,
      autoBilling: true,
      prioritySupport: true,
    },
  },
  {
    code: 'PREMIUM_M',
    name: 'Premium - Monthly',
    billingPeriod: 'MONTH',
    priceInPaise: 199900, // ₹1999 per month
    maxProperties: null, // unlimited
    maxTenants: null, // unlimited
    features: {
      ...BASE_FEATURES,
      basicReports: true,
      advancedReports: true,
      advancedAnalytics: true,
      autoBilling: true,
      prioritySupport: true,
      priority24x7: true,
      customIntegrations: true,
    },
  },
  {
    code: 'BASIC_Q',
    name: 'Basic - Quarterly (Save 17%)',
    billingPeriod: 'QUARTER',
    priceInPaise: 499000, // ₹4990 per quarter
    maxProperties: 1,
    maxTenants: 20,
    features: {
      ...BASE_FEATURES,
      basicReports: true,
    },
  },
  {
    code: 'STANDARD_Q',
    name: 'Standard - Quarterly (Save 17%)',
    billingPeriod: 'QUARTER',
    priceInPaise: 999000, // ₹9990 per quarter
    maxProperties: 10,
    maxTenants: 150, // Interpreted upper-bound of provided 100-150 range
    features: {
      ...BASE_FEATURES,
      basicReports: true,
      advancedReports: true,
      autoBilling: true,
      prioritySupport: true,
    },
  },
  {
    code: 'PREMIUM_Q',
    name: 'Premium - Quarterly (Save 17%)',
    billingPeriod: 'QUARTER',
    priceInPaise: 1999000, // ₹19990 per quarter
    maxProperties: null, // unlimited
    maxTenants: null, // unlimited
    features: {
      ...BASE_FEATURES,
      basicReports: true,
      advancedReports: true,
      advancedAnalytics: true,
      autoBilling: true,
      prioritySupport: true,
      priority24x7: true,
      customIntegrations: true,
    },
  },
];

export type SubscriptionPlanCode = (typeof SUBSCRIPTION_PLANS)[number]['code'];

export const SUBSCRIPTION_PLANS_BY_CODE: Record<SubscriptionPlanCode, SubscriptionPlan> =
  SUBSCRIPTION_PLANS.reduce((acc, plan) => {
    acc[plan.code] = plan;
    return acc;
  }, {} as Record<SubscriptionPlanCode, SubscriptionPlan>);

/**
 * Converts a persisted limit to a runtime numeric limit.
 * Use Infinity in business logic where null (unlimited) is stored in DB.
 */
export function resolveRuntimeLimit(value: number | null): number {
  return value === null ? Infinity : value;
}

