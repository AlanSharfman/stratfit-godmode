import type { PositionKpis } from "@/pages/position/overlays/positionState"

export interface RiskWeatherState {
  /** Overall risk 0–1 (higher = riskier), inverted from kpis.riskIndex health score */
  riskLevel: number
  /** Burn risk 0–1, derived from runway + burn-to-revenue ratio */
  burnRisk: number
  /** Market uncertainty 0–1, derived from churn, growth weakness, NRR contraction */
  marketUncertainty: number
  /** Storm cloud intensity 0–1 (non-zero only when riskLevel > 0.7) */
  stormIntensity: number
  /** Lava fissure intensity 0–1 (non-zero only when burnRisk > 0.55) */
  fissureIntensity: number
  /** Horizon fog density 0–1 (non-zero only when marketUncertainty > 0.5) */
  fogDensity: number
}

const ZERO_WEATHER: RiskWeatherState = {
  riskLevel: 0, burnRisk: 0, marketUncertainty: 0,
  stormIntensity: 0, fissureIntensity: 0, fogDensity: 0,
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * Derive environmental weather intensities from the current business KPIs.
 * All outputs are 0–1 and map directly to visual effect strength.
 */
export function deriveRiskWeather(kpis: PositionKpis | null | undefined): RiskWeatherState {
  if (!kpis) return ZERO_WEATHER

  // kpis.riskIndex is 0–100 where higher = healthier → invert to get risk
  const riskLevel = clamp01(1 - kpis.riskIndex / 100)

  // Burn risk: short runway + high burn relative to revenue
  const runwayFactor = clamp01(1 - kpis.runwayMonths / 24)
  const burnToRevenue = kpis.revenueMonthly > 0
    ? clamp01(kpis.burnMonthly / kpis.revenueMonthly)
    : 0.8
  const burnRisk = clamp01(runwayFactor * 0.6 + burnToRevenue * 0.4)

  // Market uncertainty: high churn + low growth + weak NRR
  const churnFactor = clamp01(kpis.churnPct / 10)
  const growthWeakness = clamp01(1 - kpis.growthRatePct / 50)
  const nrrWeakness = clamp01(1 - kpis.nrrPct / 120)
  const marketUncertainty = clamp01(
    churnFactor * 0.4 + growthWeakness * 0.35 + nrrWeakness * 0.25,
  )

  const STORM_THRESH = 0.7
  const stormIntensity = riskLevel > STORM_THRESH
    ? clamp01((riskLevel - STORM_THRESH) / (1 - STORM_THRESH))
    : 0

  const FISSURE_THRESH = 0.55
  const fissureIntensity = burnRisk > FISSURE_THRESH
    ? clamp01((burnRisk - FISSURE_THRESH) / (1 - FISSURE_THRESH))
    : 0

  const FOG_THRESH = 0.5
  const fogDensity = marketUncertainty > FOG_THRESH
    ? clamp01((marketUncertainty - FOG_THRESH) / (1 - FOG_THRESH))
    : 0

  return { riskLevel, burnRisk, marketUncertainty, stormIntensity, fissureIntensity, fogDensity }
}
