// ============================================================================
// NEON MATERIAL SHADER UTILITIES — FIXED & R3F-SAFE
// ============================================================================

import * as THREE from "three";

/**
 * Converts any input color to THREE.Color
 */
function normalizeColor(c: THREE.Color | number | string): THREE.Color {
  if (c instanceof THREE.Color) return c;

  if (typeof c === "number") return new THREE.Color(c);

  return new THREE.Color(c.toString());
}

/**
 * Creates neon line material (glow handled by bloom postprocessing)
 */
export function createNeonLineMaterial(
  color: THREE.Color | number | string,
  opacity: number = 1.0,
  lineWidth: number = 1
): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: normalizeColor(color),
    transparent: true,
    opacity,
    linewidth: lineWidth, // NOTE: ignored by most browsers but harmless
  });
}

/**
 * Neon mesh material (not used yet but ready for ribbons / 3D fills)
 */
export function createNeonMeshMaterial(
  color: THREE.Color | number | string,
  emissive: THREE.Color | number | string,
  opacity: number = 0.9,
  emissiveIntensity: number = 1.2
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: normalizeColor(color),
    emissive: normalizeColor(emissive),
    emissiveIntensity,
    transparent: true,
    opacity,
    roughness: 0.3,
    metalness: 0.1,
  });
}

/**
 * Gradient fill for mountain ribbon
 */
export function createGradientMaterial(opacity: number = 0.4) {
  return new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

