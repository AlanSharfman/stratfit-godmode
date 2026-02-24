import React from "react"
import { useTerrainHeat } from "@/logic/terrain/useTerrainHeat"

/**
 * LavaHeatOverlay — DOM CSS overlay (NOT a Three.js component)
 *
 * Position this as an absolutely-placed sibling OUTSIDE <Canvas>,
 * layered on top of the terrain viewport via z-index / pointer-events: none.
 *
 * Driven by useTerrainHeat() — blend of canonical lava + strategic signal stress.
 *
 * NO store writes. NO effects. Pure read-only render.
 */
export default function LavaHeatOverlay() {
  const heat = useTerrainHeat()

  // Map heat → visual strength
  const opacity = 0.15 + heat * 0.45
  const blur = 8 + heat * 22
  const glowScale = 1 + heat * 0.25

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
        transform: `scale(${glowScale})`,
        backdropFilter: `blur(${blur}px)`,
        background:
          "radial-gradient(ellipse at 50% 60%, rgba(255,80,0,0.18), transparent 60%)",
        transition: "opacity 240ms ease, transform 240ms ease, backdrop-filter 240ms ease",
      }}
    />
  )
}
