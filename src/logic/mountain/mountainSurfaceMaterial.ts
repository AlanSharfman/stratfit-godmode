// src/logic/mountain/mountainSurfaceMaterial.ts
// STRATFIT — Mountain Surface Material (Structural Heat Tint)
//
// Goal: apply a subtle, institutional tint to the mountain surface based on
// aggregate structural composition quality (0–100).
// - Strong: cooler cyan tone
// - Weak: deeper charcoal with faint red undertone
// - No animation, no flicker, no lava

import * as THREE from "three";

type Patched = {
  uniforms: Record<string, unknown> & { uStructuralHeat: { value: number } };
};

type HeatUserData = {
  __sfStructuralHeat?: Patched;
  __sfStructuralHeatValue?: number;
  __sfStructuralHeatPatched?: boolean;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

/**
 * Ensure the provided MeshStandardMaterial is patched with a deterministic
 * structural heat tint uniform. Safe to call repeatedly.
 *
 * @param material MeshStandardMaterial to patch
 * @param score01 normalized 0..1 (1 = strong, 0 = weak)
 */
export function setStructuralHeatTint(material: THREE.MeshStandardMaterial, score01: number) {
  const heat01 = clamp01(score01);
  const ud = material.userData as HeatUserData;
  ud.__sfStructuralHeatValue = heat01;

  // Keep a stable reference in userData so we can update without recompiling.
  const existing = ud.__sfStructuralHeat;
  if (existing?.uniforms?.uStructuralHeat) {
    existing.uniforms.uStructuralHeat.value = heat01;
    return;
  }

  // Already patched (waiting for first compile) — nothing else to do yet.
  if (ud.__sfStructuralHeatPatched) return;
  ud.__sfStructuralHeatPatched = true;

  material.onBeforeCompile = (shader) => {
    const initial = clamp01((ud.__sfStructuralHeatValue ?? heat01) as number);
    shader.uniforms.uStructuralHeat = { value: initial };

    // Inject uniform declaration and tint logic.
    // We tint `diffuseColor.rgb` very slightly, preserving vertex colors.
    if (!shader.fragmentShader.includes("uniform float uStructuralHeat;")) {
      shader.fragmentShader = `uniform float uStructuralHeat;\n${shader.fragmentShader}`;
    }
    const injectAfter = "vec4 diffuseColor = vec4( diffuse, opacity );";
    if (shader.fragmentShader.includes(injectAfter)) {
      shader.fragmentShader = shader.fragmentShader.replace(
        injectAfter,
        [
          injectAfter,
          "",
          "// STRATFIT structural heat tint (deterministic, subtle)",
          "float sfHeat = clamp(uStructuralHeat, 0.0, 1.0);",
          "float sfWeak = 1.0 - sfHeat;",
          "",
          "// Strong => cooler cyan lift (institutional, non-neon)",
          "vec3 sfCool = vec3(0.10, 0.55, 0.72);",
          "// Weak => deeper charcoal + faint red undertone (not a warning fill)",
          "vec3 sfCharcoal = vec3(0.06, 0.07, 0.09);",
          "vec3 sfRedUnder = vec3(0.26, 0.06, 0.10);",
          "",
          "vec3 sfStrongTarget = diffuseColor.rgb + sfCool * 0.20;",
          "vec3 sfWeakTarget = mix(sfCharcoal, sfRedUnder, 0.18);",
          "",
          "// Mix weights capped to keep this as a read, not a repaint",
          "diffuseColor.rgb = mix(diffuseColor.rgb, sfStrongTarget, sfHeat * 0.07);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb, sfWeakTarget, 0.40), sfWeak * 0.08);",
        ].join("\n"),
      );
    } else {
      // If Three changes its chunk layout, we still keep uniform for future hooks.
      // (Fail-safe: no tint rather than incorrect tint.)
    }

    // Ensure the uniform is accessible for updates post-compile.
    ud.__sfStructuralHeat = { uniforms: shader.uniforms as Patched["uniforms"] };
  };

  // Force recompile once to pick up onBeforeCompile changes.
  material.needsUpdate = true;
}


