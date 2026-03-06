import { useMemo } from "react"
import * as THREE from "three"

export default function HorizonBand() {
  const { geo, mat } = useMemo(() => {
    const g = new THREE.SphereGeometry(2000, 32, 32)

    const vertexShader = `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `
    const fragmentShader = `
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos).y;
        vec3 top     = vec3(0.024, 0.043, 0.086);  // #060b16
        vec3 mid     = vec3(0.047, 0.075, 0.133);  // #0c1322
        vec3 horizon = vec3(0.063, 0.102, 0.176);  // #101a2d
        float tMid = smoothstep(-0.05, 0.30, h);
        float tTop = smoothstep(0.30, 0.70, h);
        vec3 col = mix(horizon, mid, tMid);
        col = mix(col, top, tTop);
        gl_FragColor = vec4(col, 1.0);
      }
    `

    const m = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    })

    return { geo: g, mat: m }
  }, [])

  return (
    <mesh geometry={geo} material={mat} renderOrder={-1} />
  )
}
