// src/types/core.ts
// Canonical data contracts for STRATFIT (Sprint 0)

export interface ThresholdDefinition {
  critical: number;
  warning: number;
  safe: number;
  unit: string;
  source: string; // citation / rationale
}

export interface ThresholdSet {
  version: string;        // e.g. "1.0"
  effectiveDate: string;  // ISO date

  cash: ThresholdDefinition;
  hiring: ThresholdDefinition;
  concentration: ThresholdDefinition;
  spanOfControl: ThresholdDefinition;
  operationalComplexity: ThresholdDefinition;
}

export interface BreachDetail {
  component: string;
  value: number;
  threshold: number;
  severity: "warning" | "critical";
  contribution: number; // percentage
}

export interface PeakDetectionResult {
  timestamp: string;
  month: number;
  executionLoad: number; // 0–10
  breaches: BreachDetail[];
  calculationVersion: string;
}

export interface InputProvenance {
  field: string;
  value: number;
  source: "manual" | "calculated" | "imported";
  timestamp: string;
  confidence: number; // 0–10
}

