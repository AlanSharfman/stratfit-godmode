// src/logic/confidence/calculateModelConfidence.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Institutional Model Confidence Engine
// Statistically defensible. Not cosmetic. Derived from model structure.
// ═══════════════════════════════════════════════════════════════════════════

export interface ConfidenceDrivers {
  sampleAdequacy: number;
  dispersionRisk: number;
  inputIntegrity: number;
  crossMethodAlignment: number;
}

export interface ModelConfidenceResult {
  confidenceScore: number;
  classification: "High" | "Moderate" | "Low";
  drivers: ConfidenceDrivers;
}

export interface CalculateModelConfidenceInput {
  sampleSize: number;
  distributionStdDev: number;
  distributionMean: number;
  inputCompletenessScore: number;
  parameterStabilityScore: number;
  methodConsistencyScore: number;
}

const W_SAMPLE = 0.25;
const W_DISPERSION = 0.25;
const W_INPUT = 0.30;
const W_CROSS = 0.20;

function calcSampleAdequacy(n: number): number {
  if (n <= 0) return 0;
  if (n < 1000) return (n / 1000) * 60;
  if (n < 5000) return 60 + ((n - 1000) / 4000) * 30;
  if (n < 10000) return 90 + ((n - 5000) / 5000) * 10;
  return 100;
}

function calcDispersionRisk(std: number, mean: number): number {
  if (mean <= 0 || std < 0) return 0;
  const cv = std / mean;
  if (cv < 0.15) return 90 + (1 - cv / 0.15) * 10;
  if (cv < 0.30) return 70 + ((0.30 - cv) / 0.15) * 20;
  if (cv < 0.60) return 40 + ((0.60 - cv) / 0.30) * 30;
  if (cv < 1.0) return Math.max(0, 40 * (1 - (cv - 0.60) / 0.40));
  return 0;
}

function calcInputIntegrity(c: number): number {
  const v = Math.max(0, Math.min(1, c));
  if (v >= 0.9) return 90 + v * 10;
  if (v >= 0.7) return 70 + ((v - 0.7) / 0.2) * 20;
  if (v >= 0.5) return 40 + ((v - 0.5) / 0.2) * 30;
  return v * 80;
}

function calcCrossMethodAlignment(c: number): number {
  const v = Math.max(0, Math.min(1, c));
  return v * v * 100;
}

export function calculateModelConfidence(
  input: CalculateModelConfidenceInput
): ModelConfidenceResult {
  const sampleAdequacy = calcSampleAdequacy(input.sampleSize);
  const dispersionRisk = calcDispersionRisk(input.distributionStdDev, input.distributionMean);
  const inputIntegrity = calcInputIntegrity(input.inputCompletenessScore);
  const crossMethodAlignment = calcCrossMethodAlignment(input.methodConsistencyScore);

  const raw =
    sampleAdequacy * W_SAMPLE +
    dispersionRisk * W_DISPERSION +
    inputIntegrity * W_INPUT +
    crossMethodAlignment * W_CROSS;

  const stability = Math.max(0, Math.min(1, input.parameterStabilityScore));
  const stabilityMult = 0.7 + stability * 0.3;
  const confidenceScore = Math.max(0, Math.min(100, raw * stabilityMult));

  let classification: "High" | "Moderate" | "Low";
  if (confidenceScore >= 70) classification = "High";
  else if (confidenceScore >= 45) classification = "Moderate";
  else classification = "Low";

  return { confidenceScore, classification, drivers: { sampleAdequacy, dispersionRisk, inputIntegrity, crossMethodAlignment } };
}
