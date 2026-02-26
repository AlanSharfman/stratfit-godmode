import * as THREE from "three"

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1e6090,
    emissive: new THREE.Color(0x185080),
    emissiveIntensity: 0.80,
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
diffuseColor.rgb += vec3(0.008, 0.04, 0.07) * _hao;`,
      )
  }

  return mat
}

export function createTerrainWireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x8adcff,
    emissive: 0x50c8ff,
    emissiveIntensity: 0.70,
    wireframe: true,
    transparent: true,
    opacity: 0.60,
    roughness: 0.75,
    metalness: 0.10,
    depthWrite: false,
    depthTest: true,
  })
}
