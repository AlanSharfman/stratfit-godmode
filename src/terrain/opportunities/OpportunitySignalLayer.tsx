import React, { memo, useMemo, useState, useCallback } from "react"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ProgressiveTerrainHandle } from "@/terrain/ProgressiveTerrainSurface"
import { deriveOpportunitySignals } from "./opportunitySignals"
import OpportunityBeacon from "./OpportunityBeacon"

interface Props {
  kpis: PositionKpis | null | undefined
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
}

/**
 * Renders up to 3 opportunity beacon markers on the terrain surface.
 * Manages which beacon's detail panel is currently open.
 */
const OpportunitySignalLayer: React.FC<Props> = memo(({ kpis, terrainRef }) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  const signals = useMemo(() => deriveOpportunitySignals(kpis), [kpis])

  const handleSelect = useCallback((id: string | null) => {
    setActiveId(id)
  }, [])

  if (signals.length === 0) return null

  return (
    <group name="opportunity-signals">
      {signals.map((sig) => (
        <OpportunityBeacon
          key={sig.id}
          signal={sig}
          terrainRef={terrainRef}
          isActive={activeId === sig.id}
          onSelect={handleSelect}
        />
      ))}
    </group>
  )
})

OpportunitySignalLayer.displayName = "OpportunitySignalLayer"
export default OpportunitySignalLayer
