import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"

export type MarkerVariant = "origin" | "current" | "milestone"

type Props = {
  position: THREE.Vector3 | [number, number, number]
  variant?: MarkerVariant
  color?: string
  opacity?: number
  liftY?: number
  renderOrder?: number

  // Optional overrides (rarely needed)
  sizePx?: number
  haloScale?: number
  haloOpacity?: number
  beam?: boolean
  beamHeight?: number

  // Legacy compat (ignored)
  halo?: boolean
}

type VariantConfig = {
  sizePx: number
  haloScale: number
  haloOpacity: number
  beam: boolean
  beamHeight: number
  pulse: boolean
  liftY: number
  renderOrder: number
  color: string
  opacity: number
}

const ORIGIN: VariantConfig = {
  sizePx: 14,
  haloScale: 1.8,
  haloOpacity: 0.28,
  beam: false,
  beamHeight: 0.0,
  pulse: false,
  liftY: 0.24,
  renderOrder: 160,
  color: "#EAFBFF",
  opacity: 0.92,
}

const CURRENT: VariantConfig = {
  sizePx: 18,
  haloScale: 2.6,
  haloOpacity: 0.38,
  beam: true,
  beamHeight: 0.9,
  pulse: true,
  liftY: 0.30,
  renderOrder: 180,
  color: "#EAFBFF",
  opacity: 0.98,
}

const MILESTONE: VariantConfig = {
  sizePx: 10,
  haloScale: 1.4,
  haloOpacity: 0.16,
  beam: true,
  beamHeight: 0.5,
  pulse: false,
  liftY: 0.26,
  renderOrder: 150,
  color: "rgba(234,251,255,0.75)",
  opacity: 0.88,
}

function getCfg(variant: MarkerVariant): VariantConfig {
  if (variant === "origin") return ORIGIN
  if (variant === "current") return CURRENT
  return MILESTONE
}

/**
 * Screen-space-ish marker: scales with distance so it stays readable.
 * Two sprites (core + halo) + optional beam pin.
 */
export function ScreenSpaceMarkerSprite({
  position,
  variant = "milestone",

  // Optional overrides
  color,
  opacity,
  liftY,
  renderOrder,
  sizePx,
  haloScale,
  haloOpacity,
  beam,
  beamHeight,
}: Props) {
  const cfgBase = getCfg(variant)
  const cfg: VariantConfig = {
    ...cfgBase,
    color: color ?? cfgBase.color,
    opacity: opacity ?? cfgBase.opacity,
    liftY: liftY ?? cfgBase.liftY,
    renderOrder: renderOrder ?? cfgBase.renderOrder,
    sizePx: sizePx ?? cfgBase.sizePx,
    haloScale: haloScale ?? cfgBase.haloScale,
    haloOpacity: haloOpacity ?? cfgBase.haloOpacity,
    beam: beam ?? cfgBase.beam,
    beamHeight: beamHeight ?? cfgBase.beamHeight,
  }

  const { camera } = useThree()
  const coreRef = useRef<THREE.Sprite>(null)
  const haloRef = useRef<THREE.Sprite>(null)

  const pos = useMemo(() => {
    const v = Array.isArray(position)
      ? new THREE.Vector3(position[0], position[1], position[2])
      : position.clone()
    v.y += cfg.liftY
    return v
  }, [position, cfg.liftY])

  const coreMat = useMemo(() => {
    return new THREE.SpriteMaterial({
      color: cfg.color as any,
      transparent: true,
      opacity: cfg.opacity,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [cfg.color, cfg.opacity])

  const haloMat = useMemo(() => {
    return new THREE.SpriteMaterial({
      color: cfg.color as any,
      transparent: true,
      opacity: cfg.haloOpacity,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [cfg.color, cfg.haloOpacity])

  // Beam pin material (world-space, but still glowy)
  const beamMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: cfg.color as any,
      transparent: true,
      opacity: 0.22,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [cfg.color])

  useFrame(() => {
    // Distance-based scaling so marker stays readable at hero cam.
    const distance = camera.position.distanceTo(pos)

    // Calibrated constant: worldUnitsPerPixel increases with distance
    const worldPerPx = distance * 0.00085
    const base = cfg.sizePx * worldPerPx

    // Pulse only for "current"
    let pulse = 1
    if (cfg.pulse) {
      const t = (performance.now() % 2400) / 2400
      pulse = 1 + Math.sin(t * Math.PI * 2) * 0.12
    }

    if (coreRef.current) {
      coreRef.current.position.copy(pos)
      coreRef.current.scale.setScalar(base * pulse)
      coreRef.current.renderOrder = cfg.renderOrder
    }
    if (haloRef.current) {
      haloRef.current.position.copy(pos)
      haloRef.current.scale.setScalar(base * cfg.haloScale * pulse)
      haloRef.current.renderOrder = cfg.renderOrder - 1
    }
  })

  return (
    <group>
      {/* Halo underlay */}
      <sprite ref={haloRef}>
        <primitive object={haloMat} attach="material" />
      </sprite>

      {/* Core */}
      <sprite ref={coreRef}>
        <primitive object={coreMat} attach="material" />
      </sprite>

      {/* Optional beam pin */}
      {cfg.beam && cfg.beamHeight > 0 ? (
        <mesh
          position={[pos.x, pos.y + cfg.beamHeight / 2, pos.z]}
          renderOrder={cfg.renderOrder - 2}
        >
          <cylinderGeometry args={[0.018, 0.018, cfg.beamHeight, 6, 1]} />
          <primitive object={beamMat} attach="material" />
        </mesh>
      ) : null}
    </group>
  )
}

export default ScreenSpaceMarkerSprite
