import * as THREE from "three"

/**
 * Premium terrain solid material — deep azure abyss.
 *
 * Height-gradient shader:
 *   Valleys  → deep dark navy/teal (#06101a)
 *   Slopes   → bright mid-azure (#0284c7)
 *   Peaks    → luminous cyan (#22d3ee)
 */
export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a1e30,
    emissive: new THREE.Color(0x062040),
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 0.72,
    roughness: 0.82,
    metalness: 0.08,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;\nvarying vec3 vWorldPos;",
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vHeight = position.z;
vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;\nvarying vec3 vWorldPos;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
// ── Azure height gradient: valleys → slopes → peaks ──
float _ht = clamp((vHeight + 4.0) / 36.0, 0.0, 1.0);

// Valley: deep dark navy-teal
vec3 _valleyCol = vec3(0.024, 0.063, 0.102);
// Slope: bright mid-tone azure
vec3 _slopeCol = vec3(0.008, 0.518, 0.780);
// Peak: luminous brilliant cyan
vec3 _peakCol = vec3(0.133, 0.827, 0.933);

// Smooth S-curve interpolation
float _t1 = smoothstep(0.0, 0.45, _ht);
float _t2 = smoothstep(0.45, 0.85, _ht);
vec3 _terrainColor = mix(mix(_valleyCol, _slopeCol, _t1), _peakCol, _t2);

diffuseColor.rgb = _terrainColor;

// Subtle AO deepening in valleys
diffuseColor.rgb *= mix(0.55, 1.35, _ht);

// Atmospheric depth fade (distance from camera)
float _distFade = clamp(length(vWorldPos.xz) / 600.0, 0.0, 1.0);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.020, 0.039, 0.063), _distFade * 0.4);`,
      )
  }

  return mat
}

/**
 * Premium wireframe lattice — azure-to-cyan glow on height.
 */
export function createTerrainWireMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.55,
    wireframe: true,
    transparent: true,
    opacity: 0.38,
    roughness: 0.75,
    metalness: 0.15,
    depthWrite: false,
    depthTest: true,
  })

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vWireHeight;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvWireHeight = position.z;",
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vWireHeight;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float _wh = clamp((vWireHeight + 4.0) / 36.0, 0.0, 1.0);
// Gradient: dark teal wire in valleys → bright cyan on peaks
vec3 _wireValley = vec3(0.047, 0.290, 0.475);
vec3 _wirePeak = vec3(0.133, 0.827, 0.933);
diffuseColor.rgb = mix(_wireValley, _wirePeak, smoothstep(0.0, 0.8, _wh));
// Peak glow boost
diffuseColor.rgb += vec3(0.05, 0.15, 0.20) * smoothstep(0.6, 1.0, _wh);`,
      )
  }

  return mat
}
