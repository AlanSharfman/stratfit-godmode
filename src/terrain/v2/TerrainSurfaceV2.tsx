import * as THREE from "three"
import { useMemo } from "react"
import { useFrame } from "@react-three/fiber"

type Props = {
  granularity: string | number
}

export default function TerrainSurfaceV2({ granularity }: Props) {
  const geometry = useMemo(() => {
    const size = 380
    const segments = 280
    const geo = new THREE.PlaneGeometry(size, size, segments, segments)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)

      // Domain warp (kills blob look)
      const warpX = Math.sin(z * 0.01) * 8
      const warpZ = Math.cos(x * 0.01) * 8

      const nx = (x + warpX) * 0.015
      const nz = (z + warpZ) * 0.015

      // Multi ridge structure
      const ridge =
        Math.abs(Math.sin(nx * 1.8)) * 6 +
        Math.abs(Math.cos(nz * 1.4)) * 5

      const macro = Math.sin(nx * 0.5) * 4 + Math.cos(nz * 0.5) * 4

      const peak = Math.exp(-(nx * nx + nz * nz) * 0.8) * 16

      const detail = Math.sin(nx * 4.5) * 1.5 + Math.cos(nz * 4.5) * 1.5

      const height = ridge + macro + peak + detail

      pos.setY(i, height)
    }

    geo.computeVertexNormals()
    return geo
  }, [granularity])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#0E1624"
        roughness={0.78}
        metalness={0.15}
      />
    </mesh>
  )
}
