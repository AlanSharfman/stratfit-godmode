// src/config/systemThresholds.ts
// System-wide thresholds for deterministic status evaluation

export const SYSTEM_THRESHOLDS = {
  // Existing system thresholds (used by getSystemBrief etc.)
  marginOfSafety: {
    safe: 12,
    caution: 6,
  },
  riskIndex: {
    caution: 60,
    critical: 80,
  },

  // Health scoring thresholds (used by calculateScenarioHealth)
  health: {
    baselineHealth: 65, // base case expected health (0–100)
    state: {
      strong: 75,
      stable: 60,
      fragile: 40,
      // critical is < fragile
    },
    trendDelta: 3, // delta required to label strengthening/weakening
  },
} as const;
