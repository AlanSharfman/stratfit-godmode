import React, { memo, useRef, useCallback, useMemo } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import type { ProgressiveTerrainHandle } from "@/terrain/ProgressiveTerrainSurface"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import type { OpportunitySignal } from "./opportunitySignals"
import OpportunityPanel from "./OpportunityPanel"

const EMERALD = "#10b981"
const EMERALD_3 = new THREE.Color(EMERALD)
const MARKER_LIFT = 8
const ORB_RADIUS = 2.5
const STEM_HEIGHT = 12
const PULSE_SPEED = 1.8
const RING_EXPAND_SPEED = 0.8

interface Props {
  signal: OpportunitySignal
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
  isActive: boolean
  onSelect: (id: string | null) => void
}

const OpportunityBeacon: React.FC<Props> = memo(({ signal, terrainRef, isActive, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null)
  const orbRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const pulseRingRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const worldX = useMemo(
    () => (signal.cx - 0.5) * TERRAIN_CONSTANTS.width * 3.0,
    [signal.cx],
  )

  useFrame(({ clock }) => {
    const g = groupRef.current
    if (!g) return

    const terrain = terrainRef.current
    const y = terrain ? terrain.getHeightAt(worldX, signal.cz) + MARKER_LIFT : MARKER_LIFT
    g.position.set(worldX, y, signal.cz)

    const d = camera.position.distanceTo(g.position)
    const s = THREE.MathUtils.clamp(d * 0.018, 0.8, 2.8)
    g.scale.setScalar(s)

    const t = clock.elapsedTime
    const pulse = 0.5 + 0.5 * Math.sin(t * PULSE_SPEED)

    if (orbRef.current) {
      const mat = orbRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.8 + pulse * (isActive ? 1.6 : 1.2)
    }
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + 0.15 * Math.sin(t * PULSE_SPEED * 0.7)
    }
    if (pulseRingRef.current) {
      const cycle = (t * RING_EXPAND_SPEED) % 1
      const ringScale = 1 + cycle * 4
      pulseRingRef.current.scale.set(ringScale, ringScale, 1)
      const mat = pulseRingRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - cycle) * (isActive ? 0.3 : 0.18)
    }
  })

  const handleClick = useCallback(
    (e: { stopPropagation?: () => void }) => {
      e.stopPropagation?.()
      onSelect(isActive ? null : signal.id)
    },
    [onSelect, isActive, signal.id],
  )

  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = "pointer"
  }, [])
  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = ""
  }, [])

  return (
    <group
      ref={groupRef}
      name={`opportunity-beacon-${signal.id}`}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Stem */}
      <mesh position={[0, -STEM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, STEM_HEIGHT, 8]} />
        <meshStandardMaterial
          color={EMERALD_3}
          emissive={EMERALD_3}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Orb */}
      <mesh ref={orbRef} renderOrder={200}>
        <sphereGeometry args={[ORB_RADIUS, 24, 24]} />
        <meshStandardMaterial
          color={EMERALD_3}
          emissive={EMERALD_3}
          emissiveIntensity={1.0}
          metalness={0.3}
          roughness={0.2}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Halo ring */}
      <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={199}>
        <ringGeometry args={[ORB_RADIUS + 0.5, ORB_RADIUS + 1.5, 32]} />
        <meshBasicMaterial
          color={EMERALD_3}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Expanding pulse ring */}
      <mesh ref={pulseRingRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={198}>
        <ringGeometry args={[ORB_RADIUS + 0.5, ORB_RADIUS + 1.0, 32]} />
        <meshBasicMaterial
          color={EMERALD_3}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Label */}
      <Html
        position={[0, ORB_RADIUS + 2.5, 0]}
        center
        style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "3px 10px",
            borderRadius: 5,
            background: "rgba(6, 12, 20, 0.88)",
            border: `1px solid rgba(16,185,129,0.3)`,
            color: EMERALD,
            boxShadow: `0 0 10px rgba(16,185,129,0.2), 0 3px 12px rgba(0,0,0,0.5)`,
            backdropFilter: "blur(10px)",
            fontFamily: "'Inter', system-ui, sans-serif",
            userSelect: "none",
          }}
        >
          {signal.title}
        </div>
      </Html>

      {/* Detail panel (shown when active) */}
      {isActive && (
        <Html
          position={[0, -(STEM_HEIGHT + 4), 0]}
          center
          style={{ pointerEvents: "auto" }}
        >
          <OpportunityPanel signal={signal} onClose={() => onSelect(null)} />
        </Html>
      )}
    </group>
  )
})

OpportunityBeacon.displayName = "OpportunityBeacon"
export default OpportunityBeacon
