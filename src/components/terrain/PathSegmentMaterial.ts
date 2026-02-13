import * as THREE from "three";

/**
 * PathSegmentMaterial — Custom ShaderMaterial for the terrain-following ribbon path.
 *
 * Renders intermittent dash segments (runway/taxiway style) using UV.x along the ribbon.
 * Supports a one-time micro-pulse at a specific normalized t position (reference zone).
 *
 * Palette discipline:
 *   Cyan/Ice = stable, Emerald = strengthening, Red = stress
 *   No neon. Saturation max 80%.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uDashColor;
  uniform float uOpacity;
  uniform float uDashLength;
  uniform float uGapLength;
  uniform float uEmissiveStrength;

  // Pulse uniforms
  uniform float uPulseT;          // normalized t along path (0–1)
  uniform float uPulseStrength;   // 0 = no pulse, 1 = full pulse
  uniform vec3 uPulseToneColor;   // tint color for pulse
  uniform float uPulseWidth;      // width in normalized t

  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    float t = vUv.x; // along path
    float u = vUv.y; // across width

    // Dash pattern: modulo along path length
    float cycle = uDashLength + uGapLength;
    float phase = mod(t * 40.0, cycle); // scale t to world-ish units
    float isDash = step(phase, uDashLength);

    // Edge fade (soft edges across ribbon width)
    float edgeDist = abs(u - 0.5) * 2.0; // 0 at center, 1 at edges
    float edgeFade = 1.0 - smoothstep(0.75, 1.0, edgeDist);

    // Base surface color (matte)
    vec3 baseCol = uBaseColor * 0.35;

    // Dash segments: slightly brighter + mild emissive
    vec3 dashCol = uDashColor;
    vec3 surfaceColor = mix(baseCol, dashCol, isDash * 0.7);

    // Emissive contribution from dashes
    float emissive = isDash * uEmissiveStrength;

    // One-time reference zone pulse
    float pulseDist = abs(t - uPulseT) / max(uPulseWidth, 0.001);
    float pulseGlow = uPulseStrength * exp(-pulseDist * pulseDist * 4.0);
    surfaceColor += uPulseToneColor * pulseGlow * 0.6;
    emissive += pulseGlow * 0.3;

    // Final color
    vec3 finalColor = surfaceColor + surfaceColor * emissive;
    float finalAlpha = uOpacity * edgeFade * (0.4 + isDash * 0.6);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export type PathSegmentMaterialUniforms = {
  uBaseColor: { value: THREE.Color };
  uDashColor: { value: THREE.Color };
  uOpacity: { value: number };
  uDashLength: { value: number };
  uGapLength: { value: number };
  uEmissiveStrength: { value: number };
  uPulseT: { value: number };
  uPulseStrength: { value: number };
  uPulseToneColor: { value: THREE.Color };
  uPulseWidth: { value: number };
};

export function createPathSegmentMaterial(
  opts: {
    color?: string;
    dashColor?: string;
    opacity?: number;
    dashLength?: number;
    gapLength?: number;
    emissiveStrength?: number;
  } = {},
): THREE.ShaderMaterial {
  const uniforms: PathSegmentMaterialUniforms = {
    uBaseColor: { value: new THREE.Color(opts.color ?? "#5CCEE8") },
    uDashColor: { value: new THREE.Color(opts.dashColor ?? "#7FEAFF") },
    uOpacity: { value: opts.opacity ?? 0.88 },
    uDashLength: { value: opts.dashLength ?? 1.0 },
    uGapLength: { value: opts.gapLength ?? 0.7 },
    uEmissiveStrength: { value: opts.emissiveStrength ?? 0.18 },
    uPulseT: { value: -1 },
    uPulseStrength: { value: 0 },
    uPulseToneColor: { value: new THREE.Color("#5FD4FF") },
    uPulseWidth: { value: 0.06 },
  };

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
