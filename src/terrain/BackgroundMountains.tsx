import React, { useMemo } from "react"
import * as THREE from "three"

/**
 * BackgroundMountains — distant rolling peaks that recede into atmospheric depth fog.
 * Creates 3 layers of mountain silhouettes at increasing Z-depth, each progressively
 * more faded by fog. Purely visual — no collision / height queries.
 */

interface MountainRangeProps {
  zOffset: number
  yScale: number
  opacity: number
  color: string
  emissive: string
  emissiveIntensity: number
  seed: number
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function MountainRange({ zOffset, yScale, opacity, color, emissive, emissiveIntensity, seed }: MountainRangeProps) {
  const geometry = useMemo(() => {
    const width = 800
    const depth = 120
    const segsX = 120
    const segsZ = 12
    const geo = new THREE.PlaneGeometry(width, depth, segsX, segsZ)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const rand = mulberry32(seed)

    // Generate a few peaks for this range
    const peaks = Array.from({ length: 6 }).map(() => ({
      px: (rand() - 0.5) * width * 0.8,
      amp: 8 + rand() * 28 * yScale,
      spread: 30 + rand() * 60,
    }))

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getY(i) // PlaneGeometry X/Y, rotated later

      let h = 0
      // Broad undulation
      h += Math.sin(x * 0.015 + seed * 0.01) * 4 * yScale
      h += Math.sin(x * 0.007 - seed * 0.005) * 8 * yScale

      // Peaks
      for (const p of peaks) {
        const dx = x - p.px
        const d2 = (dx * dx) / (p.spread * p.spread)
        h += p.amp * Math.exp(-d2)
      }

      // Edge falloff
      const edgeFade = 1 - Math.pow(Math.abs(x) / (width * 0.5), 3)
      h *= Math.max(0, edgeFade)

      // Valley floor clamp
      h = Math.max(-1, h)

      pos.setZ(i, h)
    }

    geo.computeVertexNormals()
    geo.computeBoundingSphere()
    return geo
  }, [seed, yScale])

  return (
    <mesh
      geometry={geometry}
      position={[0, -8, zOffset]}
      rotation={[-Math.PI / 2, 0, 0]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={opacity}
        roughness={0.95}
        metalness={0.0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

/**
 * Three layers of background mountains at increasing depth.
 * Layer 1: Near background — slightly dimmer, moderate height
 * Layer 2: Mid background — fainter, taller and wider
 * Layer 3: Far background — very faint, massive silhouettes
 */
export default function BackgroundMountains() {
  return (
    <group>
      {/* Near background range */}
      <MountainRange
        zOffset={-200}
        yScale={1.0}
        opacity={0.35}
        color="#0a1628"
        emissive="#0c4a6e"
        emissiveIntensity={0.15}
        seed={42}
      />

      {/* Mid background range */}
      <MountainRange
        zOffset={-380}
        yScale={1.4}
        opacity={0.22}
        color="#081220"
        emissive="#075985"
        emissiveIntensity={0.10}
        seed={137}
      />

      {/* Far background range */}
      <MountainRange
        zOffset={-600}
        yScale={1.8}
        opacity={0.12}
        color="#060e18"
        emissive="#0369a1"
        emissiveIntensity={0.06}
        seed={256}
      />
    </group>
  )
}
