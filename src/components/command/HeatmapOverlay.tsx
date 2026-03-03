// src/components/command/HeatmapOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Heatmap Overlay (Command Centre — God Mode)
//
// Low-opacity gradient overlay using terrainMetrics variance / riskIndex.
// Subtle. Institutional. No scroll.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"

interface HeatmapOverlayProps {
  terrainMetrics: TerrainMetrics | null | undefined
  riskScore: number
  visible: boolean
}

const HeatmapOverlay: React.FC<HeatmapOverlayProps> = memo(
  ({ terrainMetrics, riskScore, visible }) => {
    const gradient = useMemo(() => {
      if (!terrainMetrics) return "transparent"
      const vol = Math.min(terrainMetrics.volatility ?? 0, 1)
      const rough = Math.min((terrainMetrics.roughness ?? 1) / 4, 1)
      const risk = Math.min(riskScore / 100, 1)

      // Red channel = risk, Blue channel = volatility, Green = inverse roughness
      const r = Math.round(risk * 180)
      const g = Math.round((1 - rough) * 60)
      const b = Math.round(vol * 200)

      return `radial-gradient(ellipse at 50% 60%, rgba(${r},${g},${b},0.12) 0%, rgba(${r},${g},${b},0.04) 50%, transparent 80%)`
    }, [terrainMetrics, riskScore])

    if (!visible) return null

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          borderRadius: "inherit",
          background: gradient,
          transition: "opacity 400ms ease",
          opacity: 1,
        }}
        aria-hidden="true"
      />
    )
  },
)

HeatmapOverlay.displayName = "HeatmapOverlay"
export default HeatmapOverlay
