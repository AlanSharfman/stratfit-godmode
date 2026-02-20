import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import * as THREE from "three"

/**
 * STRATFIT — GOD MODE CAMERA
 *
 * Goal:
 * Long cinematic shot so user sees:
 * • terrain undulations
 * • timeline progression
 * • path as a journey
 */

export default function PositionCameraRig() {
  const { camera } = useThree()

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera | THREE.OrthographicCamera

    // Wider lens but still natural
    if ((cam as any).isPerspectiveCamera) {
      ;(cam as THREE.PerspectiveCamera).fov = 44
    }

    // Pull back + raise
    cam.position.set(28, 16, 26)

    // Look slightly above terrain origin
    cam.lookAt(0, 2.5, 0)

    cam.near = 0.1
    cam.far = 1000

    cam.updateProjectionMatrix()
  }, [camera])

  return null
}
