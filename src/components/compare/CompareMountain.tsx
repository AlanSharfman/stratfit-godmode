import { useMemo } from 'react'
import * as THREE from 'three'
import { generateTerrainHeight } from '@/terrain/terrainGenerator'

interface Props {
  position: [number, number, number]
  heights?: number[]
  scenarioModifier?: number
  timeline?: number
}

export default function CompareMountain({
  position,
  heights,
  scenarioModifier = 0,
  timeline = 0
}: Props) {

  const geometry = useMemo(() => {
    // 150x150 segments = 22,801 vertices (good balance of detail vs performance)
    const geo = new THREE.PlaneGeometry(220, 220, 150, 150)

    const pos = geo.attributes.position

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)

      let height: number

      // If heights array is provided and has this index, use it
      if (heights && heights[i] !== undefined && !isNaN(heights[i])) {
        height = heights[i]
      } else {
        // Generate terrain directly
        height = generateTerrainHeight({
          x: x,
          z: y,
          time: timeline,
          modifier: scenarioModifier
        })
      }

      pos.setZ(i, height)
    }

    pos.needsUpdate = true
    geo.computeVertexNormals()

    return geo
  }, [heights, scenarioModifier, timeline])

  const rimColor = position[0] < 0
    ? new THREE.Color('#00CED1')
    : new THREE.Color('#4B4BFF')

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color('#0d111a') },
        rimColor: { value: rimColor }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        uniform vec3 baseColor;
        uniform vec3 rimColor;

        void main() {

          float rim = 1.0 - dot(normalize(vViewPosition), normalize(vNormal));
          rim = smoothstep(0.6, 1.0, rim);

          vec3 color = baseColor + rim * 0.35 * rimColor;

          gl_FragColor = vec4(color, 1.0);
        }
      `
    })
  }, [rimColor])

  return (
    <mesh 
      geometry={geometry} 
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}  // CRITICAL: Rotate so Z becomes vertical height
    >
      <primitive object={material} attach="material" />
    </mesh>
  )
}
