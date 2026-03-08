// src/terrain/CameraDriftSystem.tsx
// Two-level camera drift: MICRO_DRIFT (default) and CINEMATIC_MODE.
// Micro drift adds barely-perceptible life during normal interaction.
// Cinematic mode adds larger, slower sweeps for Boardroom playback.
// Both modes pause on user interaction, resume smoothly after cooldown.

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import type { DriftMode } from "@/scene/camera/cameraDriftConfig"
import { MICRO_DRIFT, CINEMATIC_DRIFT, OSCILLATE_DRIFT } from "@/scene/camera/cameraDriftConfig"
import type { DriftConfig, CinematicDriftConfig, OscillateDriftConfig } from "@/scene/camera/cameraDriftConfig"

function getConfig(mode: DriftMode): (DriftConfig & Partial<CinematicDriftConfig>) | null {
  if (mode === "micro") return MICRO_DRIFT
  if (mode === "cinematic") return CINEMATIC_DRIFT
  return null
}

function getOscillateConfig(mode: DriftMode): OscillateDriftConfig | null {
  if (mode === "oscillate") return OSCILLATE_DRIFT
  return null
}

const TWO_PI = Math.PI * 2
const DEG2RAD = Math.PI / 180

interface CameraDriftSystemProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  mode: DriftMode
}

export default function CameraDriftSystem({
  controlsRef,
  mode,
}: CameraDriftSystemProps) {
  const { camera } = useThree()

  const basePos = useRef<[number, number, number] | null>(null)
  const baseTarget = useRef<[number, number, number] | null>(null)
  const startMs = useRef(performance.now())
  const lastInteractMs = useRef(0)
  const lastFrameMs = useRef(0)
  const wasInteracting = useRef(false)
  const prevMode = useRef<DriftMode>(mode)

  useEffect(() => {
    if (prevMode.current !== mode) {
      basePos.current = null
      baseTarget.current = null
      startMs.current = performance.now()
      prevMode.current = mode
    }
  }, [mode])

  useFrame(() => {
    const controls = controlsRef.current
    if (!controls) return

    const now = performance.now()

    const interacting = !!(controls as unknown as Record<string, unknown>)._isDragging
    const isZooming = !!(controls as unknown as Record<string, unknown>)._isZooming

    if (interacting || isZooming) {
      wasInteracting.current = true
      lastInteractMs.current = now
      return
    }

    if (wasInteracting.current) {
      wasInteracting.current = false
      basePos.current = [camera.position.x, camera.position.y, camera.position.z]
      const t = controls.target
      baseTarget.current = [t.x, t.y, t.z]
      startMs.current = now
    }

    // ── Oscillate mode: ultra-smooth sinusoidal azimuth sweep ──
    const oscCfg = getOscillateConfig(mode)
    if (oscCfg) {
      if (!basePos.current) {
        basePos.current = [camera.position.x, camera.position.y, camera.position.z]
        const t = controls.target
        baseTarget.current = [t.x, t.y, t.z]
        startMs.current = now
      }

      const cooldownMs = oscCfg.cooldownSeconds * 1000
      const sinceInteract = now - lastInteractMs.current
      if (sinceInteract < cooldownMs) return

      const fadeIn = Math.min(1, (sinceInteract - cooldownMs) / 6000)
      const smoothFade = fadeIn * fadeIn * (3 - 2 * fadeIn)

      const elapsed = (now - startMs.current) / 1000
      const phase = (elapsed / oscCfg.cycle) * TWO_PI
      const azOffset = Math.sin(phase) * oscCfg.amplitude * smoothFade

      const [bx, , bz] = basePos.current
      const [tx, , tz] = baseTarget.current!

      const dx = bx - tx
      const dz = bz - tz
      const dist = Math.sqrt(dx * dx + dz * dz)
      const baseAngle = Math.atan2(dx, dz)

      const goalAngle = baseAngle + azOffset
      const goalX = tx + Math.sin(goalAngle) * dist
      const goalZ = tz + Math.cos(goalAngle) * dist

      const frameLerp = 1 - Math.pow(1 - oscCfg.lerpRate, 60 / 1000 * (now - (lastFrameMs.current || now - 16)))
      lastFrameMs.current = now

      camera.position.x += (goalX - camera.position.x) * frameLerp
      camera.position.z += (goalZ - camera.position.z) * frameLerp

      controls.update()
      return
    }

    // ── Micro / Cinematic drift ──
    const cfg = getConfig(mode)
    if (!cfg) return

    if (!basePos.current) {
      basePos.current = [camera.position.x, camera.position.y, camera.position.z]
      const t = controls.target
      baseTarget.current = [t.x, t.y, t.z]
      startMs.current = now
    }

    const cooldownMs = cfg.cooldownSeconds * 1000
    const sinceInteract = now - lastInteractMs.current
    if (sinceInteract < cooldownMs) return

    const fadeIn = Math.min(1, (sinceInteract - cooldownMs) / 2000)

    const elapsed = (now - startMs.current) / 1000
    const cycleRad = TWO_PI / cfg.cycle

    const [bx, by, bz] = basePos.current
    const [tx, ty, tz] = baseTarget.current!

    const phaseX = 1.000
    const phaseY = 0.618
    const phaseZ = 0.382

    let dx = Math.sin(elapsed * cycleRad * phaseX) * cfg.horizontal * fadeIn
    const dy = Math.sin(elapsed * cycleRad * phaseY) * cfg.vertical * fadeIn
    let dz = Math.cos(elapsed * cycleRad * phaseZ) * cfg.depth * fadeIn

    const dtx = Math.sin(elapsed * cycleRad * 0.75) * cfg.lookAtHorizontal * fadeIn
    const dty = Math.cos(elapsed * cycleRad * 0.55) * cfg.lookAtVertical * fadeIn

    if (mode === "cinematic" && (cfg as CinematicDriftConfig).rotationDegrees) {
      const rotRad = (cfg as CinematicDriftConfig).rotationDegrees * DEG2RAD
      const rotOffset = Math.sin(elapsed * cycleRad * 0.3) * rotRad
      const dist = Math.sqrt((bx - tx) ** 2 + (bz - tz) ** 2)
      dx += Math.sin(rotOffset) * dist * fadeIn * 0.02
      dz += (1 - Math.cos(rotOffset)) * dist * fadeIn * 0.02
    }

    const goalX = bx + dx
    const goalY = by + dy
    const goalZ = bz + dz

    camera.position.x += (goalX - camera.position.x) * cfg.lerpRate
    camera.position.y += (goalY - camera.position.y) * cfg.lerpRate
    camera.position.z += (goalZ - camera.position.z) * cfg.lerpRate

    const goalTx = tx + dtx
    const goalTy = ty + dty

    controls.target.x += (goalTx - controls.target.x) * cfg.lerpRate
    controls.target.y += (goalTy - controls.target.y) * cfg.lerpRate
    controls.target.z += (tz - controls.target.z) * cfg.lerpRate

    controls.update()
  })

  return null
}
