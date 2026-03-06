import * as THREE from "three";
import { terrainHeightMode } from "@/config/featureFlags";
import { TERRAIN_CONSTANTS } from "./terrainConstants";
import type { TerrainMetrics } from "./terrainFromBaseline";
import type { MetricsAtX } from "./timeSeriesTerrainMetrics";

export type MetricsInput = TerrainMetrics | MetricsAtX;

/**
 * Sample terrain height at world coordinates.
 * Single source of truth for all path/marker height queries.
 */
export function sampleTerrainHeight(
    worldX: number,
    worldZ: number,
    seed: number,
    params = TERRAIN_CONSTANTS,
    metrics?: MetricsInput,
): number {
    if (terrainHeightMode === "neutral") {
        return params.yOffset;
    }

    const resolved: TerrainMetrics | undefined = typeof metrics === "function"
        ? metrics((worldX + params.width * 0.5) / params.width)
        : metrics;

    const heightRel = heightfieldAtWorld(worldX, worldZ, seed, params, resolved);
    return heightRel + params.yOffset;
}

/**
 * buildTerrain — creates a real mountain-like heightfield (undulations + peaks + ridge).
 * Deterministic for a given seed.
 */
export function buildTerrain(_size: number, seed: number, reliefScalar: number = 1.0) {
    const segments = TERRAIN_CONSTANTS.segments;
    const geo = new THREE.PlaneGeometry(
        TERRAIN_CONSTANTS.width,
        TERRAIN_CONSTANTS.depth,
        segments,
        segments,
    );

    if (terrainHeightMode === "neutral") {
        geo.computeVertexNormals();
        geo.computeBoundingSphere();
        return geo;
    }

    const pos = geo.attributes.position as THREE.BufferAttribute;

    // Seed model is cached; avoid re-deriving peaks/ridge per vertex.
    const model = getSeedModel(seed, TERRAIN_CONSTANTS);

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getY(i); // PlaneGeometry uses X/Y; later rotated in TerrainStage

        const h = heightfieldFromModel(x, z, model, TERRAIN_CONSTANTS) * reliefScalar;
        pos.setZ(i, h);
    }

    slopeClampGeometry(pos, segments);
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
}

/** Backward-compatible overload: allow optional metrics without changing all call sites. */
export function buildTerrainWithMetrics(
    _size: number,
    seed: number,
    reliefScalar: number = 1.0,
    metrics?: MetricsInput,
) {
    const segments = TERRAIN_CONSTANTS.segments;
    const geo = new THREE.PlaneGeometry(
        TERRAIN_CONSTANTS.width,
        TERRAIN_CONSTANTS.depth,
        segments,
        segments,
    );

    if (terrainHeightMode === "neutral") {
        geo.computeVertexNormals();
        geo.computeBoundingSphere();
        return geo;
    }

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const model = getSeedModel(seed, TERRAIN_CONSTANTS);
    const isFunction = typeof metrics === "function";
    const halfW = TERRAIN_CONSTANTS.width * 0.5;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getY(i); // PlaneGeometry uses X/Y; later rotated in TerrainStage

        const resolved: TerrainMetrics | undefined = isFunction
            ? metrics((x + halfW) / TERRAIN_CONSTANTS.width)
            : metrics;

        const h = heightfieldFromModel(x, z, model, TERRAIN_CONSTANTS, resolved) * reliefScalar;
        pos.setZ(i, h);
    }

    slopeClampGeometry(pos, segments);
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
}

const BT_MAX_SLOPE = 0.7;
const BT_CLAMP_PASSES = 2;

function slopeClampGeometry(pos: THREE.BufferAttribute, segments: number): void {
    const vpr = segments + 1;
    for (let pass = 0; pass < BT_CLAMP_PASSES; pass++) {
        let violations = 0;
        for (let row = 0; row < vpr; row++) {
            for (let col = 0; col < vpr; col++) {
                const i = row * vpr + col;
                if (col > 0) {
                    const left = pos.getZ(i - 1);
                    const diff = pos.getZ(i) - left;
                    if (Math.abs(diff) > BT_MAX_SLOPE) {
                        pos.setZ(i, left + Math.sign(diff) * BT_MAX_SLOPE);
                        violations++;
                    }
                }
                if (row > 0) {
                    const above = pos.getZ(i - vpr);
                    const diff = pos.getZ(i) - above;
                    if (Math.abs(diff) > BT_MAX_SLOPE) {
                        pos.setZ(i, above + Math.sign(diff) * BT_MAX_SLOPE);
                        violations++;
                    }
                }
            }
        }
        for (let row = vpr - 1; row >= 0; row--) {
            for (let col = vpr - 1; col >= 0; col--) {
                const i = row * vpr + col;
                if (col < vpr - 1) {
                    const right = pos.getZ(i + 1);
                    const diff = pos.getZ(i) - right;
                    if (Math.abs(diff) > BT_MAX_SLOPE) {
                        pos.setZ(i, right + Math.sign(diff) * BT_MAX_SLOPE);
                        violations++;
                    }
                }
                if (row < vpr - 1) {
                    const below = pos.getZ(i + vpr);
                    const diff = pos.getZ(i) - below;
                    if (Math.abs(diff) > BT_MAX_SLOPE) {
                        pos.setZ(i, below + Math.sign(diff) * BT_MAX_SLOPE);
                        violations++;
                    }
                }
            }
        }
        if (violations === 0) break;
    }
}

