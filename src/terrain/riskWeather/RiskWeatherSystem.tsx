import React, { memo, useMemo } from "react"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { deriveRiskWeather } from "@/terrain/riskWeather/riskWeatherState"
import StormCloudLayer from "@/terrain/riskWeather/StormCloudLayer"
import LavaFissureLayer from "@/terrain/riskWeather/LavaFissureLayer"
import RiskFogLayer from "@/terrain/riskWeather/RiskFogLayer"

interface Props {
  kpis: PositionKpis | null | undefined
}

/**
 * Orchestrates all risk-driven environmental effects on the terrain.
 * Renders nothing when all risk thresholds are below activation levels.
 */
const RiskWeatherSystem: React.FC<Props> = memo(({ kpis }) => {
  const weather = useMemo(() => deriveRiskWeather(kpis), [kpis])

  const hasEffects =
    weather.stormIntensity > 0 ||
    weather.fissureIntensity > 0 ||
    weather.fogDensity > 0

  if (!hasEffects) return null

  return (
    <>
      {weather.stormIntensity > 0 && (
        <StormCloudLayer intensity={weather.stormIntensity} />
      )}
      {weather.fissureIntensity > 0 && (
        <LavaFissureLayer intensity={weather.fissureIntensity} />
      )}
      {weather.fogDensity > 0 && (
        <RiskFogLayer density={weather.fogDensity} />
      )}
    </>
  )
})

RiskWeatherSystem.displayName = "RiskWeatherSystem"
export default RiskWeatherSystem
