// src/logic/leverDefinitions.ts
// STRATFIT — Lever definitions with tooltip help text

export type LeverId =
  | "revenueGrowth"      // Demand Strength
  | "pricingAdjustment"  // Pricing Power
  | "marketingSpend"     // Expansion Velocity
  | "operatingExpenses"  // Cost Discipline
  | "headcount"          // Hiring Intensity
  | "cashSensitivity"    // Operating Drag
  | "churnSensitivity"   // Market Volatility
  | "fundingInjection";  // Execution Risk

export interface LeverDefinition {
  id: LeverId;
  label: string;
  description: string;
  helpText: string; // Detailed tooltip content
  min: number;
  max: number;
  default: number;
  step: number;
  category: 'growth' | 'efficiency' | 'risk';
}

export const LEVERS: Record<LeverId, LeverDefinition> = {
  revenueGrowth: {
    id: 'revenueGrowth',
    label: 'Demand Strength',
    description: 'Market demand intensity',
    helpText: 'Customer appetite and market pull for your offering. Higher demand accelerates revenue but may strain operations.\n\nScenario Effect: Upside = strong demand sustained, Downside = demand collapses\n\nTypical Range: 40-60 = normal, 70+ = hypergrowth, 30- = contraction',
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    category: 'growth'
  },
  
  pricingAdjustment: {
    id: 'pricingAdjustment',
    label: 'Pricing Power',
    description: 'Ability to command premium pricing',
    helpText: 'Your ability to set and maintain prices above market average without losing customers.\n\nBusiness Impact: Higher pricing power = better margins and profitability\n\nScenario Effect: Upside = pricing holds/increases, Downside = forced discounting\n\nTypical Range: 40-60 = competitive parity, 70+ = market leader, 30- = price competition',
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    category: 'growth'
  },
  
  marketingSpend: {
    id: 'marketingSpend',
    label: 'Expansion Velocity',
    description: 'Speed of market/product expansion',
    helpText: 'Rate at which you enter new markets, launch products, or expand geographically.\n\nBusiness Impact: Faster expansion = higher growth but increased execution risk\n\nScenario Effect: Upside = expansion succeeds, Downside = expansion drains resources\n\nTypical Range: 40-60 = measured growth, 70+ = aggressive expansion, 30- = consolidation',
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    category: 'growth'
  },
  
  operatingExpenses: {
    id: 'operatingExpenses',
    label: 'Cost Discipline',
    description: 'Operational cost control effectiveness',
    helpText: 'How effectively you control and optimize operational expenses without sacrificing quality.\n\nBusiness Impact: Higher discipline = longer runway and better burn quality\n\nScenario Effect: Upside = costs stay controlled, Downside = cost overruns\n\nTypical Range: 40-60 = standard controls, 70+ = lean operations, 30- = cost bloat',
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    category: 'efficiency'
  },
  
  headcount: {
    id: 'headcount',
    label: 'Hiring Intensity',
    description: 'Team growth and talent acquisition rate',
    helpText: 'Rate at which you grow headcount to support business expansion.\n\nBusiness Impact: Faster hiring = more capacity but higher burn and dilution risk\n\nScenario Effect: Upside = hires deliver ROI, Downside = overhiring drains cash\n\nTypical Range: 40-60 = steady hiring, 70+ = rapid team growth, 30- = hiring freeze',
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    category: 'efficiency'
  },
  
  cashSensitivity: {
    id: 'cashSensitivity',
    label: 'Operating Drag',
    description: 'Organizational inefficiency and friction',
    helpText: 'Overhead, bureaucracy, and inefficiencies that slow execution and increase costs.\n\nBusiness Impact: Higher drag = slower progress, lower productivity, wasted resources\n\nScenario Effect: Upside = minimal friction, Downside = organizational dysfunction\n\nTypical Range: 40-60 = normal friction, 70+ = serious inefficiency, 30- = highly optimized',
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    category: 'efficiency'
  },
  
  churnSensitivity: {
    id: 'churnSensitivity',
    label: 'Market Volatility',
    description: 'External market uncertainty and turbulence',
    helpText: 'Degree of unpredictability in your market (regulatory changes, competitive shifts, macro shocks).\n\nBusiness Impact: Higher volatility = wider outcome range, harder to forecast\n\nScenario Effect: Upside = volatility creates opportunity, Downside = volatility kills business\n\nTypical Range: 40-60 = stable market, 70+ = highly uncertain, 30- = predictable',
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    category: 'risk'
  },
  
  fundingInjection: {
    id: 'fundingInjection',
    label: 'Execution Risk',
    description: 'Internal delivery and execution uncertainty',
    helpText: 'Risk that your team fails to deliver on strategy, product, or operational goals.\n\nBusiness Impact: Higher risk = more likely to miss targets, lose customers, waste capital\n\nScenario Effect: Upside = flawless execution, Downside = major delivery failures\n\nTypical Range: 40-60 = normal risk, 70+ = high uncertainty, 30- = proven execution',
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    category: 'risk'
  }
};

// Helper functions
export function getLeversByCategory(category: 'growth' | 'efficiency' | 'risk'): LeverDefinition[] {
  return Object.values(LEVERS).filter(lever => lever.category === category);
}

export function getLever(id: LeverId): LeverDefinition | undefined {
  return LEVERS[id];
}
