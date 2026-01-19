// lib/freemium/plans.ts
export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface PlanFeatures {
  name: string;
  price: number;
  features: {
    mountainView: boolean;
    sliderAdjustments: number | 'unlimited';
    scenarios: ('base' | 'upside' | 'downside')[];
    aiVerdict: boolean;
    pdfExport: boolean;
    excelExport: boolean;
    scenarioComparison: boolean;
    whiteLabelReports: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    multiUser: number;
    support: 'email' | 'priority' | 'dedicated';
  };
}

export const PLANS: Record<PlanTier, PlanFeatures> = {
  free: {
    name: 'Free Trial',
    price: 0,
    features: {
      mountainView: true,
      sliderAdjustments: 3, // per day
      scenarios: ['base'],
      aiVerdict: true,
      pdfExport: false,
      excelExport: false,
      scenarioComparison: false,
      whiteLabelReports: false,
      apiAccess: false,
      customBranding: false,
      multiUser: 1,
      support: 'email'
    }
  },
  pro: {
    name: 'Professional',
    price: 79,
    features: {
      mountainView: true,
      sliderAdjustments: 'unlimited',
      scenarios: ['base', 'upside', 'downside'],
      aiVerdict: true,
      pdfExport: true,
      excelExport: true,
      scenarioComparison: true,
      whiteLabelReports: false,
      apiAccess: false,
      customBranding: false,
      multiUser: 1,
      support: 'email'
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    features: {
      mountainView: true,
      sliderAdjustments: 'unlimited',
      scenarios: ['base', 'upside', 'downside'],
      aiVerdict: true,
      pdfExport: true,
      excelExport: true,
      scenarioComparison: true,
      whiteLabelReports: true,
      apiAccess: true,
      customBranding: true,
      multiUser: 5,
      support: 'dedicated'
    }
  }
};

// Hook to check feature access
export function useFeatureAccess() {
  // TODO: Get actual user tier from database/auth
  const userTier: PlanTier = 'free'; // Replace with actual user tier
  
  const plan = PLANS[userTier];
  
  return {
    tier: userTier,
    plan,
    canAccess: (feature: keyof PlanFeatures['features']) => {
      return plan.features[feature];
    },
    upgradeRequired: (feature: keyof PlanFeatures['features']) => {
      return !plan.features[feature];
    }
  };
}
