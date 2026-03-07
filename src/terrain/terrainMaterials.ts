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
  valley:    [0.110, 0.320, 0.480],   // #1C5279  vivid deep azure
  lowSlope:  [0.155, 0.500, 0.700],   // #2780B3  vivid mid azure
  rock:      [0.200, 0.640, 0.860],   // #33A3DB  vivid azure slope
  highRidge: [0.270, 0.770, 0.960],   // #45C4F5  vivid bright ridge
  peak:      [0.450, 0.870, 1.000],   // #73DEFF  luminous ice peak
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

const ALTITUDE_WHITE: AltitudePalette = {
  valley:    [0.220, 0.240, 0.280],   // #384047  cool grey
  lowSlope:  [0.380, 0.400, 0.440],   // #616670
  rock:      [0.540, 0.570, 0.610],   // #8a919c
  highRidge: [0.720, 0.750, 0.790],   // #b8bfc9
  peak:      [0.880, 0.910, 0.940],   // #e0e8f0  near-white
}

const v3 = (c: Vec3) => `vec3(${c[0].toFixed(3)}, ${c[1].toFixed(3)}, ${c[2].toFixed(3)})`

function altitudeFragmentGLSL(p: AltitudePalette): string {
  return `#include <color_fragment>
float _hNorm = clamp((vHeight + 8.0) / 160.0, 0.0, 1.0);

vec3 _valley    = ${v3(p.valley)};
vec3 _lowSlope  = ${v3(p.lowSlope)};
vec3 _rock      = ${v3(p.rock)};
vec3 _highRidge = ${v3(p.highRidge)};
vec3 _peak      = ${v3(p.peak)};

vec3 _altCol = mix(_valley, _lowSlope, smoothstep(0.12, 0.24, _hNorm));
_altCol = mix(_altCol, _rock, smoothstep(0.32, 0.46, _hNorm));
_altCol = mix(_altCol, _highRidge, smoothstep(0.52, 0.68, _hNorm));
_altCol = mix(_altCol, _peak, smoothstep(0.76, 0.90, _hNorm));

diffuseColor.rgb = _altCol;

float _slopeF = smoothstep(0.12, 0.55, vSlope);
vec3 _rockFace = _altCol * 1.15 + vec3(0.020, 0.020, 0.030);
diffuseColor.rgb = mix(diffuseColor.rgb, _rockFace, _slopeF * 0.58);

float _ridgeMask = _hNorm * (1.0 - _slopeF) * smoothstep(0.30, 0.65, _hNorm);
diffuseColor.rgb += vec3(0.025, 0.080, 0.130) * _ridgeMask * 1.6;

float _snowMask = smoothstep(0.72, 0.92, _hNorm) * (1.0 - _slopeF);
diffuseColor.rgb = mix(diffuseColor.rgb, _peak, _snowMask * 0.42);

float _valleyAO = (1.0 - _hNorm) * (1.0 - _slopeF);
float _creaseAO = _slopeF * (1.0 - _hNorm);
float _ao = max(_valleyAO * 0.20, _creaseAO * 0.10);
diffuseColor.rgb *= mix(1.0, 0.85, _ao);

float _crevasse = _slopeF * (1.0 - _hNorm) * smoothstep(0.25, 0.55, vSlope);
diffuseColor.rgb *= mix(1.0, 0.90, _crevasse);

vec3 _wNorm = normalize(vWorldNormal);
vec3 _keyDir = normalize(vec3(120.0, 200.0, 120.0));
float _nDotL = dot(_wNorm, _keyDir);
float _shadowFace = smoothstep(-0.05, 0.35, -_nDotL);
diffuseColor.rgb *= mix(1.0, 0.85, _shadowFace * 0.40);

vec3 _viewDir = normalize(cameraPosition - vWorldPos);
vec3 _halfVec = normalize(_viewDir + _keyDir);
float _nDotH = max(dot(_wNorm, _halfVec), 0.0);
float _spec = pow(_nDotH, 160.0);
float _litFace = smoothstep(0.0, 0.30, _nDotL);
float _ridgeGate = smoothstep(0.30, 0.65, _hNorm);
float _shimmer = _spec * _litFace * _ridgeGate * 0.55;
diffuseColor.rgb += vec3(0.040, 0.125, 0.210) * _shimmer;

float _basinMask = smoothstep(0.12, 0.0, _hNorm);
diffuseColor.rgb *= mix(1.0, 0.88, _basinMask);
float _basinFresnel = pow(1.0 - abs(dot(_wNorm, _viewDir)), 4.0);
diffuseColor.rgb += vec3(0.006, 0.028, 0.055) * _basinFresnel * _basinMask * 0.12;
float _basinEdge = smoothstep(0.0, 0.08, _hNorm) * smoothstep(0.20, 0.08, _hNorm);
diffuseColor.rgb += vec3(0.003, 0.014, 0.028) * _basinEdge;

float _viewDot = abs(dot(_wNorm, vec3(0.0, 0.0, 1.0)));
float _rim = pow(1.0 - _viewDot, 3.0) * 0.14 * _hNorm;
diffuseColor.rgb += vec3(0.010, 0.048, 0.090) * _rim;

diffuseColor.rgb += vec3(0.001, 0.008, 0.020) * _hNorm;`
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
    color: 0x2080b0,
    emissive: new THREE.Color(0x145878),
    emissiveIntensity: 0.35,
    transparent: false,
    opacity: 1.0,
    roughness: 0.68,
    metalness: 0.05,
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

export type TerrainColorVariant = "default" | "green" | "frost" | "white"

const VARIANT_PROPS: Record<TerrainColorVariant, {
  color: number; emissive: number; emissiveIntensity: number; palette: AltitudePalette
}> = {
  default: { color: 0x0e3350, emissive: 0x0a2238, emissiveIntensity: 0.22, palette: ALTITUDE_DEFAULT },
  green:   { color: 0x0d1a14, emissive: 0x081210, emissiveIntensity: 0.28, palette: ALTITUDE_GREEN },
  frost:   { color: 0x121621, emissive: 0x0c1018, emissiveIntensity: 0.28, palette: ALTITUDE_FROST },
  white:   { color: 0x384047, emissive: 0x1a1e24, emissiveIntensity: 0.20, palette: ALTITUDE_WHITE },
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
    color: 0x1a9ec8,
    emissive: 0x0a5a78,
    emissiveIntensity: 0.55,
    wireframe: true,
    transparent: true,
    opacity: 0.48,
    roughness: 0.60,
    metalness: 0.10,
    depthWrite: false,
    depthTest: true,
  })
}
