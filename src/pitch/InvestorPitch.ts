// src/pitch/InvestorPitch.ts
// STRATFIT — Investor Pitch Data Structure
// Complete pitch deck object for export/rendering

export interface InvestorPitch {
  meta: {
    company: string;
    date: string;
    scenario: string;
  };

  executiveSummary: string;

  base: {
    arr: number;
    revenue: number;
    burn: number;
    runway: number;
    valuation: number;
    risk: number;
    cac: number;
    ltv: number;
    payback: number;
  };

  scenario: {
    arr: number;
    revenue: number;
    burn: number;
    runway: number;
    valuation: number;
    risk: number;
    cac: number;
    ltv: number;
    payback: number;
  };

  growthSpider: {
    metric: string;
    base: number;
    scenario: number;
  }[];

  mountain: {
    baseImage: string;     // base64
    scenarioImage: string;
    pathImage: string;
  };

  recommendations: string[];
}

