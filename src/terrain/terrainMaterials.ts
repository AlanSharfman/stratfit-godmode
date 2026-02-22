import * as THREE from "three"

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x112a3e,
    emissive: new THREE.Color(0x0c2d42),
    emissiveIntensity: 0.28,
    transparent: true,
    opacity: 0.72,
    roughness: 0.78,
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
// Height-based AO: valleys ~0.58x, peaks ~1.38x brightness + azure/cyan tint
float _hao = clamp((vHeight + 8.0) / 33.0, 0.0, 1.0);
diffuseColor.rgb *= mix(0.58, 1.38, _hao);
diffuseColor.rgb += vec3(0.005, 0.025, 0.045) * _hao;`,
      )
  }

  return mat
}

export function createTerrainWireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.52,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
    roughness: 0.7,
    metalness: 0.15,
    depthWrite: false,
    depthTest: true,
  })
}