type Peak = { px: number; pz: number; amp: number; spread: number };
type SeedModel = {
    peaks: Peak[];
    ridgeDir: THREE.Vector2;
    ridgeCenter: THREE.Vector2;
    ridgeAmp: number;
    ridgeWidth: number;
    seed: number;
};

const SEED_MODEL_CACHE = new Map<number, SeedModel>();

function getSeedModel(seed: number, params: typeof TERRAIN_CONSTANTS): SeedModel {
    const cached = SEED_MODEL_CACHE.get(seed);
    if (cached) return cached;

    const rand = mulberry32(seed);

    const peaks = Array.from({ length: 5 }).map(() => {
        const px = lerp(-params.width * 0.28, params.width * 0.28, rand());
        const pz = lerp(-params.depth * 0.18, params.depth * 0.18, rand());
        const amp = lerp(16, 38, rand());
        const spread = lerp(14, 28, rand());
        return { px, pz, amp, spread };
    });

    const ridgeAngle = lerp(-0.6, 0.6, rand());
    const ridgeDir = new THREE.Vector2(Math.cos(ridgeAngle), Math.sin(ridgeAngle)).normalize();
    const ridgeCenter = new THREE.Vector2(lerp(-8, 8, rand()), lerp(-6, 6, rand()));
    const ridgeAmp = lerp(9, 18, rand());
    const ridgeWidth = lerp(14, 24, rand());

    const model: SeedModel = { peaks, ridgeDir, ridgeCenter, ridgeAmp, ridgeWidth, seed };
    SEED_MODEL_CACHE.set(seed, model);
    return model;
}

function heightfieldAtWorld(
    worldX: number,
    worldZ: number,
    seed: number,
    params: typeof TERRAIN_CONSTANTS,
    metrics?: TerrainMetrics,
): number {
    const model = getSeedModel(seed, params);
    return heightfieldFromModel(worldX, worldZ, model, params, metrics);
}

/** Strategic-vs-procedural weighting — strategic form dominates */
const BT_STRATEGIC_WEIGHT = 0.68;
const BT_PROCEDURAL_WEIGHT = 0.32;

/**
 * Strategic skeleton from TerrainMetrics.
 * elevationScale drives peak height, growthSlope drives ridge,
 * liquidityDepth drives valley depth, roughness drives erosion.
 */
function strategicSkeletonFromMetrics(
    x: number,
    z: number,
    model: SeedModel,
    params: typeof TERRAIN_CONSTANTS,
    metrics: TerrainMetrics,
): number {
    const elevationScale = clampRange(metrics.elevationScale, 0.35, 3.0);
    const growthSlope = clampRange(metrics.growthSlope, 0, 2.0);
    const liquidityDepth = clampRange(metrics.liquidityDepth, 0, 2.0);
    const volatility = clampRange(metrics.volatility, 0, 2.0);

    const halfW = params.width * 0.5;
    const halfD = params.depth * 0.5;
    const nx = (x + halfW) / params.width;
    const nz = (z + halfD) / params.depth;

    // Summit peak — position and height driven by elevationScale (enterprise value)
    const summitCx = model.ridgeCenter.x;
    const summitCz = model.ridgeCenter.y;
    const sdx = x - summitCx;
    const sdz = z - summitCz;
    const summitDist2 = (sdx * sdx + sdz * sdz) / (model.ridgeWidth * model.ridgeWidth * 4);
    const summit = model.ridgeAmp * elevationScale * 2.0 * Math.exp(-summitDist2);

    // Growth ridge — main spine whose prominence scales with growthSlope
    const ridgeCz = model.ridgeCenter.y + Math.sin(x * 0.04 + model.seed * 0.03) * 3.0;
    const ridgeDist = z - ridgeCz;
    const ridgeProfile = Math.exp(-(ridgeDist * ridgeDist) / (model.ridgeWidth * model.ridgeWidth));
    const ridge = model.ridgeAmp * (0.5 + growthSlope * 1.2) * ridgeProfile;

    // Liquidity valley — deepens when liquidityDepth is low (< 1.0 = stressed)
    const valleyStrength = Math.max(0, 1.0 - liquidityDepth) * 12.0;
    const valleyPos = 0.25;
    const vdx = nx - valleyPos;
    const valleyProfile = Math.exp(-(vdx * vdx) / 0.02);
    const valley = -valleyStrength * valleyProfile;

    // Stability modulation — high volatility fragments the terrain
    const instability = volatility > 0.5
        ? (volatility - 0.5) * 4.0 * Math.sin(x * 0.15 + z * 0.12 + model.seed) * 0.5
        : 0;

    // Edge falloff
    const edge = smoothstep(
        0.0, 1.0,
        1.0 - Math.max(Math.abs(x) / halfW, Math.abs(z) / halfD),
    );

    return (summit + ridge + valley + instability) * lerp(0.3, 1.0, edge);
}

