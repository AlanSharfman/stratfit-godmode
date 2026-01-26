import { useMemo } from 'react'
import * as THREE from 'three'

interface Props {
  baselineHeights: number[]
  explorationHeights: number[]
}

export default function DivergenceField({
  baselineHeights,
  explorationHeights
}: Props) {

  const geometry = useMemo(() => {
    // Match CompareMountain: 150x150 segments
    const geo = new THREE.PlaneGeometry(220, 220, 150, 150)

    const pos = geo.attributes.position

    for (let i = 0; i < pos.count; i++) {
      const baseH = baselineHeights[i] ?? 0
      const explH = explorationHeights[i] ?? 0
      const delta = Math.abs(explH - baseH)

      pos.setZ(i, delta * 0.6)
    }

    pos.needsUpdate = true
    geo.computeVertexNormals()

    return geo
  }, [baselineHeights, explorationHeights])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        minDelta: { value: 0 },
        maxDelta: { value: 25 },
        cyan: { value: new THREE.Color('#00CED1') },
        indigo: { value: new THREE.Color('#4B4BFF') }
      },
      vertexShader: `
        varying float vHeight;

        void main() {
          vHeight = position.z;
          gl_Position = projectionMatrix *
                        modelViewMatrix *
                        vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vHeight;

        uniform float minDelta;
        uniform float maxDelta;
        uniform vec3 cyan;
        uniform vec3 indigo;

        void main() {

          float t = clamp(
            (vHeight - minDelta) / (maxDelta - minDelta),
            0.0,
            1.0
          );

          vec3 color = mix(cyan, indigo, t);

          gl_FragColor = vec4(color, 0.55);
        }
      `
    })
  }, [])

  return (
    <mesh 
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}  // CRITICAL: Rotate so Z becomes vertical height
    >
      <primitive object={material} attach="material" />
    </mesh>
  )
}
