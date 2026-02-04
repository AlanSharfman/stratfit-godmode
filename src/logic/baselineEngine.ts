export interface BaselineInput {
  cash: number;
  monthlyBurn: number;
  arr: number;
  monthlyGrowth: number;
  monthlyChurn: number;
  nrr: number;
  headcount: number;
  avgCost: number;
  sm: number;
  rnd: number;
  ga: number;
}

export interface BaselineOutput {
  runwayMonths: number;
  burnMultiple: number;
  monthlyBurn: number;
  survivalProbability: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function calculateBaseline(input: BaselineInput): BaselineOutput {
  const { cash, monthlyBurn, arr, monthlyGrowth, monthlyChurn, nrr, headcount, avgCost, sm, rnd, ga } = input;

  const totalPayroll = (headcount * avgCost) / 12;
  const structuralBurn = totalPayroll + sm + rnd + ga;

  const netBurn = monthlyBurn + structuralBurn;

  const runwayMonths = netBurn > 0 ? cash / netBurn : 0;

  const monthlyRevenue = arr / 12;
  const growthAdjustedRevenue = monthlyRevenue * (1 + monthlyGrowth / 100) * (1 - monthlyChurn / 100);

  const burnMultiple = growthAdjustedRevenue > 0 ? netBurn / growthAdjustedRevenue : 0;

  const stabilityFactor = runwayMonths * 6 + (nrr / 100) * 10 - burnMultiple * 5;

  const survivalProbability = clamp(stabilityFactor, 0, 100);

  return {
    runwayMonths: Number(runwayMonths.toFixed(1)),
    burnMultiple: Number(burnMultiple.toFixed(2)),
    monthlyBurn: Math.round(netBurn),
    survivalProbability: Math.round(survivalProbability),
  };
}


