// src/data/compareScenarios.ts
// Demo scenario data for Compare Tab God Mode

export interface CompareScenario {
  name: 'growth' | 'base' | 'stress' | 'survival';
  color: string;
  cash: number;           // in dollars
  runway: number;         // in months
  trajectory: string;     // e.g., "ACCELERATING", "STABLE", "DECLINING"
  risk: string;          // e.g., "LOW", "MEDIUM", "HIGH"
  metrics: {
    demandStrength: number;      // 0-100
    pricingPower: number;        // 0-100
    customerChurn: number;       // 0-100
    costDiscipline: number;      // 0-100
    teamVelocity: number;        // 0-100
    hiringIntensity: number;     // 0-100
  };
}

export const COMPARE_SCENARIOS: CompareScenario[] = [
  {
    name: 'growth',
    color: '#00ff9d',
    cash: 3200000,
    runway: 24,
    trajectory: 'ACCELERATING',
    risk: 'MEDIUM',
    metrics: {
      demandStrength: 85,
      pricingPower: 78,
      customerChurn: 15,
      costDiscipline: 72,
      teamVelocity: 88,
      hiringIntensity: 65
    }
  },
  {
    name: 'base',
    color: '#00d4ff',
    cash: 2400000,
    runway: 18,
    trajectory: 'STABLE',
    risk: 'LOW',
    metrics: {
      demandStrength: 70,
      pricingPower: 65,
      customerChurn: 25,
      costDiscipline: 80,
      teamVelocity: 75,
      hiringIntensity: 50
    }
  },
  {
    name: 'stress',
    color: '#ff4757',
    cash: 1200000,
    runway: 8,
    trajectory: 'DECLINING',
    risk: 'HIGH',
    metrics: {
      demandStrength: 45,
      pricingPower: 35,
      customerChurn: 45,
      costDiscipline: 85,
      teamVelocity: 52,
      hiringIntensity: 15
    }
  },
  {
    name: 'survival',
    color: '#ffa502',
    cash: 900000,
    runway: 6,
    trajectory: 'CRITICAL',
    risk: 'CRITICAL',
    metrics: {
      demandStrength: 30,
      pricingPower: 25,
      customerChurn: 55,
      costDiscipline: 92,
      teamVelocity: 40,
      hiringIntensity: 5
    }
  }
];

// Helper to get scenario by name
export function getScenarioByName(name: string): CompareScenario | undefined {
  return COMPARE_SCENARIOS.find(s => s.name === name);
}

// Helper to map from activeScenarioId to compare scenario name
export function mapScenarioId(id: string): 'growth' | 'base' | 'stress' | 'survival' {
  const mapping: Record<string, 'growth' | 'base' | 'stress' | 'survival'> = {
    'base-case': 'base',
    'growth': 'growth',
    'efficiency': 'stress',  // Map efficiency to stress for now
    'survival': 'survival',
    'series-b': 'growth'     // Map series-b to growth for now
  };
  return mapping[id] || 'base';
}

