import * as THREE from "three"

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0e3058,
    emissive: new THREE.Color(0x0a2848),
    emissiveIntensity: 0.65,
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
        "#include <common>\nvarying float vHeight;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvHeight = position.z;",
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
// Height-based AO: valleys brighter, peaks vivid + teal
float _hao = clamp((vHeight + 8.0) / 33.0, 0.0, 1.0);
diffuseColor.rgb *= mix(0.82, 1.8, _hao);
diffuseColor.rgb += vec3(0.005, 0.025, 0.05) * _hao;`,
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
        "#include <common>\nvarying float vHeight;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvHeight = position.z;",
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float _hao = clamp((vHeight + 8.0) / 33.0, 0.0, 1.0);
diffuseColor.rgb *= mix(${p.aoLow.toFixed(2)}, ${p.aoHigh.toFixed(1)}, _hao);
diffuseColor.rgb += vec3(${p.tint[0].toFixed(3)}, ${p.tint[1].toFixed(3)}, ${p.tint[2].toFixed(3)}) * _hao;`,
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
