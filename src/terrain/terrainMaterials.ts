import * as THREE from "three"

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a3a5c,
    emissive: new THREE.Color(0x0c2844),
    emissiveIntensity: 0.65,
    transparent: false,
    opacity: 1.0,
    roughness: 0.72,
    metalness: 0.15,
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
diffuseColor.rgb *= mix(0.82, 1.85, _hao);
diffuseColor.rgb += vec3(-0.004, 0.018, 0.038) * _hao;`,
      )
  }

  return mat
}

export function createTerrainWireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.68,
    wireframe: true,
    transparent: true,
    opacity: 0.62,
    roughness: 0.85,
    metalness: 0.12,
    depthWrite: false,
    depthTest: true,
  })
}
