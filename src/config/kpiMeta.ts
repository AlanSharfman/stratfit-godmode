// src/config/kpiMeta.ts
// KPI Metadata — Single Source of Truth
// Defines all KPI keys, display properties, and formatting rules

export type KPIKey =
  | "runway"
  | "cashPosition"
  | "momentum"
  | "burnQuality"
  | "riskIndex"
  | "earningsPower"
  | "enterpriseValue";

export interface KPIMetadata {
  key: KPIKey;
  label: string;
  unit: string;
  format: (value: number) => string;
  color: string;
  description: string;
  higherIsBetter: boolean;
  operatorOnly?: boolean;
}

export const KPI_META: Record<KPIKey, KPIMetadata> = {
  runway: {
    key: "runway",
    label: "RUNWAY",
    unit: "mo",
    format: (v) => `${Math.round(v)} mo`,
    color: "#00d4ff",
    description: "Operating runway based on current burn rate",
    higherIsBetter: true,
  },
  cashPosition: {
    key: "cashPosition",
    label: "CASH",
    unit: "M",
    format: (v) => `$${(v / 100).toFixed(1)}M`,
    color: "#00ffcc",
    description: "Current cash reserves",
    higherIsBetter: true,
  },
  momentum: {
    key: "momentum",
    label: "MOMENTUM",
    unit: "M",
    format: (v) => `$${(v / 10).toFixed(1)}M`,
    color: "#00ff88",
    description: "Revenue growth momentum",
    higherIsBetter: true,
  },
  burnQuality: {
    key: "burnQuality",
    label: "BURN RATE",
    unit: "K/mo",
    format: (v) => `$${Math.round(v)}K`,
    color: "#ff6b6b",
    description: "Monthly cash burn rate",
    higherIsBetter: false,
    operatorOnly: true,
  },
  riskIndex: {
    key: "riskIndex",
    label: "RISK SCORE",
    unit: "/100",
    format: (v) => `${Math.round(v)}/100`,
    color: "#00ccff",
    description: "Aggregate risk profile",
    higherIsBetter: false,
  },
  earningsPower: {
    key: "earningsPower",
    label: "EARNINGS POWER",
    unit: "%",
    format: (v) => `${Math.round(v)}%`,
    color: "#00ff88",
    description: "Gross margin and unit economics",
    higherIsBetter: true,
    operatorOnly: true,
  },
  enterpriseValue: {
    key: "enterpriseValue",
    label: "VALUATION",
    unit: "M",
    format: (v) => `$${(v / 10).toFixed(1)}M`,
    color: "#00ddff",
    description: "Estimated enterprise value",
    higherIsBetter: true,
  },
};

export const KPI_KEYS = Object.keys(KPI_META) as KPIKey[];

export const INVESTOR_VISIBLE_KPIS: KPIKey[] = KPI_KEYS.filter(
  (key) => !KPI_META[key].operatorOnly
);

export const OPERATOR_VISIBLE_KPIS: KPIKey[] = KPI_KEYS;
