export interface ExecutiveExportPayload {
  summary: string;
  metrics: Record<string, number>;
  risk: {
    survivalProbability: number;
    volatilityIndex: number;
  };
  valuation: {
    enterpriseValue: number;
  };
  timestamp: string;
}

export function buildExecutiveExport(input: {
  summary: string;
  survival: number;
  volatility: number;
  valuation: number;
  metrics: Record<string, number>;
}): ExecutiveExportPayload {
  return {
    summary: input.summary,
    metrics: input.metrics,
    risk: {
      survivalProbability: input.survival,
      volatilityIndex: input.volatility,
    },
    valuation: {
      enterpriseValue: input.valuation,
    },
    timestamp: new Date().toISOString(),
  };
}
