// STM runtime state + CPU-side sampler
//
// Purpose:
// - Keep corridor/path/marker Y positions aligned with GPU-side STM vertex displacement.
// - Provide a lightweight, dependency-free bridge from injected shader uniforms to
//   CPU geometry builders (P50Path, markers, pedestals).

let baselineStructureCurve: Float32Array | null = null;
let stmTopoScale = 8.0;
let stmTopoWidth = 70.0;
let stmEnabled = true;

function clamp01(n: number) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
}

function smoothstep(edge0: number, edge1: number, x: number) {
    if (edge0 === edge1) return x < edge0 ? 0 : 1;
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

/**
 * Ridge sharpening — accentuates peaks and deepens valleys.
 * Must match GPU sharpen() in injectTopography.
 */
function sharpen(h: number): number {
    return Math.sign(h) * Math.pow(Math.abs(h), 1.4);
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function sampleCurveLinear(values: Float32Array, t: number) {
    const n = values.length;
    if (n <= 1) return n === 1 ? clamp01(values[0]) : 0;
    const ft = clamp01(t) * (n - 1);
    const i0 = Math.floor(ft);
    const i1 = Math.min(n - 1, i0 + 1);
    const f = ft - i0;
    return clamp01(lerp(values[i0], values[i1], f));
}

/** Set the baseline structure curve (values in [0..1], aligned to corridor t). */
export function setStmStructureCurve(values: Float32Array | null) {
    baselineStructureCurve = values;
}

export function getStmStructureCurve() {
    return baselineStructureCurve;
}

export function setStmTopoScale(scale: number) {
    if (!Number.isFinite(scale)) return;
    stmTopoScale = scale;
}

export function getStmTopoScale() {
    return stmTopoScale;
}

export function setStmTopoWidth(width: number) {
    if (!Number.isFinite(width) || width <= 1e-6) return;
    stmTopoWidth = width;
}

export function getStmTopoWidth() {
    return stmTopoWidth;
}

export function setStmEnabled(enabled: boolean) {
    stmEnabled = !!enabled;
}

export function getStmEnabled() {
    return stmEnabled;
}

/**
 * CPU-side replica of STM vertex displacement.
 * Must match the GLSL in `injectTopography`.
 */
export function sampleStmDisplacement(worldX: number, worldZ: number) {
    const curve = baselineStructureCurve;
    if (!stmEnabled) return 0;
    if (!curve || curve.length < 2) return 0;
    if (!Number.isFinite(worldX) || !Number.isFinite(worldZ)) return 0;
    if (Math.abs(stmTopoScale) < 1e-6) return 0;

    // Map world X to corridor parameter t [0..1]
    // Corridor spans X: -220 → +220 in local/world space.
    const t = clamp01((worldX + 220.0) / 440.0);

    // Distance from corridor centerline — local Y ≈ -worldZ after -π/2 rotation.
    const dist = Math.abs(worldZ);
    const falloff = Math.exp(-(dist * dist) / (stmTopoWidth * stmTopoWidth));

    const structure = sampleCurveLinear(curve, t);

    // Edge fade to prevent popping at corridor ends.
    const edgeIn = smoothstep(0.0, 0.08, t);
    const edgeOut = 1.0 - smoothstep(0.92, 1.0, t);
    const edgeFade = edgeIn * edgeOut;

    // Apply ridge sharpening (must match GPU sharpen())
    const rawDisp = sharpen(structure * falloff * edgeFade);

    return rawDisp * stmTopoScale;
}
