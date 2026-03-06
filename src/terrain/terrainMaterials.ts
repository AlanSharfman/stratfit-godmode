import * as THREE from "three"

/* ═══════════════════════════════════════════════════════════════════════
   Altitude colour bands — absolute terrain colours blended by height.
   Scene lights (directional, hemisphere, ambient) provide the blue/teal
   atmosphere tint; these bands define the intrinsic surface colour.
   ═══════════════════════════════════════════════════════════════════════ */

type Vec3 = [number, number, number]

interface AltitudePalette {
  valley: Vec3
  lowSlope: Vec3
  rock: Vec3
  highRidge: Vec3
  peak: Vec3
}

const ALTITUDE_DEFAULT: AltitudePalette = {
  valley:    [0.035, 0.102, 0.180],   // #091a2e  deep azure
  lowSlope:  [0.059, 0.180, 0.314],   // #0f2e50
  rock:      [0.094, 0.290, 0.471],   // #184a78
  highRidge: [0.157, 0.439, 0.659],   // #2870a8
  peak:      [0.290, 0.620, 0.816],   // #4a9ed0  bright azure
}

const ALTITUDE_GREEN: AltitudePalette = {
  valley:    [0.050, 0.100, 0.080],   // dark teal
  lowSlope:  [0.080, 0.150, 0.120],
  rock:      [0.130, 0.200, 0.175],
  highRidge: [0.220, 0.320, 0.280],
  peak:      [0.400, 0.540, 0.470],
}

const ALTITUDE_FROST: AltitudePalette = {
  valley:    [0.070, 0.085, 0.130],   // cold steel blue
  lowSlope:  [0.120, 0.140, 0.200],
  rock:      [0.180, 0.205, 0.280],
  highRidge: [0.310, 0.350, 0.430],
  peak:      [0.520, 0.570, 0.650],
}

const v3 = (c: Vec3) => `vec3(${c[0].toFixed(3)}, ${c[1].toFixed(3)}, ${c[2].toFixed(3)})`

function altitudeFragmentGLSL(p: AltitudePalette): string {
  return `#include <color_fragment>
float _hNorm = clamp((vHeight + 8.0) / 60.0, 0.0, 1.0);

vec3 _valley    = ${v3(p.valley)};
vec3 _lowSlope  = ${v3(p.lowSlope)};
vec3 _rock      = ${v3(p.rock)};
vec3 _highRidge = ${v3(p.highRidge)};
vec3 _peak      = ${v3(p.peak)};

vec3 _altCol = mix(_valley, _lowSlope, smoothstep(0.1, 0.3, _hNorm));
_altCol = mix(_altCol, _rock, smoothstep(0.3, 0.5, _hNorm));
_altCol = mix(_altCol, _highRidge, smoothstep(0.5, 0.75, _hNorm));
_altCol = mix(_altCol, _peak, smoothstep(0.75, 1.0, _hNorm));

diffuseColor.rgb = _altCol;

float _slopeF = smoothstep(0.12, 0.55, vSlope);
vec3 _rockFace = _altCol * 1.15 + vec3(0.020, 0.020, 0.030);
diffuseColor.rgb = mix(diffuseColor.rgb, _rockFace, _slopeF * 0.40);

float _ridgeMask = _hNorm * (1.0 - _slopeF) * smoothstep(0.40, 0.75, _hNorm);
diffuseColor.rgb += vec3(0.015, 0.050, 0.090) * _ridgeMask * 1.2;

float _snowMask = smoothstep(0.75, 0.95, _hNorm) * (1.0 - _slopeF);
diffuseColor.rgb = mix(diffuseColor.rgb, _peak, _snowMask * 0.35);

float _valleyAO = (1.0 - _hNorm) * (1.0 - _slopeF);
float _creaseAO = _slopeF * (1.0 - _hNorm);
float _ao = max(_valleyAO * 0.45, _creaseAO * 0.25);
diffuseColor.rgb *= mix(1.0, 0.68, _ao);

float _crevasse = _slopeF * (1.0 - _hNorm) * smoothstep(0.3, 0.6, vSlope);
diffuseColor.rgb *= mix(1.0, 0.75, _crevasse);

float _viewDot = abs(dot(normalize(vWorldNormal), vec3(0.0, 0.0, 1.0)));
float _rim = pow(1.0 - _viewDot, 2.5) * 0.12 * _hNorm;
diffuseColor.rgb += vec3(0.010, 0.045, 0.090) * _rim;

diffuseColor.rgb += vec3(0.005, 0.022, 0.050) * _hNorm;`
}

const VERTEX_VARYINGS =
  "varying float vHeight;\nvarying vec3 vWorldNormal;\nvarying float vSlope;\nvarying vec3 vWorldPos;"

const VERTEX_BODY = `#include <begin_vertex>
vHeight = position.z;
vWorldNormal = normalize(normalMatrix * normal);
vSlope = 1.0 - abs(normal.z);
vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`

const FRAGMENT_VARYINGS = VERTEX_VARYINGS

/* ═══════════════════════════════════════════════════════════════════════
   Main terrain solid material (progressive + seed-based)
   ═══════════════════════════════════════════════════════════════════════ */

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x091a2e,
    emissive: new THREE.Color(0x061220),
    emissiveIntensity: 0.30,
    transparent: false,
    opacity: 1.0,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_VARYINGS}`)
      .replace("#include <begin_vertex>", VERTEX_BODY)

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_VARYINGS}`)
      .replace("#include <color_fragment>", altitudeFragmentGLSL(ALTITUDE_DEFAULT))
  }

  return mat
}

/* ═══════════════════════════════════════════════════════════════════════
   Variant terrain material (compare page A/B sides)
   ═══════════════════════════════════════════════════════════════════════ */

export type TerrainColorVariant = "default" | "green" | "frost"

const VARIANT_PROPS: Record<TerrainColorVariant, {
  color: number; emissive: number; emissiveIntensity: number; palette: AltitudePalette
}> = {
  default: { color: 0x091a2e, emissive: 0x061220, emissiveIntensity: 0.30, palette: ALTITUDE_DEFAULT },
  green:   { color: 0x0d1a14, emissive: 0x081210, emissiveIntensity: 0.28, palette: ALTITUDE_GREEN },
  frost:   { color: 0x121621, emissive: 0x0c1018, emissiveIntensity: 0.28, palette: ALTITUDE_FROST },
}

export function createTerrainSolidMaterialVariant(variant: TerrainColorVariant) {
  const p = VARIANT_PROPS[variant]
  const mat = new THREE.MeshStandardMaterial({
    color: p.color,
    emissive: new THREE.Color(p.emissive),
    emissiveIntensity: p.emissiveIntensity,
    transparent: false,
    opacity: 1.0,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_VARYINGS}`)
      .replace("#include <begin_vertex>", VERTEX_BODY)

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_VARYINGS}`)
      .replace("#include <color_fragment>", altitudeFragmentGLSL(p.palette))
  }

  return mat
}

/* ═══════════════════════════════════════════════════════════════════════
   Wire/lattice overlay material
   ═══════════════════════════════════════════════════════════════════════ */

export function createTerrainWireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0e7490,
    emissiveIntensity: 0.9,
    wireframe: true,
    transparent: true,
    opacity: 0.72,
    roughness: 0.50,
    metalness: 0.18,
    depthWrite: false,
    depthTest: true,
  })
}
