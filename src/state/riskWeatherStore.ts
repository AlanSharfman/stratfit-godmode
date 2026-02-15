import { create } from "zustand";

/**
 * Risk Weather Condition Types
 */
export type WeatherCondition =
  | "clear"      // Low risk, high confidence
  | "cloudy"     // Moderate uncertainty
  | "stormy"     // High risk, needs attention
  | "critical";  // Severe risk, immediate action required

export type RiskZone = {
  id: string;
  name: string;
  condition: WeatherCondition;
  riskScore: number;        // 0-1
  confidenceScore: number;  // 0-1
  volatilityScore: number;  // 0-1
  description: string;
  alerts: RiskAlert[];
};

export type RiskAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: number;
  metric?: string;
  threshold?: number;
  currentValue?: number;
};

export type WeatherForecast = {
  zone: string;
  condition: WeatherCondition;
  probability: number;
  horizon: "short" | "medium" | "long";
};

/**
 * Risk Weather Store
 */
type RiskWeatherState = {
  zones: RiskZone[];
  forecasts: WeatherForecast[];
  globalCondition: WeatherCondition;
  lastUpdated: number;
  
  setZones: (zones: RiskZone[]) => void;
  updateZone: (id: string, updates: Partial<RiskZone>) => void;
  addAlert: (zoneId: string, alert: Omit<RiskAlert, "id" | "timestamp">) => void;
  clearAlerts: (zoneId: string) => void;
  setForecasts: (forecasts: WeatherForecast[]) => void;
  computeGlobalCondition: () => void;
};

export const useRiskWeatherStore = create<RiskWeatherState>((set, get) => ({
  zones: [],
  forecasts: [],
  globalCondition: "clear",
  lastUpdated: Date.now(),

  setZones: (zones) => {
    set({ zones, lastUpdated: Date.now() });
    get().computeGlobalCondition();
  },

  updateZone: (id, updates) => {
    set((state) => ({
      zones: state.zones.map((z) => (z.id === id ? { ...z, ...updates } : z)),
      lastUpdated: Date.now(),
    }));
    get().computeGlobalCondition();
  },

  addAlert: (zoneId, alert) => {
    const newAlert: RiskAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      zones: state.zones.map((z) =>
        z.id === zoneId ? { ...z, alerts: [...z.alerts, newAlert] } : z
      ),
      lastUpdated: Date.now(),
    }));
  },

  clearAlerts: (zoneId) => {
    set((state) => ({
      zones: state.zones.map((z) =>
        z.id === zoneId ? { ...z, alerts: [] } : z
      ),
    }));
  },

  setForecasts: (forecasts) => set({ forecasts }),

  computeGlobalCondition: () => {
    const { zones } = get();
    if (zones.length === 0) {
      set({ globalCondition: "clear" });
      return;
    }

    // Weighted average of zone conditions
    const conditionScores: Record<WeatherCondition, number> = {
      clear: 0,
      cloudy: 0.33,
      stormy: 0.66,
      critical: 1,
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const zone of zones) {
      const weight = 1 + zone.alerts.filter((a) => a.severity === "critical").length * 0.5;
      totalScore += conditionScores[zone.condition] * weight;
      totalWeight += weight;
    }

    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    let globalCondition: WeatherCondition = "clear";
    if (avgScore > 0.75) globalCondition = "critical";
    else if (avgScore > 0.5) globalCondition = "stormy";
    else if (avgScore > 0.25) globalCondition = "cloudy";

    set({ globalCondition });
  },
}));

/**
 * Compute risk zone from scenario metrics
 */
