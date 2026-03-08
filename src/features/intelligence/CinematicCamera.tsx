// src/features/intelligence/CinematicCamera.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Cinematic Camera Engine (Executive Briefing)
//
// Drives smooth, interpolated camera choreography during briefing.
// Disables manual controls while active. No jitter, no rapid zoom.
// Max 6 shots, 4–8s each. Slight overshoot settle (1.5%).
//
// Must mount INSIDE R3F <Canvas>.
// ═══════════════════════════════════════════════════════════════════════════

import { memo, useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useTerrainControls } from "@/terrain/useTerrainControls"

/* ── Shot types ── */

export type ShotStyle = "glide" | "dolly" | "orbit" | "focus"

export interface CameraShot {
  style: ShotStyle
  /** Camera position at start of shot */
  fromPos: [number, number, number]
  /** Camera position at end of shot */
  toPos: [number, number, number]
  /** Look-at target at start */
  fromTarget: [number, number, number]
  /** Look-at target at end */
  toTarget: [number, number, number]
  /** Duration in milliseconds (4000–8000) */
  durationMs: number
}

export interface CinematicCameraProps {
  /** Whether the cinematic camera is active */
  active: boolean
  /** Shot sequence (max 6) */
  shots: CameraShot[]
  /** Current playback clock in ms (from BriefingDirector) */
  nowMs: number
  /** Whether playback is paused */
  paused?: boolean
}

/* ── Easing ── */

/** Cubic ease-in-out with 1.5% overshoot settle */
function easeSmooth(t: number): number {
  if (t >= 1) return 1
  // Slight overshoot at ~85%
  const overshoot = 1.015
  if (t < 0.5) {
    return 2 * t * t
  }
  const p = -2 * t + 2
  return 1 - (p * p) / 2 * (1 / overshoot) + (1 - 1 / overshoot) * t
}

/** Hermite interpolation for extra smoothness */
function hermite(t: number): number {
  return t * t * (3 - 2 * t)
}

const _vecA = new THREE.Vector3()
const _vecB = new THREE.Vector3()
const _vecC = new THREE.Vector3()
const _vecD = new THREE.Vector3()

const CinematicCamera = memo(function CinematicCamera({
  active,
  shots,
  nowMs,
  paused = false,
}: CinematicCameraProps) {
  const { camera } = useThree()
  const controls = useTerrainControls((s) => s.controls)
  const savedControlsEnabled = useRef(true)
  const activated = useRef(false)

  // Clamp shots to max 6
  const clampedShots = shots.slice(0, 6)

  // Compute shot boundaries (cumulative durations)
  const shotBoundaries = useRef<number[]>([])
  const totalDuration = useRef(0)

  useEffect(() => {
    let acc = 0
    const bounds: number[] = []
    for (const shot of clampedShots) {
      bounds.push(acc)
      acc += shot.durationMs
    }
    shotBoundaries.current = bounds
    totalDuration.current = acc
  }, [clampedShots])

  // Disable/enable manual controls
  useEffect(() => {
    if (active && controls && !activated.current) {
      savedControlsEnabled.current = controls.enabled
      controls.enabled = false
      controls.enableRotate = false
      activated.current = true
    }
    if (!active && controls && activated.current) {
      controls.enabled = savedControlsEnabled.current
      controls.enableRotate = savedControlsEnabled.current
      activated.current = false
    }
  }, [active, controls])

  useFrame(() => {
    if (!active || paused || clampedShots.length === 0) return

    const total = totalDuration.current
    if (total <= 0) return

    // Clamp playback clock
    const t = Math.min(nowMs, total)

    // Find active shot
    let shotIdx = 0
    for (let i = clampedShots.length - 1; i >= 0; i--) {
      if (t >= shotBoundaries.current[i]) {
        shotIdx = i
        break
      }
    }

    const shot = clampedShots[shotIdx]
    const shotStart = shotBoundaries.current[shotIdx]
    const localT = Math.min((t - shotStart) / shot.durationMs, 1)

    // Apply different easing per shot style
    let easedT: number
    switch (shot.style) {
      case "glide":
        easedT = hermite(localT)
        break
      case "dolly":
        easedT = easeSmooth(localT)
        break
      case "orbit":
        easedT = hermite(localT)
        break
      case "focus":
        easedT = easeSmooth(localT)
        break
      default:
        easedT = hermite(localT)
    }

    // Interpolate position
    _vecA.set(...shot.fromPos)
    _vecB.set(...shot.toPos)
    _vecC.lerpVectors(_vecA, _vecB, easedT)

    // Interpolate target
    _vecA.set(...shot.fromTarget)
    _vecB.set(...shot.toTarget)
    _vecD.lerpVectors(_vecA, _vecB, easedT)

    // Apply to camera
    camera.position.copy(_vecC)
    camera.lookAt(_vecD)
    camera.updateProjectionMatrix()

    // Update OrbitControls target so they stay in sync on exit
    if (controls) {
      controls.target.copy(_vecD)
      controls.update()
    }
  })

  return null
})

export default CinematicCamera

/* ── Helper: compute total duration of a shot sequence ── */

export function shotSequenceDuration(shots: CameraShot[]): number {
  return shots.slice(0, 6).reduce((acc, s) => acc + s.durationMs, 0)
}
