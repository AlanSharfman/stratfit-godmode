// src/onboard/schema.ts
// STRATFIT Onboarding (v1) — typed data model + defaults

export type LiquidationPreference = "None" | "1x" | "1.5x" | "2x+";
export type TriLevel = "Low" | "Medium" | "High";

export type StrategicFocus = "Growth" | "Profitability" | "Stabilise";
export type YesNoUncertain = "Yes" | "No" | "Uncertain";
export type HorizonMonths = 12 | 24 | 36;

export type PrimaryConstraint =
  | "Cash runway"
  | "Debt servicing"
  | "Payroll commitments"
  | "Customer concentration"
  | "Nothing material";

export type FastestDownside =
  | "Revenue volatility"
  | "Fixed cost rigidity"
  | "Capital structure"
  | "Customer churn"
  | "Regulatory exposure";

export interface CompanyProfile {
  legalName: string;
  industry: string;
  businessModel: string;
  primaryMarket: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
}

export interface FinancialBaselineCore {
  arr: string; // currency-ish input, stored as string
  growthRate: string; // %
  grossMargin: string; // %
  revenueConcentration: string; // %
  monthlyBurn: string;
  payroll: string;
  headcount: string;
  cashOnHand: string;
}

export interface FinancialBaselineAdvanced {
  recurringRevenuePercent: string; // %
  seasonality: string; // short controlled descriptor
  fixedCosts: string;
  variableCostPercent: string; // %
  ebitda: string; // %
  operatingMargin: string; // %
  internationalRevenuePercent: string; // %
}

export interface CapitalStructureCore {
  totalDebt: string;
  interestRate: string; // %
  monthlyDebtService: string;
  lastRaiseAmount: string;
  lastRaiseDate: string; // YYYY-MM (or YYYY-MM-DD)
}

export interface CapitalStructureAdvanced {
  convertibleNotes: string;
  preferredEquity: string;
  liquidationPreference: LiquidationPreference;
  founderOwnershipPercent: string; // %
  investorOwnershipPercent: string; // %
  optionPoolPercent: string; // %
}

export interface OperatingDynamicsCore {
  churnPercent: string; // %
  salesCycleMonths: string;
  acv: string;
  keyPersonDependency: TriLevel;
  customerConcentrationRisk: TriLevel;
  regulatoryExposure: TriLevel;
}

export interface OperatingDynamicsAdvanced {
  cac: string;
  ltv: string;
  supplierConcentrationPercent: string; // %
  productComplexity: TriLevel;
  marketExpansionExposure: TriLevel;
}

export interface StrategicPosture {
  focus: StrategicFocus;
  raiseIntent: YesNoUncertain;
  horizon: HorizonMonths;
  primaryConstraint: PrimaryConstraint;
  fastestDownside: FastestDownside;
}

export interface OnboardingData {
  companyProfile: CompanyProfile;
  financialBaselineCore: FinancialBaselineCore;
  financialBaselineAdvanced?: FinancialBaselineAdvanced;
  capitalStructureCore: CapitalStructureCore;
  capitalStructureAdvanced?: CapitalStructureAdvanced;
  operatingDynamicsCore: OperatingDynamicsCore;
  operatingDynamicsAdvanced?: OperatingDynamicsAdvanced;
  strategicPosture: StrategicPosture;
}

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  companyProfile: {
    legalName: "",
    industry: "SaaS",
    businessModel: "Subscription",
    primaryMarket: "North America",
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
  },
  financialBaselineCore: {
    arr: "",
    growthRate: "",
    grossMargin: "",
    revenueConcentration: "",
    monthlyBurn: "",
    payroll: "",
    headcount: "",
    cashOnHand: "",
  },
  financialBaselineAdvanced: {
    recurringRevenuePercent: "",
    seasonality: "None",
    fixedCosts: "",
    variableCostPercent: "",
    ebitda: "",
    operatingMargin: "",
    internationalRevenuePercent: "",
  },
  capitalStructureCore: {
    totalDebt: "",
    interestRate: "",
    monthlyDebtService: "",
    lastRaiseAmount: "",
    lastRaiseDate: "",
  },
  capitalStructureAdvanced: {
    convertibleNotes: "",
    preferredEquity: "",
    liquidationPreference: "None",
    founderOwnershipPercent: "",
    investorOwnershipPercent: "",
    optionPoolPercent: "",
  },
  operatingDynamicsCore: {
    churnPercent: "",
    salesCycleMonths: "",
    acv: "",
    keyPersonDependency: "Medium",
    customerConcentrationRisk: "Medium",
    regulatoryExposure: "Low",
  },
  operatingDynamicsAdvanced: {
    cac: "",
    ltv: "",
    supplierConcentrationPercent: "",
    productComplexity: "Medium",
    marketExpansionExposure: "Medium",
  },
  strategicPosture: {
    focus: "Growth",
    raiseIntent: "Uncertain",
    horizon: 24,
    primaryConstraint: "Cash runway",
    fastestDownside: "Fixed cost rigidity",
  },
};


