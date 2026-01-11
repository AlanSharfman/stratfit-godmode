import type { MetricRow } from "../ScenarioImpactPanel";

export const scenarioImpactMockRows: MetricRow[] = [
  {
    id: "revenue",
    label: "Revenue",
    format: "currency",
    base: 2.6e6,
    scenario: 3.7e6,
    commentary: "Strong revenue uplift driven by adjusted lever inputs. Demand thesis validated; growth trajectory on track.",
  },
  {
    id: "arr",
    label: "ARR",
    format: "currency",
    base: 3.2e6,
    scenario: 3.7e6,
    commentary: "Incremental ARR growth reflects healthy customer acquisition and retention dynamics.",
  },
  {
    id: "valuation",
    label: "Valuation",
    format: "currency",
    base: 43.5e6,
    scenario: 82.2e6,
    commentary: "Significant enterprise value creation under adjusted lever inputs. Multiple expansion supported by fundamentals.",
  },
  { id: "grossMargin", label: "Gross Margin", format: "percent", base: 74, scenario: 74 },
  { id: "burnRate", label: "Burn Rate", format: "currency", base: 85e3, scenario: 47e3, commentary: "Burn discipline improving. Efficiency gains being realized through operational improvements." },
  { id: "cashBalance", label: "Cash Balance", format: "currency", base: 4.0e6, scenario: 4.0e6 },
  { id: "runway", label: "Runway", format: "months", base: 19, scenario: 19 },
  { id: "riskScore", label: "Risk Score", format: "score", base: 23, scenario: 23 },
];

