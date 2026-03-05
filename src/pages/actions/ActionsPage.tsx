import React, { useMemo, useState } from "react"
import { NavLink, Link } from "react-router-dom"

import { ROUTES } from "@/routes/routeContract"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel, type PositionKpis } from "@/pages/position/overlays/positionState"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "@/engine/kpiDependencyGraph"
import { computeActionRecommendations, getKpiLabel, type ActionRecommendation } from "@/engine/sensitivityAnalysis"
import { useKpiAudio } from "@/hooks/useKpiAudio"
import MiniTerrainSilhouette from "@/components/actions/MiniTerrainSilhouette"
import styles from "./ActionsPage.module.css"

function computeAfterKpis(current: PositionKpis, kpi: KpiKey): PositionKpis {
  const { affected } = propagateForce(KPI_GRAPH, kpi, 0.10)
  const result = { ...current }
  const kpiFieldMap: Record<KpiKey, keyof PositionKpis> = {
    cash: "cashOnHand",
    runway: "runwayMonths",
    growth: "growthRatePct",
    arr: "arr",
    revenue: "revenueMonthly",
    burn: "burnMonthly",
    churn: "churnPct",
    grossMargin: "grossMarginPct",
    efficiency: "efficiencyRatio",
    enterpriseValue: "valuationEstimate",
  }
  for (const [k, delta] of affected) {
    const field = kpiFieldMap[k]
    if (field) {
      ;(result as any)[field] = (result as any)[field] + (result as any)[field] * delta
    }
  }
  return result
}

