import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { POSITION_PRESET } from "@/scene/camera/terrainCameraPresets";
import type { CameraPreset } from "@/scene/camera/terrainCameraPresets";

/**
 * CameraCompositionRig
 * - One-shot deterministic camera placement from terrainCameraPresets.
 * - Uses the SAME target as OrbitControls to avoid fighting.
 * - Does NOT animate, does NOT fight controls.
 * - Safe: runs once and exits.
 */
export default function CameraCompositionRig({ preset }: { preset?: CameraPreset } = {}) {
  const { camera } = useThree();
  const done = useRef(false);
  const p = preset ?? POSITION_PRESET;

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    camera.position.set(...p.pos);
    camera.lookAt(...p.target);
    camera.updateProjectionMatrix();
  }, [camera, p]);

  return null;
}