export function computeRiskZone(
  id: string,
  name: string,
  metrics: {
    revenue?: number;
    targetRevenue?: number;
    cashBurn?: number;
    runway?: number;
    growthRate?: number;
    churnRate?: number;
  }
): RiskZone {
  const alerts: RiskAlert[] = [];

  // Calculate risk score (0-1)
  let riskScore = 0;
  let riskFactors = 0;

  // Revenue vs target
  if (metrics.revenue !== undefined && metrics.targetRevenue !== undefined) {
    const revenueRatio = metrics.revenue / metrics.targetRevenue;
    if (revenueRatio < 0.8) {
      riskScore += 0.3 * (1 - revenueRatio);
      riskFactors++;
      if (revenueRatio < 0.5) {
        alerts.push({
          id: "",
          timestamp: 0,
          severity: "critical",
          message: `Revenue at ${Math.round(revenueRatio * 100)}% of target`,
          metric: "revenue",
          threshold: metrics.targetRevenue * 0.8,
          currentValue: metrics.revenue,
        });
      }
    }
  }

  // Runway check
  if (metrics.runway !== undefined) {
    if (metrics.runway < 6) {
      riskScore += 0.4;
      riskFactors++;
      alerts.push({
        id: "",
        timestamp: 0,
        severity: metrics.runway < 3 ? "critical" : "warning",
        message: `Runway at ${metrics.runway} months`,
        metric: "runway",
        threshold: 6,
        currentValue: metrics.runway,
      });
    }
  }

  // Churn check
  if (metrics.churnRate !== undefined && metrics.churnRate > 0.05) {
    riskScore += 0.2 * (metrics.churnRate / 0.1);
    riskFactors++;
    if (metrics.churnRate > 0.08) {
      alerts.push({
        id: "",
        timestamp: 0,
        severity: "warning",
        message: `Churn rate at ${Math.round(metrics.churnRate * 100)}%`,
        metric: "churnRate",
        threshold: 0.05,
        currentValue: metrics.churnRate,
      });
    }
  }

  // Normalize risk score
  if (riskFactors > 0) {
    riskScore = Math.min(1, riskScore / riskFactors);
  }

  // Confidence score (inverse of variance/uncertainty)
  const confidenceScore = Math.max(0, 1 - riskScore * 0.5);

  // Volatility from growth variance
  const volatilityScore = metrics.growthRate !== undefined 
    ? Math.abs(metrics.growthRate - 0.1) / 0.3 
    : 0.3;

  // Determine condition
  let condition: WeatherCondition = "clear";
  if (riskScore > 0.75 || alerts.some((a) => a.severity === "critical")) {
    condition = "critical";
  } else if (riskScore > 0.5) {
    condition = "stormy";
  } else if (riskScore > 0.25) {
    condition = "cloudy";
  }

  return {
    id,
    name,
    condition,
    riskScore,
    confidenceScore,
    volatilityScore,
    description: generateDescription(condition, riskScore),
    alerts,
  };
}

function generateDescription(condition: WeatherCondition, riskScore: number): string {
  switch (condition) {
    case "clear":
      return "Operating conditions are favorable. Key metrics are within healthy ranges.";
    case "cloudy":
      return "Some uncertainty detected. Monitor secondary indicators for early warning signals.";
    case "stormy":
      return "Elevated risk levels. Consider protective adjustments to maintain trajectory.";
    case "critical":
      return "Critical conditions require immediate attention. Review all risk factors and prepare contingency actions.";
  }
}

/**
 * Generate weather forecast based on trend analysis
 */
export function generateForecast(
  zone: RiskZone,
  trendDirection: "improving" | "stable" | "deteriorating"
): WeatherForecast[] {
  const forecasts: WeatherForecast[] = [];
  const conditionOrder: WeatherCondition[] = ["clear", "cloudy", "stormy", "critical"];
  const currentIndex = conditionOrder.indexOf(zone.condition);

  // Short-term (1-3 months)
  const shortTermShift = trendDirection === "improving" ? -1 : trendDirection === "deteriorating" ? 1 : 0;
  const shortTermIndex = Math.max(0, Math.min(3, currentIndex + shortTermShift * 0.5));
  forecasts.push({
    zone: zone.id,
    condition: conditionOrder[Math.round(shortTermIndex)],
    probability: 0.7 + (trendDirection === "stable" ? 0.1 : 0),
    horizon: "short",
  });

  // Medium-term (3-6 months)
  const mediumTermIndex = Math.max(0, Math.min(3, currentIndex + shortTermShift));
  forecasts.push({
    zone: zone.id,
    condition: conditionOrder[Math.round(mediumTermIndex)],
    probability: 0.55,
    horizon: "medium",
  });

  // Long-term (6-12 months)
  const longTermIndex = Math.max(0, Math.min(3, currentIndex + shortTermShift * 1.5));
  forecasts.push({
    zone: zone.id,
    condition: conditionOrder[Math.round(longTermIndex)],
    probability: 0.4,
    horizon: "long",
  });

  return forecasts;
}
