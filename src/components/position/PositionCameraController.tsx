import { useThree, useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function PositionCameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 55, 95);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    (camera as THREE.PerspectiveCamera).far = 800;
    (camera as THREE.PerspectiveCamera).near = 0.1;
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    camera.position.x *= 0.9995;
    camera.position.z *= 0.9995;
  });

  return null;
}
