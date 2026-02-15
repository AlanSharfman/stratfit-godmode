import type { RiskWeatherState, WeatherCondition, WeatherAlert } from "@/types/simulation";

/**
 * Calculate weather condition based on business metrics.
 *
 * Risk factors considered:
 * - Burn rate vs runway
 * - Revenue volatility
 * - Cost efficiency
 * - Growth trajectory
 */
export function calculateWeatherFromMetrics(metrics: {
  runway: number; // months
  burnRate: number;
  revenueVolatility: number;
  costEfficiency: number;
  growthRate: number;
  riskScore: number; // 0-100
}): RiskWeatherState {
  const { runway, burnRate, revenueVolatility, costEfficiency, growthRate, riskScore } = metrics;

  // Determine condition based on composite risk
  let condition: WeatherCondition = "clear";
  let intensity = 0.2;
  let visibility = 1.0;
  let turbulence = 0.05;

  if (riskScore >= 80 || runway < 3) {
    condition = "critical";
    intensity = 0.9 + Math.random() * 0.1;
    visibility = 0.3;
    turbulence = 0.8;
  } else if (riskScore >= 60 || runway < 6) {
    condition = "turbulent";
    intensity = 0.7;
    visibility = 0.5;
    turbulence = 0.5;
  } else if (riskScore >= 40 || revenueVolatility > 0.3) {
    condition = "stormy";
    intensity = 0.5;
    visibility = 0.65;
    turbulence = 0.3;
  } else if (riskScore >= 20 || costEfficiency < 0.6) {
    condition = "cloudy";
    intensity = 0.35;
    visibility = 0.8;
    turbulence = 0.15;
  } else {
    condition = "clear";
    intensity = 0.2;
    visibility = 1.0;
    turbulence = 0.05;
  }

  // Wind direction based on growth trajectory
  const windAngle = growthRate > 0 ? 0 : Math.PI;
  const windDirection: [number, number, number] = [
    Math.cos(windAngle) * 0.5,
    growthRate > 0 ? 0.1 : -0.1,
    Math.sin(windAngle) * 0.5,
  ];

  return {
    condition,
    intensity,
    windDirection,
    windSpeed: Math.abs(burnRate) * 0.01,
    visibility,
    turbulence,
  };
}

/**
 * Generate weather alerts based on metric thresholds.
 */
export function generateWeatherAlerts(metrics: {
  runway: number;
  burnRate: number;
  revenueGrowth: number;
  cashBalance: number;
  debtRatio: number;
}): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (metrics.runway < 6) {
    alerts.push({
      id: "runway-warning",
      severity: metrics.runway < 3 ? "critical" : "warning",
      message: `Cash runway is ${metrics.runway.toFixed(1)} months`,
      metric: "runway",
      threshold: 6,
      currentValue: metrics.runway,
    });
  }

  if (metrics.burnRate > 100000) {
    alerts.push({
      id: "burn-advisory",
      severity: metrics.burnRate > 200000 ? "warning" : "advisory",
      message: `Monthly burn rate exceeds ${metrics.burnRate > 200000 ? "critical" : "advisory"} threshold`,
      metric: "burnRate",
      threshold: 100000,
      currentValue: metrics.burnRate,
    });
  }

  if (metrics.revenueGrowth < 0) {
    alerts.push({
      id: "revenue-decline",
      severity: metrics.revenueGrowth < -0.1 ? "warning" : "advisory",
      message: "Revenue is declining",
      metric: "revenueGrowth",
      threshold: 0,
      currentValue: metrics.revenueGrowth,
    });
  }

  if (metrics.debtRatio > 0.7) {
    alerts.push({
      id: "debt-warning",
      severity: metrics.debtRatio > 0.85 ? "critical" : "warning",
      message: "Debt ratio is elevated",
      metric: "debtRatio",
      threshold: 0.7,
      currentValue: metrics.debtRatio,
    });
  }

  return alerts;
}

/**
 * Get human-readable weather description.
 */
export function getWeatherDescription(condition: WeatherCondition): {
  title: string;
  description: string;
  advice: string;
} {
  const descriptions: Record<WeatherCondition, { title: string; description: string; advice: string }> = {
    clear: {
      title: "Clear Skies",
      description: "Business conditions are favorable with good visibility ahead.",
      advice: "Ideal conditions for growth initiatives and strategic investments.",
    },
    cloudy: {
      title: "Cloudy Outlook",
      description: "Some uncertainty in the forecast. Monitor key metrics closely.",
      advice: "Consider building reserves and diversifying revenue streams.",
    },
    stormy: {
      title: "Storm Warning",
      description: "Elevated volatility and risk factors detected.",
      advice: "Focus on stability. Delay non-essential expenditures.",
    },
    turbulent: {
      title: "High Turbulence",
      description: "Multiple risk factors converging. Significant headwinds ahead.",
      advice: "Activate contingency plans. Prioritize cash preservation.",
    },
    critical: {
      title: "Emergency Conditions",
      description: "Critical risk thresholds breached. Immediate action required.",
      advice: "All hands on deck. Focus exclusively on survival metrics.",
    },
  };

  return descriptions[condition];
}
