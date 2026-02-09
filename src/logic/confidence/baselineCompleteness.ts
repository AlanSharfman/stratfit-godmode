// src/logic/confidence/baselineCompleteness.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Baseline Completeness Calculator
//
// Computes completeness01 = (#present and valid) / (#required)
// "valid" means not null/undefined, and passes basic sanity checks.
// ═══════════════════════════════════════════════════════════════════════════

import type { BaselineV1 } from "@/onboard/baseline";

// ────────────────────────────────────────────────────────────────────────────
// REQUIRED FIELD DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

interface FieldCheck {
  label: string;
  accessor: (b: BaselineV1) => unknown;
  validate?: (v: unknown) => boolean;
}

const isPositiveNumber = (v: unknown): boolean =>
  typeof v === "number" && isFinite(v) && v > 0;

const isNonNegativeNumber = (v: unknown): boolean =>
  typeof v === "number" && isFinite(v) && v >= 0;

const isPctBound = (v: unknown): boolean =>
  typeof v === "number" && isFinite(v) && v >= 0 && v <= 200;

const isNonEmptyString = (v: unknown): boolean =>
  typeof v === "string" && v.trim().length > 0;

const REQUIRED_FIELDS: FieldCheck[] = [
  // ── Financial ──
  { label: "ARR",                     accessor: (b) => b.financial?.arr,                    validate: isPositiveNumber },
  { label: "Monthly Burn",            accessor: (b) => b.financial?.monthlyBurn,             validate: isPositiveNumber },
  { label: "Cash on Hand",            accessor: (b) => b.financial?.cashOnHand,              validate: isNonNegativeNumber },
  { label: "Growth Rate %",           accessor: (b) => b.financial?.growthRatePct,           validate: isPctBound },
  { label: "Gross Margin %",          accessor: (b) => b.financial?.grossMarginPct,          validate: isPctBound },
  { label: "NRR %",                   accessor: (b) => b.financial?.nrrPct,                  validate: isPctBound },
  { label: "Headcount",               accessor: (b) => b.financial?.headcount,               validate: isPositiveNumber },
  { label: "Avg Fully-Loaded Cost",   accessor: (b) => b.financial?.avgFullyLoadedCost,      validate: isPositiveNumber },
  { label: "S&M Spend",               accessor: (b) => b.financial?.salesMarketingSpend,     validate: isNonNegativeNumber },
  { label: "R&D Spend",               accessor: (b) => b.financial?.rdSpend,                 validate: isNonNegativeNumber },
  { label: "G&A Spend",               accessor: (b) => b.financial?.gaSpend,                 validate: isNonNegativeNumber },

  // ── Capital ──
  { label: "Total Debt",              accessor: (b) => b.capital?.totalDebt,                 validate: isNonNegativeNumber },
  { label: "Interest Rate %",         accessor: (b) => b.capital?.interestRatePct,           validate: isNonNegativeNumber },

  // ── Operating ──
  { label: "Churn %",                 accessor: (b) => b.operating?.churnPct,                validate: isPctBound },
  { label: "Active Customers",        accessor: (b) => b.operating?.activeCustomers,         validate: isPositiveNumber },

  // ── Customer Engine ──
  { label: "CAC",                     accessor: (b) => b.customerEngine?.cac,                validate: isPositiveNumber },
  { label: "LTV",                     accessor: (b) => b.customerEngine?.ltv,                validate: isPositiveNumber },
];

// ────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ────────────────────────────────────────────────────────────────────────────

export interface BaselineCompletenessResult {
  completeness01: number;
  filledCount: number;
  totalRequired: number;
  missing: string[];
}

export function computeBaselineCompleteness(baseline: BaselineV1 | null): BaselineCompletenessResult {
  if (!baseline) {
    return {
      completeness01: 0,
      filledCount: 0,
      totalRequired: REQUIRED_FIELDS.length,
      missing: REQUIRED_FIELDS.map((f) => f.label),
    };
  }

  let filled = 0;
  const missing: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    try {
      const val = field.accessor(baseline);
      const isPresent = val !== undefined && val !== null && val !== "";
      const isValid = field.validate ? field.validate(val) : isPresent;
      if (isPresent && isValid) {
        filled++;
      } else {
        missing.push(field.label);
      }
    } catch {
      missing.push(field.label);
    }
  }

  return {
    completeness01: filled / REQUIRED_FIELDS.length,
    filledCount: filled,
    totalRequired: REQUIRED_FIELDS.length,
    missing,
  };
}



