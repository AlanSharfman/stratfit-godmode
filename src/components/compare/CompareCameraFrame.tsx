// src/components/compare/CompareCameraFrame.tsx
// STRATFIT — Step 23: Deterministic compare camera framing
// Must render inside an R3F <Canvas>. No animation loop. Hard-set framing.

import React, { useEffect, useMemo } from "react"
import { useThree } from "@react-three/fiber"
import { useScenarioStore } from "@/state/scenarioStore"

export default function CompareCameraFrame() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId)
  // In compare mode, "showing B" means a non-base scenario is selected
  const showB = activeScenarioId !== "base"

  const { camera } = useThree()

  const frame = useMemo(() => {
    if (!showB) {
      return {
        pos: [0, 2.2, 4.6] as [number, number, number],
        look: [0, 0.2, 0] as [number, number, number],
        fov: 45,
      }
    }
    return {
      pos: [0, 2.5, 6.2] as [number, number, number],
      look: [0, 0.2, 0] as [number, number, number],
      fov: 45,
    }
  }, [showB])

  useEffect(() => {
    camera.position.set(frame.pos[0], frame.pos[1], frame.pos[2])
    camera.lookAt(frame.look[0], frame.look[1], frame.look[2])

    // PerspectiveCamera FOV update
    const cam = camera as any
    cam.fov = frame.fov
    if (typeof cam.updateProjectionMatrix === "function") {
      cam.updateProjectionMatrix()
    }
  }, [camera, frame])

  return null
}
