import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * HorizonAtmosphere
 * Adds subtle exponential fog tuning for cinematic depth
 */
export default function HorizonAtmosphere() {
  const { scene } = useThree();

  useEffect(() => {
    const fog = new THREE.FogExp2("#05070a", 0.018);
    scene.fog = fog;

    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return null;
}
