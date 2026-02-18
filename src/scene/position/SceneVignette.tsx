import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function SceneVignette() {
  const { scene } = useThree();

  useEffect(() => {
    const vignette = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshBasicMaterial({
        color: "#020617",
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      })
    );

    vignette.position.set(0, 0, -10);
    scene.add(vignette);

    return () => {
      scene.remove(vignette);
    };
  }, [scene]);

  return null;
}
