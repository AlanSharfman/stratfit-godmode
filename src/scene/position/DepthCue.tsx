import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function DepthCue() {
  const { scene } = useThree();

  useFrame(() => {
    scene.fog = new THREE.Fog("#020617", 7, 26);
  });

  return null;
}
