import React, { Suspense, useEffect, useRef, useCallback } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import * as THREE from "three"
import SceneStack from "./SceneStack"

const HERO = {
  pos: new THREE.Vector3(-72, 62, 164),
  tgt: new THREE.Vector3(26, 14, 0),
}

const NEUTRAL = {
  pos: new THREE.Vector3(-58, 56, 148),
  tgt: new THREE.Vector3(18, 12, 0),
}

const LERP_DURATION_MS = 500

function CameraRig() {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const isHeroRef = useRef(true)

  // Lerp animation state
  const lerpRef = useRef<{
    active: boolean
    startPos: THREE.Vector3
    endPos: THREE.Vector3
    startTgt: THREE.Vector3
    endTgt: THREE.Vector3
    elapsed: number
    duration: number
  }>({
    active: false,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTgt: new THREE.Vector3(),
    endTgt: new THREE.Vector3(),
    elapsed: 0,
    duration: LERP_DURATION_MS,
  })

  const animateTo = useCallback(
    (preset: { pos: THREE.Vector3; tgt: THREE.Vector3 }) => {
      const cam = camera as THREE.PerspectiveCamera
      const l = lerpRef.current
      l.startPos.copy(cam.position)
      l.endPos.copy(preset.pos)
      l.startTgt.copy(
        controlsRef.current
          ? controlsRef.current.target
          : preset.tgt
      )
      l.endTgt.copy(preset.tgt)
      l.elapsed = 0
      l.duration = LERP_DURATION_MS
      l.active = true
    },
    [camera]
  )

  // Smooth ease-out
  useFrame((_, delta) => {
    const l = lerpRef.current
    if (!l.active) return

    l.elapsed += delta * 1000
    const raw = Math.min(l.elapsed / l.duration, 1)
    // ease-out cubic
    const t = 1 - Math.pow(1 - raw, 3)

    const cam = camera as THREE.PerspectiveCamera
    cam.position.lerpVectors(l.startPos, l.endPos, t)

    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(l.startTgt, l.endTgt, t)
      controlsRef.current.update()
    }

    cam.updateProjectionMatrix()

    if (raw >= 1) {
      l.active = false
    }
  })

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.near = 0.1
    cam.far = 4000
    cam.fov = 42
    cam.updateProjectionMatrix()

    // Start from a slightly pulled-back position and animate into HERO
    cam.position.set(-90, 80, 200)
    if (controlsRef.current) {
      controlsRef.current.target.copy(HERO.tgt)
      controlsRef.current.update()
    }

    // Kick off settle animation after a frame
    const timer = setTimeout(() => animateTo(HERO), 50)

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === "h") {
        isHeroRef.current = !isHeroRef.current
        animateTo(isHeroRef.current ? HERO : NEUTRAL)
      } else if (key === "r") {
        animateTo(isHeroRef.current ? HERO : NEUTRAL)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [camera, animateTo])

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
