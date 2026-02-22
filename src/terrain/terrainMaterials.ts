import * as THREE from "three"

export function createTerrainSolidMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a3a52,
    emissive: new THREE.Color(0x0e3854),
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.82,
    roughness: 0.65,
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
// Height-based AO: valleys ~0.62x, peaks ~1.5x brightness + strong azure tint
float _hao = clamp((vHeight + 8.0) / 33.0, 0.0, 1.0);
diffuseColor.rgb *= mix(0.62, 1.5, _hao);
diffuseColor.rgb += vec3(0.01, 0.04, 0.08) * _hao;`,
      )
  }

  return mat
}

export function createTerrainWireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.8,
    wireframe: true,
    transparent: true,
    opacity: 0.7,
    roughness: 0.5,
    metalness: 0.2,
    depthWrite: false,
    depthTest: true,
  })
}