/** Procedural realism layer — texture and naturalism only */
function proceduralRealismLayer(
    x: number,
    z: number,
    model: SeedModel,
    params: typeof TERRAIN_CONSTANTS,
    metrics?: TerrainMetrics,
): number {
    const roughness = clampRange(metrics?.roughness ?? 1, 0.25, 3.0);
    const noiseFreq = clampRange(metrics?.noiseFrequency ?? 1.0, 0.01, 3);
    const microDetail = clampRange(metrics?.microDetailStrength ?? 0.3, 0, 1);
    const valleyDepth = clampRange(metrics?.valleyDepth ?? 0.45, 0, 1);
    const peakSoftness = clampRange(metrics?.peakSoftness ?? 0.6, 0, 1);
    const elevationScale = clampRange(metrics?.elevationScale ?? 1, 0.35, 3.0);
    const ridgeIntensity = clampRange(metrics?.ridgeIntensity ?? 0.5, 0, 1);

    const u1 = Math.sin(x * 0.07 * noiseFreq + model.seed * 0.001) * 1.2;
    const u2 = Math.cos(z * 0.06 * noiseFreq - model.seed * 0.001) * 1.0;
    const u3 = Math.sin(x * 0.03 * noiseFreq + z * 0.04 * noiseFreq) * 1.4;
    const baseNoise = u1 + u2 + u3;

    const macroNoise =
        Math.sin(x * 0.012 * noiseFreq + model.seed * 0.002) *
        Math.cos(z * 0.01 * noiseFreq - model.seed * 0.002);
    const macroShaped = macroNoise < 0
        ? macroNoise * (1 + valleyDepth * 2)
        : macroNoise;

    let h = baseNoise * 1.2 * roughness + macroShaped * 6.0 * elevationScale;

    const peakDamp = lerp(1.0, 0.55, peakSoftness);
    for (const p of model.peaks) {
        const dx = x - p.px;
        const dz = z - p.pz;
        const d2 = (dx * dx + dz * dz) / (p.spread * p.spread);
        h += p.amp * elevationScale * Math.exp(-d2) * peakDamp;
    }

    const vx = x - model.ridgeCenter.x;
    const vz = z - model.ridgeCenter.y;
    const cross = Math.abs(vx * model.ridgeDir.y - vz * model.ridgeDir.x);
    const ridgeShape = Math.exp(-(cross * cross) / (model.ridgeWidth * model.ridgeWidth));
    h += model.ridgeAmp * elevationScale * ridgeShape * 3.5 * (ridgeIntensity * 2);

    const microNoise =
        Math.sin(x * 0.18 * noiseFreq + 97.1) * 0.8 +
        Math.cos(z * 0.22 * noiseFreq + 113.5) * 0.6;
    h += microNoise * microDetail * 2.5;

    const edge = smoothstep(
        0.0, 1.0,
        1.0 - Math.max(Math.abs(x) / (params.width * 0.5), Math.abs(z) / (params.depth * 0.5)),
    );
    h *= lerp(0.35, 1.0, edge);

    h *= 0.85;
    h = Math.max(-2.0, h);
    const powExp = lerp(1.15, 1.0, peakSoftness);
    h = Math.pow(Math.max(0, h), powExp) + Math.min(0, h);

    return h;
}

function heightfieldFromModel(
    x: number,
    z: number,
    model: SeedModel,
    params: typeof TERRAIN_CONSTANTS,
    metrics?: TerrainMetrics,
): number {
    const procedural = proceduralRealismLayer(x, z, model, params, metrics);

    if (metrics) {
        const skeleton = strategicSkeletonFromMetrics(x, z, model, params, metrics);
        return skeleton * BT_STRATEGIC_WEIGHT + procedural * BT_PROCEDURAL_WEIGHT;
    }

    return procedural;
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

function clampRange(x: number, min: number, max: number) {
    return Math.max(min, Math.min(max, x));
}

function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
