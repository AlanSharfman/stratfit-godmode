// src/terrain/markerTypes.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Marker type definitions (extracted from deleted MarkerBeacon.tsx)
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from "three"

export type MarkerKind = "risk" | "constraint" | "milestone" | "opportunity" | "signal"

export type MarkerDef = {
  id: string
  kind: MarkerKind
  label: string
  position: THREE.Vector3
  color?: string
}
