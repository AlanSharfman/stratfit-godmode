import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function DepthCue() {
  const { scene } = useThree();

  useFrame(() => {
    scene.fog = new THREE.Fog("#020617", 6, 24);
  });

  return null;
}
