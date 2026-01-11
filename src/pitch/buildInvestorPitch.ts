// src/pitch/buildInvestorPitch.ts
// STRATFIT — Build Investor Pitch from Engine State

import { InvestorPitch } from "./InvestorPitch";
import { useScenarioStore } from "@/state/scenarioStore";

// Safe accessor for KPI values
function kpiVal(kpis: Record<string, { value: number }> | undefined, key: string): number {
  return kpis?.[key]?.value ?? 0;
}

export function buildInvestorPitch(): InvestorPitch {
  const s = useScenarioStore.getState();
  const scenario = s.scenario;
  const base = s.engineResults?.base?.kpis;
  const sc = s.engineResults?.[scenario]?.kpis;

  // Extract base values with safe defaults
  const baseArr = kpiVal(base, "arrNext12");
  const baseMomentum = kpiVal(base, "momentum");
  const baseBurn = kpiVal(base, "burnQuality");
  const baseRunway = kpiVal(base, "runway");
  const baseValuation = kpiVal(base, "enterpriseValue");
  const baseRisk = kpiVal(base, "riskIndex");
  const baseCac = kpiVal(base, "cac");
  const baseLtvCac = kpiVal(base, "ltvCac");
  const basePayback = kpiVal(base, "cacPayback");
  const baseCacQuality = kpiVal(base, "cacQuality");
  const baseEarningsPower = kpiVal(base, "earningsPower");

  // Extract scenario values with safe defaults
  const scArr = kpiVal(sc, "arrNext12");
  const scMomentum = kpiVal(sc, "momentum");
  const scBurn = kpiVal(sc, "burnQuality");
  const scRunway = kpiVal(sc, "runway");
  const scValuation = kpiVal(sc, "enterpriseValue");
  const scRisk = kpiVal(sc, "riskIndex");
  const scCac = kpiVal(sc, "cac");
  const scLtvCac = kpiVal(sc, "ltvCac");
  const scPayback = kpiVal(sc, "cacPayback");
  const scCacQuality = kpiVal(sc, "cacQuality");
  const scEarningsPower = kpiVal(sc, "earningsPower");

  // Get AI summary if available
  const aiSummary = (s.engineResults?.[scenario] as { ai?: { summary?: string } })?.ai?.summary ?? "";

  return {
    meta: {
      company: "Your Company",
      date: new Date().toLocaleDateString(),
      scenario,
    },

    executiveSummary: aiSummary,

    base: {
      arr: baseArr,
      revenue: baseMomentum,
      burn: baseBurn,
      runway: baseRunway,
      valuation: baseValuation,
      risk: baseRisk,
      cac: baseCac,
      ltv: baseLtvCac * baseCac,
      payback: basePayback,
    },

    scenario: {
      arr: scArr,
      revenue: scMomentum,
      burn: scBurn,
      runway: scRunway,
      valuation: scValuation,
      risk: scRisk,
      cac: scCac,
      ltv: scLtvCac * scCac,
      payback: scPayback,
    },

    growthSpider: [
      { 
        metric: "CAC Quality", 
        base: baseCacQuality, 
        scenario: scCacQuality 
      },
      { 
        metric: "LTV / CAC", 
        base: baseLtvCac * 20, 
        scenario: scLtvCac * 20 
      },
      { 
        metric: "Payback", 
        base: Math.max(0, 100 - basePayback * 4), 
        scenario: Math.max(0, 100 - scPayback * 4) 
      },
      { 
        metric: "Margin", 
        base: baseEarningsPower, 
        scenario: scEarningsPower 
      },
      { 
        metric: "Momentum", 
        base: baseMomentum / 1000, 
        scenario: scMomentum / 1000 
      },
    ],

    mountain: {
      baseImage: "",      // To be captured from canvas
      scenarioImage: "",  // To be captured from canvas
      pathImage: "",      // To be captured from canvas
    },

    recommendations: generateRecommendations(base, sc),
  };
}

// Generate smart recommendations based on scenario comparison
function generateRecommendations(
  base: Record<string, { value: number }> | undefined,
  scenario: Record<string, { value: number }> | undefined
): string[] {
  const recommendations: string[] = [];
  
  if (!base || !scenario) {
    return [
      "Increase pricing power",
      "Improve cost discipline", 
      "Accelerate expansion velocity",
    ];
  }

  const baseLtvCac = kpiVal(base, "ltvCac");
  const scLtvCac = kpiVal(scenario, "ltvCac");
  const basePayback = kpiVal(base, "cacPayback");
  const scPayback = kpiVal(scenario, "cacPayback");
  const baseRunway = kpiVal(base, "runway");
  const scRunway = kpiVal(scenario, "runway");
  const baseRisk = kpiVal(base, "riskIndex");
  const scRisk = kpiVal(scenario, "riskIndex");

  // LTV/CAC improvement
  if (scLtvCac > baseLtvCac) {
    recommendations.push(`LTV/CAC improved from ${baseLtvCac.toFixed(1)}x to ${scLtvCac.toFixed(1)}x — continue optimizing customer economics`);
  } else if (scLtvCac < 3) {
    recommendations.push("Focus on improving LTV/CAC ratio above 3x threshold");
  }

  // Payback optimization
  if (scPayback < basePayback) {
    recommendations.push(`CAC payback shortened from ${Math.round(basePayback)} to ${Math.round(scPayback)} months — capital efficiency improving`);
  } else if (scPayback > 18) {
    recommendations.push("Reduce CAC payback period to under 18 months");
  }

  // Runway management
  if (scRunway > baseRunway) {
    recommendations.push(`Runway extended to ${Math.round(scRunway)} months — financial stability strengthened`);
  } else if (scRunway < 18) {
    recommendations.push("Extend runway above 18 months through cost discipline or fundraising");
  }

  // Risk reduction
  if (scRisk < baseRisk) {
    recommendations.push(`Risk index reduced from ${Math.round(baseRisk)} to ${Math.round(scRisk)} — execution confidence increased`);
  } else if (scRisk > 50) {
    recommendations.push("Reduce risk exposure through diversification and operational improvements");
  }

  // Ensure we have at least 3 recommendations
  if (recommendations.length < 3) {
    const defaults = [
      "Increase pricing power to improve unit economics",
      "Accelerate expansion velocity in proven markets",
      "Optimize cost structure for sustainable growth",
    ];
    while (recommendations.length < 3) {
      recommendations.push(defaults[recommendations.length]);
    }
  }

  return recommendations.slice(0, 5); // Max 5 recommendations
}

