// ============================================================================
// SPLINE MATH UTILITIES
// ============================================================================

import * as THREE from 'three';

/**
 * Creates smooth Catmull-Rom spline points from data values
 */
export function createSplinePoints(
  dataPoints: number[],
  width: number = 16,
  heightScale: number = 5,
  yOffset: number = 0,
  zOffset: number = 0
): THREE.Vector3[] {
  const count = dataPoints.length;
  
  return dataPoints.map((value, i) => {
    const x = (i / (count - 1)) * width - width / 2;
    const y = (value / 100) * heightScale + yOffset;
    const z = zOffset;
    return new THREE.Vector3(x, y, z);
  });
}

/**
 * Creates a Catmull-Rom curve from points
 */
export function createSplineCurve(points: THREE.Vector3[]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

/**
 * Interpolates between two arrays of numbers (for smooth morphing)
 */
export function lerpArray(
  current: number[],
  target: number[],
  factor: number = 0.1
): number[] {
  return current.map((val, i) => {
    const targetVal = target[i] ?? val;
    return val + (targetVal - val) * factor;
  });
}

