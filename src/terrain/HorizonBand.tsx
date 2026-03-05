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
        vec3 top     = vec3(0.008, 0.024, 0.090);  // #020617
        vec3 mid     = vec3(0.118, 0.161, 0.231);  // #1E293B
        vec3 horizon = vec3(0.200, 0.255, 0.333);  // #334155
        float tMid = smoothstep(-0.05, 0.35, h);
        float tTop = smoothstep(0.35, 0.75, h);
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
