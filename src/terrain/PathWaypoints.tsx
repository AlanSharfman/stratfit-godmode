// src/terrain/PathWaypoints.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Path-Anchored Waypoints (God Mode UX)
//
// Renders 5 glowing waypoint markers DIRECTLY ON the P50 strategic path:
//   Liquidity Horizon → Capital Raise → Revenue Acceleration →
//   Margin Expansion → Strategic Scale
//
// Each waypoint is sampled at a t-position along the CatmullRom spline,
// ensuring markers always track the path trajectory — not scattered randomly.
//
// Visual: colour-coded orb + stem + sleek frosted-glass label with colour
// accent border (NOT a black pill).
//
// R3F component — must be mounted inside <Canvas> / TerrainStage.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { PATH_WAYPOINT_DEFS } from "./strategicMarkerDefs"
import type { PathWaypointDef } from "./strategicMarkerDefs"

// ── Constants ──

/** Offset above path centreline so waypoints float above the tube */
const WAYPOINT_LIFT = 2.5

// ── Single Waypoint ──

interface WaypointProps {
  def: PathWaypointDef
  position: THREE.Vector3
}

const SingleWaypoint: React.FC<WaypointProps> = memo(({ def, position }) => {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const orbRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  const color = useMemo(() => new THREE.Color(def.color), [def.color])

  useFrame(({ clock }) => {
    const g = groupRef.current
    if (!g) return

    // Gentle floating bob
    const bob = Math.sin(clock.elapsedTime * 1.5 + def.t * 10) * 0.3
    g.position.set(position.x, position.y + WAYPOINT_LIFT + bob, position.z)

    // Distance-adaptive scale
    const d = camera.position.distanceTo(g.position)
    const s = THREE.MathUtils.clamp(d * 0.018, 0.8, 2.8)
    g.scale.setScalar(s)

    // Orb pulse
    if (orbRef.current) {
      const mat = orbRef.current.material as THREE.MeshStandardMaterial
      if (mat) {
        mat.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 2.0 + def.t * 8) * 0.2
      }
    }

    // Ring pulse
    if (ringRef.current) {
      const scale = 1.0 + Math.sin(clock.elapsedTime * 1.2 + def.t * 6) * 0.15
      ringRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group ref={groupRef} position={[position.x, position.y + WAYPOINT_LIFT, position.z]}>
      {/* Vertical stem connecting to path */}
      <mesh position={[0, -WAYPOINT_LIFT * 0.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, WAYPOINT_LIFT, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Orb — glowing sphere at waypoint position */}
      <mesh ref={orbRef} renderOrder={210}>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.65}
          metalness={0.15}
          roughness={0.2}
          transparent
          opacity={0.92}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Expanding ring halo */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={209}>
        <ringGeometry args={[0.55, 0.72, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Small base glow on the path surface */}
      <mesh position={[0, -WAYPOINT_LIFT, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={208}>
        <circleGeometry args={[1.2, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Label — sleek colour-accented floating tag */}
      <Html
        position={[0, 1.1, 0]}
        center
        style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        zIndexRange={[40, 0]}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "4px 12px",
            borderRadius: 6,
            background: "rgba(6, 12, 20, 0.88)",
            border: `1px solid ${def.color}50`,
            color: def.color,
            boxShadow: `0 0 12px ${def.color}25, 0 4px 16px rgba(0,0,0,0.5)`,
            backdropFilter: "blur(12px)",
            fontFamily: "'Inter', system-ui, sans-serif",
            userSelect: "none",
          }}
        >
          {def.label}
        </div>
      </Html>
    </group>
  )
})
SingleWaypoint.displayName = "SingleWaypoint"

// ── Main Component ──

interface PathWaypointsProps {
  /** CatmullRom curve from P50Path — waypoints are sampled along this */
  pathCurve: THREE.CatmullRomCurve3 | null
}

const PathWaypoints: React.FC<PathWaypointsProps> = memo(({ pathCurve }) => {
  // Sample positions from curve at each waypoint's t-value
  const waypointPositions = useMemo(() => {
    if (!pathCurve) return []
    return PATH_WAYPOINT_DEFS.map((def) => ({
      def,
      position: pathCurve.getPointAt(def.t),
    }))
  }, [pathCurve])

  if (!waypointPositions.length) return null

  return (
    <group name="path-waypoints">
      {waypointPositions.map(({ def, position }) => (
        <SingleWaypoint key={def.id} def={def} position={position} />
      ))}
    </group>
  )
})

PathWaypoints.displayName = "PathWaypoints"
export default PathWaypoints
