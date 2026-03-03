import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function CinematicLighting() {
  const { scene } = useThree();

  useEffect(() => {
    const rim = new THREE.DirectionalLight("#7fd6ff", 0.85);
    rim.position.set(-40, 28, -24);

    const key = new THREE.DirectionalLight("#b7f0ff", 0.65);
    key.position.set(34, 42, 22);

    const fill = new THREE.DirectionalLight("#6fd0ff", 0.22);
    fill.position.set(0, 80, 0);

    const ambient = new THREE.AmbientLight("#08131c", 0.55);

    scene.add(rim, key, fill, ambient);

    return () => {
      scene.remove(rim, key, fill, ambient);
    };
  }, [scene]);

  return null;
}
