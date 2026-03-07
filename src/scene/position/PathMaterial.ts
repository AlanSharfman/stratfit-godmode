import * as THREE from "three";

export const whitePathMaterial = new THREE.MeshStandardMaterial({
  color: "#e5e7eb",
  emissive: "#1f2937",
  emissiveIntensity: 0.15,
  roughness: 0.45,
  metalness: 0.1,
});

export const trajectoryMaterial = new THREE.LineBasicMaterial({
  color: "#22D3EE",
  transparent: true,
  opacity: 0.65,
});
