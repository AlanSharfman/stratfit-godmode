import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

/**
 * CameraCompositionRig
 * - One-shot deterministic camera placement.
 * - Uses the SAME target as OrbitControls (0, 14, 0) to avoid fighting.
 * - Does NOT animate, does NOT fight controls.
 * - Safe: runs once and exits.
 */
export default function CameraCompositionRig() {
  const { camera } = useThree();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    // God Mode composition:
    // - ridge sits upper third
    // - a touch more foreground depth
    // - slightly flatter pitch for institutional "survey" feel
    // - shifted LEFT so terrain markers never encroach the right overlay zone
    // NOTE: lookAt target MUST match OrbitControls target (-20, 14, 0)
    camera.position.set(-40, 150, 500);
    camera.lookAt(-20, 14, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
