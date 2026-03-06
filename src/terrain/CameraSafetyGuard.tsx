// src/terrain/CameraSafetyGuard.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Camera Safety Guard
//
// Runs every frame inside TerrainStage to enforce camera parameter limits.
// Prevents child components from overriding distance, polar angle, or
// target bounds configured by the camera preset system.
//
// Authorized camera mutators (these operate within the enforced bounds):
//   - CameraDriftSystem (micro/cinematic drift)
//   - RiskWeatherSystem (target shake, temporary)
//   - TerrainSignalSystem (target lerp for beacon focus)
//   - IntelligenceCameraFocus (target lerp)
//   - TerrainNavWidget (orbit/zoom via controls API)
// ═══════════════════════════════════════════════════════════════════════════

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import type { CameraControlsConfig } from "@/scene/camera/terrainCameraPresets"

interface CameraSafetyGuardProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  limits: CameraControlsConfig
}

export default function CameraSafetyGuard({
  controlsRef,
  limits,
}: CameraSafetyGuardProps) {
  const { camera } = useThree()
  const warnedRef = useRef(false)

  useFrame(() => {
    const controls = controlsRef.current
    if (!controls) return

    // Re-enforce distance limits every frame
    if (controls.minDistance !== limits.minDistance) {
      controls.minDistance = limits.minDistance
    }
    if (controls.maxDistance !== limits.maxDistance) {
      controls.maxDistance = limits.maxDistance
    }

    // Re-enforce polar angle limits
    if (controls.minPolarAngle !== limits.minPolarAngle) {
      controls.minPolarAngle = limits.minPolarAngle
    }
    if (controls.maxPolarAngle !== limits.maxPolarAngle) {
      controls.maxPolarAngle = limits.maxPolarAngle
    }

    // Clamp actual camera distance if somehow exceeded
    const target = controls.target
    const dist = camera.position.distanceTo(target)

    if (dist < limits.minDistance || dist > limits.maxDistance) {
      const clamped = Math.max(limits.minDistance, Math.min(limits.maxDistance, dist))
      const dir = camera.position.clone().sub(target).normalize()
      camera.position.copy(target).addScaledVector(dir, clamped)

      if (!warnedRef.current && import.meta.env?.DEV) {
        warnedRef.current = true
        console.warn(
          `[CameraSafetyGuard] Camera distance ${dist.toFixed(0)} exceeded limits ` +
          `[${limits.minDistance}, ${limits.maxDistance}]. Clamped to ${clamped.toFixed(0)}.`
        )
      }
    }
  })

  return null
}
