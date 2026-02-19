import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { MarkerDef } from "@/terrain/MarkerBeacon"
import {
  POSITION_ANCHORS,
  createAnchorInsights,
  createDefaultInsights,
  type AnchorKey,
  type NarrativeSelection,
} from "./positionNarrativeState"

type Ctx = {
  markers: MarkerDef[]
  anchors: typeof POSITION_ANCHORS
  hoveredId: string | null
  lockedId: string | null
  hoveredAnchor: AnchorKey | null
  lockedAnchor: AnchorKey | null
  selection: NarrativeSelection
  setHoveredId: (id: string | null) => void
  lockToMarker: (id: string) => void
  setHoveredAnchor: (k: AnchorKey | null) => void
  lockToAnchor: (k: AnchorKey) => void
  clearLock: () => void
  isLocked: boolean
}

const PositionNarrativeContext = createContext<Ctx | null>(null)

export function PositionNarrativeProvider({
  markers,
  children,
}: {
  markers: MarkerDef[]
  children: React.ReactNode
}) {
  const markerInsights = useMemo(() => createDefaultInsights(), [])
  const anchorInsights = useMemo(() => createAnchorInsights(), [])

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [lockedId, setLockedId] = useState<string | null>(null)

  const [hoveredAnchor, setHoveredAnchor] = useState<AnchorKey | null>(null)
  const [lockedAnchor, setLockedAnchor] = useState<AnchorKey | null>("now")

  const isLocked = lockedId != null || lockedAnchor != null

  const selection: NarrativeSelection = useMemo(() => {
    // Marker selection wins over anchor selection.
    const activeMarkerId = lockedId ?? hoveredId
    if (activeMarkerId) {
      const marker = markers.find((m) => m.id === activeMarkerId)
      if (marker) {
        return {
          mode: "marker",
          title: marker.label,
          markerId: marker.id,
          insight: markerInsights[marker.id],
        }
      }
    }

    const activeAnchor = lockedAnchor ?? hoveredAnchor ?? "now"
    return {
      mode: "anchor",
      title: `${POSITION_ANCHORS.find((a) => a.key === activeAnchor)?.label ?? "NOW"} — Position`,
      anchorKey: activeAnchor,
      insight: anchorInsights[activeAnchor],
    }
  }, [hoveredId, lockedId, hoveredAnchor, lockedAnchor, markers, markerInsights, anchorInsights])

  const lockToMarker = (id: string) => {
    setLockedAnchor(null)
    setLockedId(id)
  }

  const lockToAnchor = (k: AnchorKey) => {
    setLockedId(null)
    setLockedAnchor(k)
  }

  const clearLock = () => {
    setLockedId(null)
    setLockedAnchor("now")
  }

  // ESC clears lock back to NOW
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearLock()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const value: Ctx = {
    markers,
    anchors: POSITION_ANCHORS,
    hoveredId,
    lockedId,
    hoveredAnchor,
    lockedAnchor,
    selection,
    setHoveredId,
    lockToMarker,
    setHoveredAnchor,
    lockToAnchor,
    clearLock,
    isLocked,
  }

  return <PositionNarrativeContext.Provider value={value}>{children}</PositionNarrativeContext.Provider>
}

export function usePositionNarrative() {
  const ctx = useContext(PositionNarrativeContext)
  if (!ctx) throw new Error("usePositionNarrative must be used within PositionNarrativeProvider")
  return ctx
}
