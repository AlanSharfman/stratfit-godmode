import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"

export type MarkerVariant = "origin" | "current" | "milestone"

type Props = {
  position: THREE.Vector3 | [number, number, number]
  variant?: MarkerVariant
  color?: string
  sizePx?: number
  opacity?: number
  liftY?: number
  renderOrder?: number
}

type VariantCfg = {
  sizePx: number
  haloScale: number
  haloOpacity: number
  liftY: number
  renderOrder: number
  opacity: number
  pulse: boolean
}

const CFG: Record<MarkerVariant, VariantCfg> = {
  origin: {
    sizePx: 14,
    haloScale: 1.8,
    haloOpacity: 0.22,
    liftY: 0.24,
    renderOrder: 160,
    opacity: 0.92,
    pulse: false,
  },
  current: {
    sizePx: 18,
    haloScale: 2.6,
    haloOpacity: 0.34,
    liftY: 0.30,
    renderOrder: 180,
    opacity: 0.98,
    pulse: true,
  },
  milestone: {
    sizePx: 11,
    haloScale: 1.4,
    haloOpacity: 0.14,
    liftY: 0.26,
    renderOrder: 150,
    opacity: 0.88,
    pulse: false,
  },
}

function makeRadialTexture(kind: "core" | "halo") {
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!

  ctx.clearRect(0, 0, size, size)

  const cx = size / 2
  const cy = size / 2
  const r = size / 2

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)

  if (kind === "core") {
    // tight core + soft edge (no square)
    g.addColorStop(0.0, "rgba(255,255,255,1.0)")
    g.addColorStop(0.22, "rgba(255,255,255,1.0)")
    g.addColorStop(0.55, "rgba(255,255,255,0.35)")
    g.addColorStop(1.0, "rgba(255,255,255,0.0)")
  } else {
    // halo: mostly transparent with wide falloff
    g.addColorStop(0.0, "rgba(255,255,255,0.55)")
    g.addColorStop(0.35, "rgba(255,255,255,0.25)")
    g.addColorStop(1.0, "rgba(255,255,255,0.0)")
  }

  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

export function ScreenSpaceMarkerSprite({
  position,
  variant = "milestone",
  color = "#EAFBFF",
  sizePx,
  opacity,
  liftY,
  renderOrder,
}: Props) {
  const { camera } = useThree()
  const coreRef = useRef<THREE.Sprite>(null)
  const haloRef = useRef<THREE.Sprite>(null)

  const cfg = CFG[variant]
  const finalSizePx = sizePx ?? cfg.sizePx
  const finalOpacity = opacity ?? cfg.opacity
  const finalLiftY = liftY ?? cfg.liftY
  const finalRenderOrder = renderOrder ?? cfg.renderOrder

  const pos = useMemo(() => {
    const v = Array.isArray(position)
      ? new THREE.Vector3(position[0], position[1], position[2])
      : position.clone()
    v.y += finalLiftY
    return v
  }, [position, finalLiftY])

  const coreMap = useMemo(() => makeRadialTexture("core"), [])
  const haloMap = useMemo(() => makeRadialTexture("halo"), [])

  const coreMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: coreMap,
        color: color as any,
        transparent: true,
        opacity: finalOpacity,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [coreMap, color, finalOpacity]
  )

  const haloMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: haloMap,
        color: color as any,
        transparent: true,
        opacity: cfg.haloOpacity,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [haloMap, color, cfg.haloOpacity]
  )

  useFrame(() => {
    const distance = camera.position.distanceTo(pos)

    // tuned: keeps readable at your hero camera without blowing up close
    const worldPerPx = THREE.MathUtils.clamp(distance * 0.00085, 0.02, 0.28)
    const base = finalSizePx * worldPerPx

    let pulse = 1
    if (cfg.pulse) {
      const t = (performance.now() % 2400) / 2400
      pulse = 1 + Math.sin(t * Math.PI * 2) * 0.12
    }

    if (coreRef.current) {
      coreRef.current.position.copy(pos)
      coreRef.current.scale.setScalar(base * pulse)
      coreRef.current.renderOrder = finalRenderOrder
    }
    if (haloRef.current) {
      haloRef.current.position.copy(pos)
      haloRef.current.scale.setScalar(base * cfg.haloScale * pulse)
      haloRef.current.renderOrder = finalRenderOrder - 1
    }
  })

  return (
    <group>
      <sprite ref={haloRef}>
        <primitive object={haloMat} attach="material" />
      </sprite>
      <sprite ref={coreRef}>
        <primitive object={coreMat} attach="material" />
      </sprite>
    </group>
  )
}

// Optional default export for convenience (doesn't break named import)
export default ScreenSpaceMarkerSprite
