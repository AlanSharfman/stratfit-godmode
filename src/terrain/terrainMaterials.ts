import * as THREE from "three"

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0f1d2b,
    emissive: new THREE.Color(0x081423),
    emissiveIntensity: 0.16,
    transparent: true,
    opacity: 0.62,
    roughness: 0.92,
    metalness: 0.05,
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
// Height-based AO: valleys ~0.52x, peaks ~1.28x brightness + subtle teal
float _hao = clamp((vHeight + 8.0) / 33.0, 0.0, 1.0);
diffuseColor.rgb *= mix(0.52, 1.28, _hao);
diffuseColor.rgb += vec3(-0.006, 0.008, 0.018) * _hao;`,
      )
  }

  return mat
}

export function createTerrainWireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.34,
    wireframe: true,
    transparent: true,
    opacity: 0.4,
    roughness: 0.85,
    metalness: 0.12,
    depthWrite: false,
    depthTest: true,
  })
}
