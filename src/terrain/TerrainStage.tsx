import React, { Suspense, useEffect, useRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import * as THREE from "three"
import SceneStack from "./SceneStack"

function CameraRig() {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  const HERO = {
    pos: new THREE.Vector3(-72, 62, 164),
    tgt: new THREE.Vector3(26, 14, 0),
  }

  const NEUTRAL = {
    pos: new THREE.Vector3(-58, 56, 148),
    tgt: new THREE.Vector3(18, 12, 0),
  }

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.near = 0.1
    cam.far = 4000
    cam.fov = 42

    const preset = HERO

    cam.position.copy(preset.pos)
    cam.lookAt(preset.tgt)
    cam.updateProjectionMatrix()

    if (controlsRef.current) {
      controlsRef.current.target.copy(preset.tgt)
      controlsRef.current.update()
    }

    let isHero = true

    const applyPreset = (p: { pos: THREE.Vector3; tgt: THREE.Vector3 }) => {
      cam.position.copy(p.pos)
      cam.lookAt(p.tgt)
      cam.updateProjectionMatrix()
      if (controlsRef.current) {
        controlsRef.current.target.copy(p.tgt)
        controlsRef.current.update()
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "h") return
      isHero = !isHero
      applyPreset(isHero ? HERO : NEUTRAL)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [camera])

  return (
    <OrbitControls
      ref={(r) => {
        controlsRef.current = r
      }}
      target={[26, 14, 0]}
      enablePan={false}
      enableDamping={true}
      dampingFactor={0.08}
      minDistance={70}   // prevents "macro" starts
      maxDistance={420}  // prevents losing the scene
      minPolarAngle={0.62}
      maxPolarAngle={1.18}
    />
  )
}

export default function TerrainStage({
  children,
}: {
  children?: React.ReactNode
}) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas>
        <ambientLight intensity={0.6} />
        <directionalLight position={[50, 120, 60]} intensity={1} />

        <Suspense fallback={null}>
          <SceneStack />
          {children}
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  )
}
