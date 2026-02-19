import * as THREE from "three"

export function generateP50Spline(heightFn: (x: number, z: number) => number) {
  const points: THREE.Vector3[] = []

  let x = -60
  let z = -10

  for (let i = 0; i < 60; i++) {
    const noise = Math.sin(i * 0.35) * 4
    x += 2.2
    z += noise * 0.15

    const y = heightFn(x, z) + 0.6
    points.push(new THREE.Vector3(x, y, z))
  }

  return new THREE.CatmullRomCurve3(points)
}
