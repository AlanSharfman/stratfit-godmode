import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function HorizonAtmosphere() {
  const { scene } = useThree();

  useEffect(() => {
    const prevFog = scene.fog;

    // Cinematic exp fog (depth + scale)
    scene.fog = new THREE.FogExp2("#05070a", 0.018);

    return () => {
      scene.fog = prevFog ?? null;
    };
  }, [scene]);

  return null;
}
