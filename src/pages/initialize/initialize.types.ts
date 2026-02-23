export type RiskProfile = "conservative" | "balanced" | "aggressive";

export interface BaselineInputs {
  revenue: number;
  growthRate: number;
  grossMargin: number;
  burnRate: number;
  cash: number;
  runwayMonths: number;
  debt: number;

  hiringPlan: number;
  pricingChange: number;
  marketingIntensity: number;
  capexPlan: number;
  costDiscipline: number;

  timeHorizonMonths: number;
  riskProfile: RiskProfile;
}
