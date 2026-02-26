import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * CinematicLighting
 * Adds STRATFIT signature lighting without modifying TerrainStage
 */
export default function CinematicLighting() {
  const { scene } = useThree();

  useEffect(() => {
    const rim = new THREE.DirectionalLight("#7fd6ff", 0.8);
    rim.position.set(-40, 30, -20);

    const topFill = new THREE.DirectionalLight("#a8e6ff", 0.35);
    topFill.position.set(0, 80, 0);

    const ambient = new THREE.AmbientLight("#0b1d2a", 0.6);

    scene.add(rim);
    scene.add(topFill);
    scene.add(ambient);

    return () => {
      scene.remove(rim);
      scene.remove(topFill);
      scene.remove(ambient);
    };
  }, [scene]);

  return null;
}
