import * as THREE from "three"

/**
 * Premium terrain solid material — Midnight Azure abyss.
 *
 * Height-gradient shader:
 *   Valleys  → midnight azure (#002B36)
 *   Slopes   → deep cerulean (#006494)
 *   Peaks    → brilliant cyan (#00E5FF)
 */
export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x001824,
    emissive: new THREE.Color(0x003044),
    emissiveIntensity: 0.30,
    transparent: true,
    opacity: 0.76,
    roughness: 0.78,
    metalness: 0.10,
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
// ── Azure height gradient: Midnight Azure → Deep Cerulean → Brilliant Cyan ──
float _ht = clamp((vHeight + 4.0) / 36.0, 0.0, 1.0);

// Valley: midnight azure
vec3 _valleyCol = vec3(0.0, 0.169, 0.212);
// Slope: deep cerulean
vec3 _slopeCol = vec3(0.0, 0.392, 0.580);
// Peak: brilliant cyan
vec3 _peakCol = vec3(0.0, 0.898, 1.0);

// Smooth S-curve interpolation
float _t1 = smoothstep(0.0, 0.40, _ht);
float _t2 = smoothstep(0.40, 0.80, _ht);
vec3 _terrainColor = mix(mix(_valleyCol, _slopeCol, _t1), _peakCol, _t2);

diffuseColor.rgb = _terrainColor;

// Subtle AO deepening in valleys
diffuseColor.rgb *= mix(0.50, 1.40, _ht);

// Atmospheric depth fade (distance from camera)
float _distFade = clamp(length(vWorldPos.xz) / 600.0, 0.0, 1.0);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0, 0.10, 0.13), _distFade * 0.45);`,
      )
  }

  return mat
}

/**
 * Premium wireframe lattice — azure-to-brilliant-cyan glow on height.
 */
export function createTerrainWireMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0088cc,
    emissive: 0x00aadd,
    emissiveIntensity: 0.60,
    wireframe: true,
    transparent: true,
    opacity: 0.36,
    roughness: 0.70,
    metalness: 0.18,
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
// Gradient: midnight azure wire → brilliant cyan on peaks
vec3 _wireValley = vec3(0.0, 0.169, 0.30);
vec3 _wirePeak = vec3(0.0, 0.898, 1.0);
diffuseColor.rgb = mix(_wireValley, _wirePeak, smoothstep(0.0, 0.8, _wh));
// Peak glow boost
diffuseColor.rgb += vec3(0.0, 0.20, 0.25) * smoothstep(0.6, 1.0, _wh);`,
      )
  }

  return mat
}
