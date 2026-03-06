import * as THREE from "three"

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x245888,
    emissive: new THREE.Color(0x184878),
    emissiveIntensity: 0.95,
    transparent: false,
    opacity: 1.0,
    roughness: 0.42,
    metalness: 0.22,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;\nvarying vec3 vWorldNormal;\nvarying float vSlope;\nvarying vec3 vWorldPos;",
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vHeight = position.z;
vWorldNormal = normalize(normalMatrix * normal);
vSlope = 1.0 - abs(normal.z);
vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;\nvarying vec3 vWorldNormal;\nvarying float vSlope;\nvarying vec3 vWorldPos;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float _hNorm = clamp((vHeight + 8.0) / 60.0, 0.0, 1.0);

// Four-tone height gradient (deep shadow → base → mid → icy peak)
vec3 _base = diffuseColor.rgb;
vec3 _deepCol = _base * 0.55;
vec3 _lowCol  = _base * 0.85;
vec3 _midCol  = _base * 1.30 + vec3(0.015, 0.035, 0.060);
vec3 _highCol = _base * 1.70 + vec3(0.045, 0.10, 0.18);

float _t1 = smoothstep(0.0, 0.15, _hNorm);
float _t2 = smoothstep(0.15, 0.45, _hNorm);
float _t3 = smoothstep(0.45, 1.0, _hNorm);
diffuseColor.rgb = mix(mix(mix(_deepCol, _lowCol, _t1), _midCol, _t2), _highCol, _t3);

// Slope-based exposed rock face — steep faces get brighter, rougher look
float _slopeF = smoothstep(0.12, 0.55, vSlope);
vec3 _rockColor = diffuseColor.rgb * 1.35 + vec3(0.025, 0.040, 0.065);
diffuseColor.rgb = mix(diffuseColor.rgb, _rockColor, _slopeF * 0.40);

// Ridge-line highlight: high + relatively flat = exposed ridge crests
float _ridgeMask = _hNorm * (1.0 - _slopeF) * smoothstep(0.40, 0.75, _hNorm);
diffuseColor.rgb += vec3(0.035, 0.090, 0.16) * _ridgeMask * 1.3;

// Snow/ice dusting on high flat surfaces
float _snowMask = smoothstep(0.65, 0.85, _hNorm) * (1.0 - _slopeF);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb + vec3(0.08, 0.14, 0.22), _snowMask * 0.55);

// Ambient occlusion: sheltered valleys + creases (gentler darkening)
float _valleyAO = (1.0 - _hNorm) * (1.0 - _slopeF);
float _creaseAO = _slopeF * (1.0 - _hNorm);
float _ao = max(_valleyAO * 0.40, _creaseAO * 0.22);
diffuseColor.rgb *= mix(1.0, 0.72, _ao);

// Crevasse darkening — subtle shadow in steep low areas
float _crevasse = _slopeF * (1.0 - _hNorm) * smoothstep(0.3, 0.6, vSlope);
diffuseColor.rgb *= mix(1.0, 0.78, _crevasse);

// Fresnel rim: grazing angles on ridges get edge glow (atmosphere scatter)
float _viewDot = abs(dot(normalize(vWorldNormal), vec3(0.0, 0.0, 1.0)));
float _rim = pow(1.0 - _viewDot, 2.5) * 0.14 * _hNorm;
diffuseColor.rgb += vec3(0.018, 0.060, 0.12) * _rim;

// Atmospheric haze on peaks — icy blue tint
diffuseColor.rgb += vec3(0.010, 0.038, 0.070) * _hNorm;`,
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
    default: { color: 0x184068, emissive: 0x123858, emissiveIntensity: 0.80, aoLow: 0.85, aoHigh: 1.9, tint: [0.008, 0.030, 0.06] },
    green:   { color: 0x144838, emissive: 0x124030, emissiveIntensity: 0.75, aoLow: 0.82, aoHigh: 1.7, tint: [0.008, 0.050, 0.020] },
    frost:   { color: 0x344860, emissive: 0x284058, emissiveIntensity: 0.65, aoLow: 0.88, aoHigh: 2.0, tint: [0.030, 0.035, 0.040] },
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
    color: 0x22d3ee,
    emissive: 0x0e7490,
    emissiveIntensity: 0.55,
    wireframe: true,
    transparent: true,
    opacity: 0.38,
    roughness: 0.70,
    metalness: 0.10,
    depthWrite: false,
    depthTest: true,
  })
}
