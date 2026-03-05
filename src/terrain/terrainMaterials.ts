import * as THREE from "three"

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0e3058,
    emissive: new THREE.Color(0x0a2848),
    emissiveIntensity: 0.65,
    transparent: false,
    opacity: 1.0,
    roughness: 0.58,
    metalness: 0.14,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;\nvarying vec3 vWorldNormal;\nvarying float vSlope;",
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vHeight = position.z;
vWorldNormal = normalize(normalMatrix * normal);
vSlope = 1.0 - abs(normal.z);`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;\nvarying vec3 vWorldNormal;\nvarying float vSlope;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float _hNorm = clamp((vHeight + 8.0) / 42.0, 0.0, 1.0);

// Three-tone height gradient (deep blue → mid blue → icy peak)
vec3 _base = diffuseColor.rgb;
vec3 _lowCol  = _base * 0.55;
vec3 _midCol  = _base * 1.05 + vec3(0.008, 0.018, 0.035);
vec3 _highCol = _base * 1.45 + vec3(0.025, 0.065, 0.11);
diffuseColor.rgb = _hNorm < 0.35
  ? mix(_lowCol, _midCol, smoothstep(0.0, 0.35, _hNorm))
  : mix(_midCol, _highCol, smoothstep(0.35, 1.0, _hNorm));

// Slope-based exposed rock: steep faces catch slightly more light
float _slopeF = smoothstep(0.15, 0.65, vSlope);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.25 + vec3(0.015, 0.025, 0.04), _slopeF * 0.35);

// Ridge-line highlight: high + flat = ridge crests
float _ridgeMask = _hNorm * (1.0 - _slopeF) * smoothstep(0.45, 0.8, _hNorm);
diffuseColor.rgb += vec3(0.018, 0.065, 0.11) * _ridgeMask;

// Ambient occlusion: sheltered valleys + creases between ridges
float _valleyAO = (1.0 - _hNorm) * (1.0 - _slopeF);
float _creaseAO = _slopeF * (1.0 - _hNorm);
float _ao = max(_valleyAO * 0.55, _creaseAO * 0.30);
diffuseColor.rgb *= mix(1.0, 0.68, _ao);

// Fresnel rim: grazing angles on ridges get subtle edge glow
float _viewDot = abs(dot(normalize(vWorldNormal), vec3(0.0, 0.0, 1.0)));
float _rim = pow(1.0 - _viewDot, 3.5) * 0.06 * _hNorm;
diffuseColor.rgb += vec3(0.008, 0.035, 0.07) * _rim;

// Icy atmosphere tint on peaks
diffuseColor.rgb += vec3(0.004, 0.02, 0.045) * _hNorm;`,
      )
  }

  return mat
}

export type TerrainColorVariant = "default" | "green" | "frost"

/**
 * Create a terrain solid material with an optional color variant.
 * - default: deep navy/teal (position page)
 * - green: emerald/jade tint (compare B-side)
 * - frost: cool white/silver (alternate compare)
 */
export function createTerrainSolidMaterialVariant(variant: TerrainColorVariant) {
  const palettes: Record<TerrainColorVariant, { color: number; emissive: number; emissiveIntensity: number; aoLow: number; aoHigh: number; tint: [number, number, number] }> = {
    default: { color: 0x0e3058, emissive: 0x0a2848, emissiveIntensity: 0.65, aoLow: 0.82, aoHigh: 1.8, tint: [0.005, 0.025, 0.05] },
    green:   { color: 0x0c3828, emissive: 0x0a3020, emissiveIntensity: 0.60, aoLow: 0.78, aoHigh: 1.6, tint: [0.005, 0.045, 0.015] },
    frost:   { color: 0x2a3850, emissive: 0x1e3048, emissiveIntensity: 0.50, aoLow: 0.85, aoHigh: 1.9, tint: [0.025, 0.030, 0.035] },
  }
  const p = palettes[variant]
  const mat = new THREE.MeshStandardMaterial({
    color: p.color,
    emissive: new THREE.Color(p.emissive),
    emissiveIntensity: p.emissiveIntensity,
    transparent: false,
    opacity: 1.0,
    roughness: 0.62,
    metalness: 0.12,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;\nvarying float vSlope;",
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vHeight = position.z;
vSlope = 1.0 - abs(normal.z);`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;\nvarying float vSlope;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float _hNorm = clamp((vHeight + 8.0) / 42.0, 0.0, 1.0);
vec3 _base = diffuseColor.rgb;
vec3 _lowCol  = _base * ${p.aoLow.toFixed(2)};
vec3 _midCol  = _base * ${((p.aoLow + p.aoHigh) * 0.5).toFixed(2)} + vec3(${(p.tint[0] * 0.5).toFixed(4)}, ${(p.tint[1] * 0.5).toFixed(4)}, ${(p.tint[2] * 0.5).toFixed(4)});
vec3 _highCol = _base * ${p.aoHigh.toFixed(1)} + vec3(${p.tint[0].toFixed(3)}, ${p.tint[1].toFixed(3)}, ${p.tint[2].toFixed(3)});
diffuseColor.rgb = _hNorm < 0.35
  ? mix(_lowCol, _midCol, smoothstep(0.0, 0.35, _hNorm))
  : mix(_midCol, _highCol, smoothstep(0.35, 1.0, _hNorm));
float _slopeF = smoothstep(0.15, 0.65, vSlope);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.25 + vec3(0.015, 0.025, 0.035), _slopeF * 0.35);
float _ridgeMask = _hNorm * (1.0 - _slopeF) * smoothstep(0.45, 0.8, _hNorm);
diffuseColor.rgb += vec3(${p.tint[0].toFixed(3)}, ${p.tint[1].toFixed(3)}, ${p.tint[2].toFixed(3)}) * _ridgeMask;
float _vAO = (1.0 - _hNorm) * (1.0 - _slopeF);
float _cAO = _slopeF * (1.0 - _hNorm);
diffuseColor.rgb *= mix(1.0, 0.70, max(_vAO * 0.50, _cAO * 0.28));`,
      )
  }

  return mat
}

export function createTerrainWireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x4a9ccc,
    emissive: 0x2878a8,
    emissiveIntensity: 0.50,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
    roughness: 0.75,
    metalness: 0.10,
    depthWrite: false,
    depthTest: true,
  })
}
