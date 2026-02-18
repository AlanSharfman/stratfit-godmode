import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function CameraRig() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.5, 0));

  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(0, 3.8, 7.2), 0.05);
    camera.lookAt(target.current);
  });

  return null;
}
