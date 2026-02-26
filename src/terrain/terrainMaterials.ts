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
