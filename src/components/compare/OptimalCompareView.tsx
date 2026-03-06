import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel } from "@/pages/position/overlays/positionState"
import TerrainStage from "@/terrain/TerrainStage"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { POSITION_PROGRESSIVE_PRESET } from "@/scene/camera/terrainCameraPresets"
import { KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"
import { computeOptimalKpis, generateOptimalNarrative } from "@/engine/optimalTerrain"

const S: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    height: "100%",
    gap: 2,
    background: "#0A1220",
  },
  panel: {
    flex: 1,
    position: "relative",
    minHeight: 400,
  },
  label: {
    position: "absolute",
    top: 12,
    left: 16,
    zIndex: 10,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    padding: "5px 12px",
    borderRadius: 4,
    background: "rgba(12,20,34,0.8)",
    backdropFilter: "blur(8px)",
  },
  labelCurrent: {
    color: "rgba(200,220,240,0.6)",
    border: "1px solid rgba(200,220,240,0.12)",
  },
  labelOptimal: {
    color: "#22d3ee",
    border: "1px solid rgba(34,211,238,0.2)",
  },
  narrative: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "20px 24px",
    background: "linear-gradient(transparent 0%, rgba(12,20,34,0.85) 100%)",
    zIndex: 10,
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(200,220,240,0.6)",
    textAlign: "center",
  },
}

export default function OptimalCompareView() {
  const { baseline } = useSystemBaseline()
  const [isNarrating, setIsNarrating] = useState(false)

  const currentKpis = useMemo(() => {
    if (!baseline) return null
    return buildPositionViewModel(baseline as any).kpis
  }, [baseline])

  const optimalKpis = useMemo(() => {
    if (!currentKpis) return null
    return computeOptimalKpis(currentKpis)
  }, [currentKpis])

  const narrative = useMemo(() => {
    if (!currentKpis || !optimalKpis) return ""
    return generateOptimalNarrative(currentKpis, optimalKpis)
  }, [currentKpis, optimalKpis])

  const revealedKpis = useMemo(() => new Set(KPI_KEYS), [])

  const toggleNarrate = useCallback(() => {
    if (typeof speechSynthesis === "undefined") return
    if (isNarrating) {
      speechSynthesis.cancel()
      setIsNarrating(false)
      return
    }
    if (!narrative) return
    const utterance = new SpeechSynthesisUtterance(narrative)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.onend = () => setIsNarrating(false)
    utterance.onerror = () => setIsNarrating(false)
    speechSynthesis.speak(utterance)
    setIsNarrating(true)
  }, [isNarrating, narrative])

  useEffect(() => {
    return () => {
      if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel()
    }
  }, [])

  if (!currentKpis || !optimalKpis) {
    return (
      <div style={{ ...S.root, alignItems: "center", justifyContent: "center", color: "rgba(200,220,240,0.3)", fontSize: 13 }}>
        Baseline data required for vs Optimal comparison
      </div>
    )
  }

  return (
    <div style={S.root}>
      {/* Current */}
      <div style={S.panel}>
        <div style={{ ...S.label, ...S.labelCurrent }}>CURRENT</div>
        <TerrainStage
          progressive
          revealedKpis={revealedKpis}
          zoneKpis={currentKpis}
          focusedKpi={null}
          cameraPreset={POSITION_PROGRESSIVE_PRESET}
          autoRotateSpeed={0.2}
          hideMarkers
          heatmapEnabled={false}
        >
          <SkyAtmosphere />
        </TerrainStage>
      </div>

      {/* Optimal */}
      <div style={S.panel}>
        <div style={{ ...S.label, ...S.labelOptimal }}>AI OPTIMAL</div>
        <TerrainStage
          progressive
          revealedKpis={revealedKpis}
          zoneKpis={optimalKpis}
          focusedKpi={null}
          cameraPreset={POSITION_PROGRESSIVE_PRESET}
          autoRotateSpeed={0.2}
          hideMarkers
          heatmapEnabled={false}
        >
          <SkyAtmosphere />
        </TerrainStage>
      </div>

      {/* Narrative overlay with audio */}
      <div style={S.narrative}>
        <span>{narrative}</span>
        {narrative && (
          <button
            onClick={toggleNarrate}
            style={{
              marginLeft: 16,
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: 6,
              padding: "5px 14px",
              color: "#22d3ee",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              cursor: "pointer",
              whiteSpace: "nowrap" as const,
            }}
          >
            {isNarrating ? "■ Stop" : "🔊 Narrate"}
          </button>
        )}
      </div>
    </div>
  )
}
