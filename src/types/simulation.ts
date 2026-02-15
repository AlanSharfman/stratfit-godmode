// ============================================================================
// MONTE CARLO SIMULATION TYPES
// ============================================================================

export type MonteCarloParticle = {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  outcome: "success" | "neutral" | "failure";
  probability: number;
  lifetime: number;
  opacity: number;
};

export type MonteCarloConfig = {
  particleCount: number;
  simulationRuns: number;
  confidenceInterval: number;
  volatilityFactor: number;
};

export type MonteCarloResult = {
  successRate: number;
  failureRate: number;
  expectedValue: number;
  variance: number;
  percentiles: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
};

// ============================================================================
// RISK WEATHER TYPES
// ============================================================================

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "stormy"
  | "turbulent"
  | "critical";

export type RiskWeatherState = {
  condition: WeatherCondition;
  intensity: number; // 0-1
  windDirection: [number, number, number];
  windSpeed: number;
  visibility: number; // 0-1
  turbulence: number; // 0-1
};

export type WeatherForecast = {
  current: RiskWeatherState;
  trend: "improving" | "stable" | "deteriorating";
  alerts: WeatherAlert[];
};

export type WeatherAlert = {
  id: string;
  severity: "advisory" | "warning" | "critical";
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
};

// ============================================================================
// EXECUTIVE REPORT TYPES
// ============================================================================

export type ReportSection = {
  id: string;
  title: string;
  content: string;
  metrics?: ReportMetric[];
  chartType?: "line" | "bar" | "gauge" | "heatmap";
  priority: "critical" | "high" | "medium" | "low";
};

export type ReportMetric = {
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  delta?: number;
};

export type ExecutiveReport = {
  id: string;
  generatedAt: string;
  scenarioName: string;
  executiveSummary: string;
  keyFindings: string[];
  riskAssessment: {
    level: "low" | "moderate" | "elevated" | "high" | "critical";
    score: number;
    factors: string[];
  };
  sections: ReportSection[];
  recommendations: Recommendation[];
  appendix?: {
    methodology: string;
    assumptions: string[];
    dataSourceS: string[];
  };
};

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  timeframe: string;
  confidence: number;
};

// ============================================================================
// AI INTERVENTION TYPES
// ============================================================================

export type InterventionCategory =
  | "cost"
  | "revenue"
  | "product"
  | "team"
  | "strategy"
  | "operations";

export type InterventionSuggestion = {
  id: string;
  title: string;
  description: string;
  rationale: string;
  category: InterventionCategory;
  confidence: number;
  impact: "low" | "medium" | "high" | "critical";
  effort: "low" | "medium" | "high";
  priority: "low" | "medium" | "high" | "critical";
  timeframe: string;
  status: "pending" | "applied" | "dismissed";
  expectedOutcomes?: string[];
  levers?: InterventionLever[];
  prerequisites?: string[];
  risks?: string[];
};

export type InterventionLever = {
  name: string;
  currentValue: number;
  suggestedValue: number;
  unit: string;
};
