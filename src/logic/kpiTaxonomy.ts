// src/logic/kpiTaxonomy.ts
// Single source of truth for KPI metadata across STRATFIT
// Locks naming, formatting, and categorization

export interface KPIDefinition {
  key: string; // matches engineResults.kpis keys
  label: string; // investor-grade display name
  category: "executive" | "growth" | "efficiency" | "risk";
  unit: "currency" | "percentage" | "months" | "ratio" | "score";
  higherIsBetter: boolean;
  precision: number; // decimal places
  format: (value: number) => string;
}

// Shared formatting utilities
function formatCurrency(value: number, precision = 1): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(precision)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(precision)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

function formatPercentage(value: number, precision = 1): string {
  return `${value.toFixed(precision)}%`;
}

function formatMonths(value: number): string {
  return `${Math.round(value)} mo`;
}

function formatRatio(value: number, precision = 1): string {
  return `${value.toFixed(precision)}x`;
}

function formatScore(value: number): string {
  return `${Math.round(value)}/100`;
}

// Master KPI registry
export const KPI_DEFS: KPIDefinition[] = [
  // Executive KPIs
  {
    key: "arrCurrent",
    label: "ARR (Run-Rate)",
    category: "executive",
    unit: "currency",
    higherIsBetter: true,
    precision: 1,
    format: (v) => formatCurrency(v, 1),
  },
  {
    key: "arrNext12",
    label: "ARR (12m Forward)",
    category: "executive",
    unit: "currency",
    higherIsBetter: true,
    precision: 1,
    format: (v) => formatCurrency(v, 1),
  },
  {
    key: "runway",
    label: "Runway",
    category: "executive",
    unit: "months",
    higherIsBetter: true,
    precision: 0,
    format: formatMonths,
  },
  {
    key: "burnQuality",
    label: "Burn Rate",
    category: "executive",
    unit: "currency",
    higherIsBetter: false,
    precision: 0,
    format: (v) => formatCurrency(v * 1000, 0),
  },
  {
    key: "enterpriseValue",
    label: "Valuation (Enterprise Value)",
    category: "executive",
    unit: "currency",
    higherIsBetter: true,
    precision: 1,
    format: (v) => formatCurrency(v / 10 * 1_000_000, 1),
  },
  {
    key: "cashPosition",
    label: "Cash Balance",
    category: "executive",
    unit: "currency",
    higherIsBetter: true,
    precision: 1,
    format: (v) => formatCurrency(v * 1_000_000, 1),
  },

  // Growth KPIs
  {
    key: "momentum",
    label: "Momentum Score",
    category: "growth",
    unit: "score",
    higherIsBetter: true,
    precision: 0,
    format: formatScore,
  },
  {
    key: "arrGrowthPct",
    label: "ARR Growth Rate",
    category: "growth",
    unit: "percentage",
    higherIsBetter: true,
    precision: 1,
    format: formatPercentage,
  },
  {
    key: "arrDelta",
    label: "ARR Net New",
    category: "growth",
    unit: "currency",
    higherIsBetter: true,
    precision: 1,
    format: (v) => formatCurrency(v, 1),
  },

  // Efficiency KPIs
  {
    key: "earningsPower",
    label: "Gross Margin",
    category: "efficiency",
    unit: "percentage",
    higherIsBetter: true,
    precision: 1,
    format: formatPercentage,
  },
  {
    key: "cac",
    label: "CAC",
    category: "efficiency",
    unit: "currency",
    higherIsBetter: false,
    precision: 0,
    format: (v) => formatCurrency(v, 0),
  },
  {
    key: "cacPayback",
    label: "CAC Payback",
    category: "efficiency",
    unit: "months",
    higherIsBetter: false,
    precision: 0,
    format: formatMonths,
  },
  {
    key: "ltvCac",
    label: "LTV/CAC",
    category: "efficiency",
    unit: "ratio",
    higherIsBetter: true,
    precision: 1,
    format: formatRatio,
  },

  // Risk KPIs
  {
    key: "riskIndex",
    label: "Risk Score",
    category: "risk",
    unit: "score",
    higherIsBetter: false,
    precision: 0,
    format: formatScore,
  },
  {
    key: "growthStress",
    label: "Growth Stress",
    category: "risk",
    unit: "percentage",
    higherIsBetter: false,
    precision: 1,
    format: formatPercentage,
  },
];

// KPI sets by category
export const KPI_SETS = {
  executive: ["arrCurrent", "arrNext12", "runway", "burnQuality", "enterpriseValue", "cashPosition"],
  growth: ["momentum", "arrGrowthPct", "arrDelta"],
  efficiency: ["earningsPower", "cac", "cacPayback", "ltvCac"],
  risk: ["riskIndex", "growthStress"],
};

// Lookup helpers
export function getKPIDefinition(key: string): KPIDefinition | undefined {
  return KPI_DEFS.find((k) => k.key === key);
}

export function formatKPIValue(key: string, value: number): string {
  const def = getKPIDefinition(key);
  return def ? def.format(value) : String(value);
}

export function getKPIsByCategory(category: keyof typeof KPI_SETS): KPIDefinition[] {
  const keys = KPI_SETS[category];
  return keys.map((k) => getKPIDefinition(k)).filter((d): d is KPIDefinition => d !== undefined);
}

