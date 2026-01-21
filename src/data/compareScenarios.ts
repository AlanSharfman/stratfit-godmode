// src/data/compareScenarios.ts
// STRATFIT - The 4 Strategy-Based Situations for Compare Tab
// 
// 1. Current Trajectory - Continue as-is (baseline)
// 2. Series B Raise - Aggressive growth with $15M raise
// 3. Profitability Push - Bootstrap to profitability
// 4. Geographic Expansion - Raise $8M, expand to APAC

export type ScenarioName = 
  | 'current-trajectory' 
  | 'series-b' 
  | 'profitability' 
  | 'apac-expansion';

export interface CompareScenario {
  id: ScenarioName;
  name: string;              // Display name
  shortName: string;         // Short display name
  color: string;
  cash: number;              // in dollars
  runway: number;            // in months
  trajectory: string;        // e.g., "ACCELERATING", "STABLE", "DECLINING"
  risk: string;              // e.g., "LOW", "MEDIUM", "HIGH"
  description: string;       // Strategy description
  metrics: {
    demandStrength: number;      // 0-100
    pricingPower: number;        // 0-100
    customerChurn: number;       // 0-100
    costDiscipline: number;      // 0-100
    teamVelocity: number;        // 0-100
    hiringIntensity: number;     // 0-100
    successRate: number;         // 0-100 (probability)
    exitValue: number;           // in millions
  };
}

// ===========================================
// THE 4 STRATEGY-BASED SITUATIONS
// ===========================================
export const COMPARE_SCENARIOS: CompareScenario[] = [
  {
    id: 'current-trajectory',
    name: 'Current Trajectory',
    shortName: 'Current',
    color: '#94A3B8',  // Slate gray - neutral baseline
    cash: 2800000,
    runway: 15,
    trajectory: 'STABLE',
    risk: 'MEDIUM',
    description: 'Continue as-is with existing resources',
    metrics: {
      demandStrength: 60,
      pricingPower: 55,
      customerChurn: 28,
      costDiscipline: 75,
      teamVelocity: 65,
      hiringIntensity: 30,
      successRate: 64,
      exitValue: 42
    }
  },
  {
    id: 'series-b',
    name: 'Series B Raise',
    shortName: 'Series B',
    color: '#00D9FF',  // Cyan - growth/ambition
    cash: 19500000,
    runway: 46,
    trajectory: 'ACCELERATING',
    risk: 'MEDIUM',
    description: 'Raise $15M at $60M valuation, aggressive growth',
    metrics: {
      demandStrength: 85,
      pricingPower: 72,
      customerChurn: 18,
      costDiscipline: 58,
      teamVelocity: 88,
      hiringIntensity: 82,
      successRate: 73,
      exitValue: 149
    }
  },
  {
    id: 'profitability',
    name: 'Profitability Push',
    shortName: 'Profitable',
    color: '#FF9500',  // Orange - efficiency/caution
    cash: 2100000,
    runway: 48,
    trajectory: 'OPTIMIZING',
    risk: 'LOW',
    description: 'Bootstrap to profitability, controlled burn',
    metrics: {
      demandStrength: 55,
      pricingPower: 68,
      customerChurn: 22,
      costDiscipline: 92,
      teamVelocity: 58,
      hiringIntensity: 15,
      successRate: 85,
      exitValue: 68
    }
  },
  {
    id: 'apac-expansion',
    name: 'Geographic Expansion',
    shortName: 'APAC',
    color: '#00FF88',  // Green - growth/international
    cash: 11200000,
    runway: 62,
    trajectory: 'EXPANDING',
    risk: 'MEDIUM-HIGH',
    description: 'Raise $8M, expand to Singapore/Sydney',
    metrics: {
      demandStrength: 75,
      pricingPower: 62,
      customerChurn: 24,
      costDiscipline: 65,
      teamVelocity: 72,
      hiringIntensity: 68,
      successRate: 68,
      exitValue: 112
    }
  }
];

// Helper to get scenario by ID
export function getScenarioById(id: string): CompareScenario | undefined {
  return COMPARE_SCENARIOS.find(s => s.id === id);
}

// Helper to get scenario by legacy name (for backwards compatibility)
export function getScenarioByName(name: string): CompareScenario | undefined {
  // Map old names to new IDs
  const legacyMapping: Record<string, ScenarioName> = {
    'growth': 'series-b',
    'base': 'current-trajectory',
    'stress': 'profitability',
    'survival': 'apac-expansion'
  };
  const mappedId = legacyMapping[name] || name;
  return COMPARE_SCENARIOS.find(s => s.id === mappedId);
}

// Helper to map from activeScenarioId to compare scenario ID
export function mapScenarioId(id: string): ScenarioName {
  const mapping: Record<string, ScenarioName> = {
    // New IDs (direct mapping)
    'current-trajectory': 'current-trajectory',
    'series-b-stress-test': 'series-b',
    'profitability-push': 'profitability',
    'apac-expansion': 'apac-expansion',
    // Legacy IDs (backwards compatibility)
    'base-case': 'current-trajectory',
    'growth': 'series-b',
    'efficiency': 'profitability',
    'survival': 'apac-expansion',
    'series-b': 'series-b'
  };
  return mapping[id] || 'current-trajectory';
}

// Default comparison pair
export const DEFAULT_COMPARE_PAIR = {
  left: 'current-trajectory' as ScenarioName,
  right: 'series-b' as ScenarioName
};