export default function ActionsPage() {
  const { baseline } = useSystemBaseline()
  const liveKpis = useMemo(() => {
    if (!baseline) return null
    return buildPositionViewModel(baseline as any).kpis
  }, [baseline])

  const recommendations = useMemo<ActionRecommendation[]>(() => {
    if (!liveKpis) return []
    return computeActionRecommendations(liveKpis, 5)
  }, [liveKpis])

  const afterKpisMap = useMemo(() => {
    if (!liveKpis) return new Map<KpiKey, PositionKpis>()
    const map = new Map<KpiKey, PositionKpis>()
    for (const rec of recommendations) {
      map.set(rec.kpi, computeAfterKpis(liveKpis, rec.kpi))
    }
    return map
  }, [liveKpis, recommendations])

  const [selectedAction, setSelectedAction] = useState<ActionRecommendation | null>(null)
  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])
  const { speak, stop, isPlaying, currentKpi } = useKpiAudio(liveKpis)

  const handleNarrate = () => {
    if (!recommendations.length) return
    if (isPlaying) { stop(); return }
    speak(recommendations[0].kpi)
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.logo}>STRATFIT</span>
        <nav className={styles.nav}>
          <NavLink to={ROUTES.INITIATE} className={styles.navItem}>Initiate</NavLink>
          <span className={styles.navDivider} />
          <NavLink to={ROUTES.POSITION} className={styles.navItem}>Position</NavLink>
          <span className={styles.navDivider} />
          <NavLink to={ROUTES.WHAT_IF} className={styles.navItem}>What If</NavLink>
          <span className={styles.navDivider} />
          <NavLink to={ROUTES.ACTIONS} className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>Actions</NavLink>
          <span className={styles.navDivider} />
          <NavLink to={ROUTES.TIMELINE} className={styles.navItem}>Timeline</NavLink>
          <span className={styles.navDivider} />
          <NavLink to={ROUTES.RISK} className={styles.navItem}>Risk</NavLink>
          <span className={styles.navDivider} />
          <NavLink to={ROUTES.COMPARE} className={styles.navItem}>Compare</NavLink>
        </nav>
        <button
          onClick={handleNarrate}
          style={{
            background: "none", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 6,
            padding: "6px 14px", color: "#22d3ee", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
          }}
        >
          {isPlaying ? "■ Stop" : "🔊 Narrate"}
        </button>
      </header>

      <div className={styles.body}>
        {/* Left: Ranked Actions */}
        <div className={styles.leftPanel}>
          <div className={styles.sectionTitle}>Highest Leverage Moves</div>
          {recommendations.map((rec) => (
            <div
              key={rec.kpi}
              className={selectedAction?.kpi === rec.kpi ? styles.actionCardActive : styles.actionCard}
              onClick={() => setSelectedAction(rec)}
            >
              <div className={styles.actionHeader}>
                <span className={styles.actionRank}>{rec.rank}</span>
                <span className={styles.actionHeadline}>{rec.headline}</span>
              </div>
              <div className={styles.actionImpact}>{rec.impactDescription}</div>
              <div className={styles.actionMeta}>
                <span className={styles.elevationBadge}>+{rec.totalElevationGain}% elevation</span>
                <span className={`${styles.difficultyBadge} ${
                  rec.difficulty === "low" ? styles.difficultyLow :
                  rec.difficulty === "medium" ? styles.difficultyMedium :
                  styles.difficultyHigh
                }`}>
                  {rec.difficulty} difficulty
                </span>
              </div>
              {liveKpis && (
                <div style={{ marginTop: 10 }}>
                  <MiniTerrainSilhouette
                    kpis={liveKpis}
                    highlightKpi={rec.kpi}
                    afterKpis={afterKpisMap.get(rec.kpi)}
                    width={180}
                    height={44}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(200,220,240,0.25)", marginTop: 2, letterSpacing: "0.06em" }}>
                    <span>BEFORE</span>
                    <span style={{ color: "rgba(34,211,238,0.4)" }}>AFTER</span>
                  </div>
                </div>
              )}
              <Link
                to={ROUTES.WHAT_IF}
                className={styles.applyButton}
                onClick={(e) => e.stopPropagation()}
              >
                Apply in What If →
              </Link>
            </div>
          ))}
        </div>

        {/* Centre: Terrain */}
        <div className={styles.centrePanel}>
          <TerrainStage
            progressive
            revealedKpis={revealedKpis}
            focusedKpi={selectedAction?.kpi ?? null}
            zoneKpis={liveKpis}
            cameraPreset={POSITION_PROGRESSIVE_PRESET}
            autoRotateSpeed={0.4}
            showDependencyLines={!!selectedAction}
            hideMarkers
            heatmapEnabled={false}
          >
            <SkyAtmosphere />
          </TerrainStage>
        </div>

        {/* Right: Detail + Effort-Impact Matrix */}
        <div className={styles.rightPanel}>
          {selectedAction ? (
            <>
              <div className={styles.sectionTitle}>Affected Zones</div>
              {selectedAction.affectedZones.map((zone) => (
                <div key={zone.kpi} className={styles.zoneItem}>
                  <span className={styles.zoneName}>{zone.label}</span>
                  <span className={styles.zoneDelta}>+{zone.elevationDelta}%</span>
                </div>
              ))}

              {/* Time horizon */}
              <div style={{ marginTop: 20, padding: "10px 12px", background: "rgba(15,25,45,0.5)", borderRadius: 8, border: "1px solid rgba(34,211,238,0.06)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(34,211,238,0.4)", marginBottom: 6 }}>Time Horizon</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedAction.horizon === "now" ? "#34d399" : selectedAction.horizon === "30d" ? "#fbbf24" : "#22d3ee" }}>
                  {selectedAction.horizon === "now" ? "Execute This Week" : selectedAction.horizon === "30d" ? "30-Day Initiative" : "90-Day Strategic Play"}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Effort-Impact Matrix when no action selected */}
              <div className={styles.sectionTitle}>Effort vs Impact</div>
              <svg width="100%" viewBox="0 0 240 240" style={{ display: "block", marginBottom: 12 }}>
                <rect x="0" y="0" width="240" height="240" fill="rgba(0,0,0,0.2)" rx="8" />
                {/* Quadrant labels */}
                <text x="60" y="20" fill="rgba(200,220,240,0.15)" fontSize="8" textAnchor="middle" fontWeight="600">LOW EFFORT</text>
                <text x="180" y="20" fill="rgba(200,220,240,0.15)" fontSize="8" textAnchor="middle" fontWeight="600">HIGH EFFORT</text>
                <text x="12" y="65" fill="rgba(200,220,240,0.15)" fontSize="7" textAnchor="middle" fontWeight="600" transform="rotate(-90,12,65)">HIGH IMPACT</text>
                {/* Grid */}
                <line x1="120" y1="10" x2="120" y2="230" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="10" y1="120" x2="230" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                {/* Quadrant fills */}
                <rect x="10" y="10" width="110" height="110" fill="rgba(52,211,153,0.04)" rx="4" />
                <text x="65" y="115" fill="rgba(52,211,153,0.2)" fontSize="7" textAnchor="middle">QUICK WINS</text>
                {/* Plot actions */}
                {recommendations.map((rec) => {
                  const x = 10 + (rec.effortScore / 10) * 220
                  const y = 230 - (rec.totalElevationGain / Math.max(...recommendations.map((r) => r.totalElevationGain), 1)) * 220
                  const color = rec.difficulty === "low" ? "#34d399" : rec.difficulty === "medium" ? "#fbbf24" : "#f87171"
                  return (
                    <g key={rec.kpi} onClick={() => setSelectedAction(rec)} style={{ cursor: "pointer" }}>
                      <circle cx={x} cy={y} r={8} fill={color} opacity={0.3} />
                      <circle cx={x} cy={y} r={4} fill={color} opacity={0.8} />
                      <text x={x} y={y - 12} fill="rgba(200,220,240,0.6)" fontSize="8" textAnchor="middle">{rec.rank}</text>
                    </g>
                  )
                })}
              </svg>
              <div style={{ fontSize: 10, color: "rgba(200,220,240,0.25)", textAlign: "center", lineHeight: 1.5 }}>
                Click a dot to select an action. Top-left = quick wins.
              </div>

              {/* Time horizon breakdown */}
              <div style={{ marginTop: 20 }}>
                <div className={styles.sectionTitle}>By Time Horizon</div>
                {(["now", "30d", "90d"] as const).map((h) => {
                  const items = recommendations.filter((r) => r.horizon === h)
                  if (items.length === 0) return null
                  const label = h === "now" ? "This Week" : h === "30d" ? "30 Days" : "90 Days"
                  const color = h === "now" ? "#34d399" : h === "30d" ? "#fbbf24" : "#22d3ee"
                  return (
                    <div key={h} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                      {items.map((r) => (
                        <div key={r.kpi} onClick={() => setSelectedAction(r)} style={{ padding: "6px 0", fontSize: 11, color: "rgba(200,220,240,0.5)", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          {r.rank}. {r.headline}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
