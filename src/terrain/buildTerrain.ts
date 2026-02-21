import * as THREE from "three";
import { terrainHeightMode } from "@/config/featureFlags";
import { TERRAIN_CONSTANTS } from "./terrainConstants";

/**
 * Sample terrain height at world coordinates.
 * Single source of truth for all path/marker height queries.
 */
export function sampleTerrainHeight(
    worldX: number,
    worldZ: number,
    seed: number,
    params = TERRAIN_CONSTANTS,
): number {
    if (terrainHeightMode === "neutral") {
        return params.yOffset;
    }

    const heightRel = heightfieldAtWorld(worldX, worldZ, seed, params);
    return heightRel + params.yOffset;
}

/**
 * buildTerrain — creates a real mountain-like heightfield (undulations + peaks + ridge).
 * Deterministic for a given seed.
 */
export function buildTerrain(size: number, seed: number, reliefScalar: number = 1.0) {
    const segments = 220;
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

    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
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

    // 8 dramatic mountain peaks — taller amplitudes, wider spread
    const peaks = Array.from({ length: 8 }).map(() => {
        const px = lerp(-params.width * 0.34, params.width * 0.34, rand());
        const pz = lerp(-params.depth * 0.22, params.depth * 0.22, rand());
        const amp = lerp(12, 32, rand());
        const spread = lerp(14, 28, rand());
        return { px, pz, amp, spread };
    });

    const ridgeAngle = lerp(-0.6, 0.6, rand());
    const ridgeDir = new THREE.Vector2(Math.cos(ridgeAngle), Math.sin(ridgeAngle)).normalize();
    const ridgeCenter = new THREE.Vector2(lerp(-8, 8, rand()), lerp(-6, 6, rand()));
    const ridgeAmp = lerp(6, 12, rand());
    const ridgeWidth = lerp(12, 22, rand());

    const model: SeedModel = { peaks, ridgeDir, ridgeCenter, ridgeAmp, ridgeWidth, seed };
    SEED_MODEL_CACHE.set(seed, model);
    return model;
}

function heightfieldAtWorld(
    worldX: number,
    worldZ: number,
    seed: number,
    params: typeof TERRAIN_CONSTANTS,
): number {
    const model = getSeedModel(seed, params);
    return heightfieldFromModel(worldX, worldZ, model, params);
}

function heightfieldFromModel(
    x: number,
    z: number,
    model: SeedModel,
    params: typeof TERRAIN_CONSTANTS,
): number {
    // 1) Broad undulation (cheap pseudo-noise)
    const u1 = Math.sin(x * 0.07 + model.seed * 0.001) * 1.2;
    const u2 = Math.cos(z * 0.06 - model.seed * 0.001) * 1.0;
    const u3 = Math.sin(x * 0.03 + z * 0.04) * 1.4;
    const baseNoise = u1 + u2 + u3;

    // Macro lift/valley shaping (low-frequency)
    const macroNoise =
        Math.sin(x * 0.012 + model.seed * 0.002) *
        Math.cos(z * 0.01 - model.seed * 0.002);

    // Terrain weighting (realism boost)
    let h = baseNoise * 1.2 + macroNoise * 6.0;

    // 2) Mountain peaks (Gaussian bumps)
    for (const p of model.peaks) {
        const dx = x - p.px;
        const dz = z - p.pz;
        const d2 = (dx * dx + dz * dz) / (p.spread * p.spread);
        h += p.amp * Math.exp(-d2);
    }

    // 3) Main ridge (distance-to-line falloff)
    const vx = x - model.ridgeCenter.x;
    const vz = z - model.ridgeCenter.y;
    const cross = Math.abs(vx * model.ridgeDir.y - vz * model.ridgeDir.x);
    const ridgeShape = Math.exp(-(cross * cross) / (model.ridgeWidth * model.ridgeWidth));
    h += model.ridgeAmp * ridgeShape * 3.5;

    // 3b) Strategic valley — gentle depression along central trajectory corridor
    // This creates the natural channel the P50 path flows through
    const valleyWidth = 40;
    const valleyDepth = 4.5;
    const valleyFalloff = Math.exp(-(z * z) / (valleyWidth * valleyWidth));
    h -= valleyDepth * valleyFalloff * smoothstep(0.0, 1.0, 1.0 - Math.abs(x) / (params.width * 0.42));

    // 4) Edge falloff so edges don't look like a table
    const edge = smoothstep(
        0.0,
        1.0,
        1.0 -
        Math.max(Math.abs(x) / (params.width * 0.5), Math.abs(z) / (params.depth * 0.5)),
    );
    h *= lerp(0.35, 1.0, edge);

    // 5) Clamp + shape
    h *= 0.90;
    h = Math.max(-2.5, h);
    h = Math.pow(Math.max(0, h), 1.08) + Math.min(0, h);

    return h;
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

function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
