import * as THREE from "three"

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a4a72,
    emissive: new THREE.Color(0x12385c),
    emissiveIntensity: 0.72,
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
diffuseColor.rgb *= mix(0.78, 1.7, _hao);
diffuseColor.rgb += vec3(0.005, 0.03, 0.055) * _hao;`,
      )
  }

  return mat
}

export function createTerrainWireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x40b8f0,
    emissiveIntensity: 0.60,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
    roughness: 0.75,
    metalness: 0.10,
    depthWrite: false,
    depthTest: true,
  })
}
