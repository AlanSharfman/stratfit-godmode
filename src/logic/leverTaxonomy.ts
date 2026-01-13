// src/logic/leverTaxonomy.ts
// Single source of truth for Lever metadata across STRATFIT
// Investor-grade naming without breaking IDs

export interface LeverDefinition {
  id: string; // STABLE - do not change (matches engine)
  label: string; // investor-grade display name
  group: "growth" | "efficiency" | "risk";
  tooltip: string; // explains what this lever controls
  min: number;
  max: number;
  defaultValue: number;
}

// Master lever registry
export const LEVER_DEFS: LeverDefinition[] = [
  // Growth levers
  {
    id: "demandStrength",
    label: "Demand Strength",
    group: "growth",
    tooltip: "Market pull, inbound velocity, and product-market fit intensity",
    min: 0,
    max: 100,
    defaultValue: 60,
  },
  {
    id: "pricingPower",
    label: "Pricing Power",
    group: "growth",
    tooltip: "Ability to command premium pricing and resist discounting pressure",
    min: 0,
    max: 100,
    defaultValue: 50,
  },
  {
    id: "expansionVelocity",
    label: "Expansion Velocity",
    group: "growth",
    tooltip: "Net revenue retention (NRR) and upsell/cross-sell effectiveness",
    min: 0,
    max: 100,
    defaultValue: 45,
  },

  // Efficiency levers
  {
    id: "costDiscipline",
    label: "Cost Discipline",
    group: "efficiency",
    tooltip: "Operating expense control and resource optimization",
    min: 0,
    max: 100,
    defaultValue: 55,
  },
  {
    id: "hiringIntensity",
    label: "Hiring Intensity",
    group: "efficiency",
    tooltip: "Headcount growth rate and team scaling velocity",
    min: 0,
    max: 100,
    defaultValue: 40,
  },
  {
    id: "operatingDrag",
    label: "Operating Drag",
    group: "efficiency",
    tooltip: "Organizational friction, process inefficiency, and structural overhead",
    min: 0,
    max: 100,
    defaultValue: 35,
  },

  // Risk levers
  {
    id: "marketVolatility",
    label: "Market Volatility",
    group: "risk",
    tooltip: "External market instability, competitive pressure, and demand uncertainty",
    min: 0,
    max: 100,
    defaultValue: 30,
  },
  {
    id: "executionRisk",
    label: "Execution Risk",
    group: "risk",
    tooltip: "Internal delivery risk, team capability gaps, and operational fragility",
    min: 0,
    max: 100,
    defaultValue: 25,
  },
  {
    id: "fundingPressure",
    label: "Funding Pressure",
    group: "risk",
    tooltip: "Capital availability constraints and financing environment stress",
    min: 0,
    max: 100,
    defaultValue: 20,
  },
];

// Lookup helpers
export function getLeverDefinition(id: string): LeverDefinition | undefined {
  return LEVER_DEFS.find((l) => l.id === id);
}

export function getLeversByGroup(group: "growth" | "efficiency" | "risk"): LeverDefinition[] {
  return LEVER_DEFS.filter((l) => l.group === group);
}

export function getLeverLabel(id: string): string {
  const def = getLeverDefinition(id);
  return def ? def.label : id;
}

