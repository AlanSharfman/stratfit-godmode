// src/terrain/StrategicMarkerBeacon.tsx
// WHY: Lightweight marker beacon that renders inside TerrainStage WITHOUT
// requiring PositionNarrativeProvider. Replaces MarkerBeacon dependency
// so StrategicMarkers can be safely mounted in the Position page canvas.

import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import type { MarkerDef, MarkerKind } from "./MarkerBeacon"

function colorForKind(kind: MarkerKind): string {
  switch (kind) {
    case "risk":        return "#ff3b30"
    case "opportunity": return "#00e28a"
    case "milestone":   return "#00e0ff"
    case "signal":      return "#7c5cff"
    case "constraint":
    default:            return "#8fdcff"
  }
}

export default function StrategicMarkerBeacon({ marker }: { marker: MarkerDef }) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  const baseColor = useMemo(
    () => new THREE.Color(marker.color ?? colorForKind(marker.kind)),
    [marker.kind, marker.color],
  )

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const d = camera.position.distanceTo(g.position)
    const s = THREE.MathUtils.clamp(d * 0.02, 0.65, 2.25)
    g.scale.setScalar(s)
  })

  return (
    <group ref={groupRef} position={marker.position}>
      {/* Stem */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 10]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.25}
          metalness={0.1}
          roughness={0.35}
        />
      </mesh>

      {/* Orb */}
      <mesh>
        <sphereGeometry args={[0.22, 22, 22]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.55}
          metalness={0.2}
          roughness={0.25}
        />
      </mesh>

      {/* Label (billboard via Html) */}
      <Html
        position={[0, 0.55, 0]}
        center
        style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
      >
        <div
          style={{
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(8,12,16,0.72)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "rgba(255,255,255,0.92)",
            boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
            backdropFilter: "blur(10px)",
          }}
        >
          {marker.label}
        </div>
      </Html>
    </group>
  )
}
