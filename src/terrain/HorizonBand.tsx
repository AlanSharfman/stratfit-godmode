import { useMemo } from "react"
import * as THREE from "three"

// Sky-dome that sits behind all terrain geometry.
// Three-stop vertical gradient matched to the locked platform palette:
//   zenith  (#061326) — deepest navy, top of sky
//   mid-sky (#071A30) — slightly lighter intermediate band
//   horizon (#081B33) — warmer deep navy at eye level
//   nadir   (#040d1e) — dark base (below terrain, rarely visible)
// Colours are intentionally close together so the transition reads as
// atmospheric depth rather than a noticeable colour shift.
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

    // Colour palette (linear sRGB):
    //   #061326  →  rgb(  6, 19, 38)  →  vec3(0.02353, 0.07451, 0.14902)
    //   #071A30  →  rgb(  7, 26, 48)  →  vec3(0.02745, 0.10196, 0.18824)
    //   #081B33  →  rgb(  8, 27, 51)  →  vec3(0.03137, 0.10588, 0.20000)
    //   #040d1e  →  rgb(  4, 13, 30)  →  vec3(0.01569, 0.05098, 0.11765)
    const fragmentShader = `
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos).y;

        // Zenith → deepest navy
        vec3 zenith  = vec3(0.02353, 0.07451, 0.14902);  // #061326
        // Mid-sky band
        vec3 midSky  = vec3(0.02745, 0.10196, 0.18824);  // #071A30
        // Horizon — slightly brighter to lift atmospheric scatter
        vec3 horizon = vec3(0.03137, 0.10588, 0.20000);  // #081B33
        // Nadir — deep, barely visible through terrain
        vec3 nadir   = vec3(0.01569, 0.05098, 0.11765);  // #040d1e

        // Blend upward:
        //   h < -0.05  → nadir
        //   h = 0.00   → horizon
        //   h = 0.35   → mid-sky
        //   h > 0.65   → zenith
        float tHorizon = smoothstep(-0.08, 0.0,  h);   // nadir → horizon
        float tMidSky  = smoothstep( 0.0,  0.35, h);   // horizon → mid-sky
        float tZenith  = smoothstep( 0.35, 0.65, h);   // mid-sky → zenith

        vec3 col = mix(nadir,   horizon, tHorizon);
        col       = mix(col,    midSky,  tMidSky);
        col       = mix(col,    zenith,  tZenith);

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
