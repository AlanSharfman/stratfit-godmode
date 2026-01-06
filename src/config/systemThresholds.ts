// src/config/systemThresholds.ts
// System-wide thresholds for deterministic status evaluation

export const SYSTEM_THRESHOLDS = {
  marginOfSafety: {
    safe: 12,
    caution: 6,
  },
  riskIndex: {
    caution: 60,
    critical: 80,
  },
};
