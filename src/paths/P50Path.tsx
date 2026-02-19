import React, { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { normToWorld } from "@/spatial/SpatialProjector";
import { createSeed } from "@/terrain/seed";
import { sampleTerrainHeight } from "@/terrain/buildTerrain";
import { getStmEnabled, sampleStmDisplacement } from "@/render/stm/stmRuntime";
import type { HeightSampler } from "@/terrain/corridorTopology";
import ValueBeacons from "@/paths/ValueBeacons";
import StrategicMarkers from "@/terrain/StrategicMarkers";

function FlowFilamentMaterial({
    speed = 0.18,
    density = 20.0,
}: {
    speed?: number;
    density?: number;
}) {
    const mat = React.useMemo(() => {
        const m = new THREE.ShaderMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uTime: { value: 0 },
                uSpeed: { value: speed },
                uDensity: { value: density },
                uCore: { value: new THREE.Color(0x22d3ee) },
                uHalo: { value: new THREE.Color(0x7dd3fc) },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform float uTime;
                uniform float uSpeed;
                uniform float uDensity;
                uniform vec3 uCore;
                uniform vec3 uHalo;

                // deterministic tiny noise
                float hash(vec2 p){
                    p = fract(p*vec2(123.34, 456.21));
                    p += dot(p, p+45.32);
                    return fract(p.x*p.y);
                }

                void main() {
                    // Along-path coord (0..1)
                    float t = vUv.y;

                    // Across-width (0..1)
                    float x = vUv.x;

                    // Centerline profile (brightest at center)
                    float center = 1.0 - smoothstep(0.28, 0.52, abs(x - 0.5));
                    // Softer edge rolloff
                    float edge = smoothstep(0.02, 0.18, x) * (1.0 - smoothstep(0.82, 0.98, x));

                    // Flow phase (scrolls along the path)
                    float phase = t * uDensity - uTime * uSpeed;

                    // Primary streak band
                    float f = fract(phase);
                    float streak = smoothstep(0.52, 0.50, abs(f - 0.5)); // thin band

                    // Secondary streaks (higher freq)
                    float f2 = fract(phase * 2.7);
                    float streak2 = smoothstep(0.53, 0.50, abs(f2 - 0.5));

                    // Micro shimmer noise so it doesn’t look like a flat shader
                    float n = hash(vec2(t * 240.0, x * 90.0 + uTime * 0.04));
                    float shimmer = smoothstep(0.55, 1.0, n);

                    // Intensity composition
                    float intensity = (0.55 * streak + 0.35 * streak2) * (0.75 + 0.25 * shimmer);
                    intensity *= (0.25 + 0.75 * center) * edge;

                    // Color blend: halo at edges, core at center
                    vec3 col = mix(uHalo, uCore, center);

                    // Alpha (controlled, not gamey)
                    float alpha = intensity * 0.85;

                    gl_FragColor = vec4(col, alpha);
                }
            `,
        });
        return m;
    }, [speed, density]);

    useEffect(() => {
        mat.uniforms.uSpeed.value = speed;
        mat.uniforms.uDensity.value = density;
    }, [mat, speed, density]);

    useFrame((_, delta) => {
        mat.uniforms.uTime.value += delta;
    });

    useEffect(() => {
        return () => {
            mat.dispose();
        };
    }, [mat]);

    return <primitive object={mat} attach="material" />;
}

function TitaniumRailMaterial() {
    const mat = React.useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: false,
            depthTest: true,
            depthWrite: true,
            uniforms: {
                uBase: { value: new THREE.Color("#0b1220") },
                uSheen: { value: new THREE.Color("#1b2a3a") },
                uEdge: { value: new THREE.Color("#2dd4ff") },
                uEdgeStrength: { value: 0.18 },
                uInsideStrength: { value: 0.14 },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vN;
                varying vec3 vV;
                varying float vTurn;
                attribute float turnS;

                void main() {
                    vUv = uv;

                    // normal in view space
                    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                    vV = normalize(-mvPos.xyz);
                    vN = normalize(normalMatrix * normal);

                    vTurn = turnS;

                    gl_Position = projectionMatrix * mvPos;
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vN;
                varying vec3 vV;
                varying float vTurn;

                uniform vec3 uBase;
                uniform vec3 uSheen;
                uniform vec3 uEdge;
                uniform float uEdgeStrength;
                uniform float uInsideStrength;

                void main() {
                    // Fresnel edge (subtle, not neon)
                    float ndv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
                    float fres = pow(1.0 - ndv, 2.5);

                    // Inside-turn mask from UV across width:
                    // If vTurn > 0, right side is inside; if vTurn < 0, left side is inside.
                    float insideRight = smoothstep(0.52, 1.0, vUv.x);
                    float insideLeft  = 1.0 - smoothstep(0.0, 0.48, vUv.x);
                    float insideMask = mix(insideLeft, insideRight, step(0.0, vTurn));
                    float insideAmt = abs(vTurn) * insideMask;

                    // Base coated-metal shading
                    vec3 col = uBase;

                    // Gentle sheen band around center
                    float center = 1.0 - smoothstep(0.28, 0.52, abs(vUv.x - 0.5));
                    col = mix(col, uSheen, center * 0.35);

                    // Inside-turn highlight (banking cue)
                    col += uSheen * (insideAmt * uInsideStrength);

                    // Edge cyan (very controlled)
                    col += uEdge * (fres * uEdgeStrength);

                    gl_FragColor = vec4(col, 1.0);
                }
            `,
        });
    }, []);

    useEffect(() => {
        return () => {
            mat.dispose();
        };
    }, [mat]);

    return <primitive object={mat} attach="material" />;
}

/**
 * Shared helper: generate world-space XZ control points from path nodes.
 * Returns { points, heightSampler } for use with buildRibbonGeometry.
 *
 * COORDINATE SYSTEM:
 * - Terrain PlaneGeometry(560, 360) rotated -╧Ç/2 around X, shifted Y by -6
 * - World X = planeX
 * - World Z = planeY (depth axis)
 * - World Y = height (planeZ after rotation) + offset
 */
export function nodesToWorldXZ(
    nodes: ReturnType<typeof generateP50Nodes>,
    seed: number,
): { points: { x: number; z: number }[]; getHeightAt: HeightSampler } {
    const points = nodes.map((n) => {
        const world = normToWorld(n.coord);
        return { x: world.x, z: world.y }; // projector "y" ΓåÆ ground Z
    });

    const getHeightAt: HeightSampler = (worldX, worldZ) => {
        const base = sampleTerrainHeight(worldX, worldZ, seed);
        const stm = getStmEnabled() ? sampleStmDisplacement(worldX, worldZ) : 0;
        return base + stm;
    };

    return { points, getHeightAt };
}

export default function P50Path({
    scenarioId = "baseline",
    visible = true,
}: {
    scenarioId?: string;
    visible?: boolean;
}) {
    const seed = useMemo(() => createSeed(scenarioId), [scenarioId]);
    const nodes = useMemo(() => generateP50Nodes(), []);
    const { points, getHeightAt } = useMemo(() => nodesToWorldXZ(nodes, seed), [nodes, seed]);

    const curve = useMemo(() => {
        const pts = points.map((p) => new THREE.Vector3(p.x, 0, p.z));
        return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.25);
    }, [points]);

    const smoothCurve = useMemo(() => {
        const resampled = curve.getSpacedPoints(80);
        return new THREE.CatmullRomCurve3(resampled, false, "catmullrom", 0.25);
    }, [curve]);

    const geom = useMemo(() => {
        if (points.length < 2) return null;
        return makeRibbon(smoothCurve, 420, 2.4, getHeightAt);
    }, [smoothCurve, getHeightAt, points.length]);

    const groundGeom = useMemo(() => {
        if (points.length < 2) return null;
        // narrower + slightly closer to terrain
        return makeRibbon(smoothCurve, 420, 2.7, getHeightAt, -0.06);
    }, [smoothCurve, getHeightAt, points.length]);

    useEffect(() => {
        return () => {
            geom?.dispose?.();
            groundGeom?.dispose?.();
        };
    }, [geom, groundGeom]);

    if (!visible) return null;

    if (!geom) return null;

    return (
        <group name={`path-${scenarioId}`} frustumCulled={false}>
            {/* Cut shadow band */}
            {groundGeom && (
                <mesh geometry={groundGeom} renderOrder={48} frustumCulled={false}>
                    <shaderMaterial
                        transparent
                        depthWrite={false}
                        depthTest
                        side={THREE.DoubleSide}
                        uniforms={{
                            uBaseAlpha: { value: 0.16 },
                            uSlopeBoost: { value: 0.18 },
                            uCurveBoost: { value: 0.14 },
                            uSoftness: { value: 0.32 },
                            uColor: { value: new THREE.Color("#02060a") },
                        }}
                        vertexShader={`
                            varying vec2 vUv;
                            varying float vSlope;
                            varying float vK;
                            attribute float slope;
                            attribute float curveK;

                            void main() {
                                vUv = uv;
                                vSlope = slope;
                                vK = curveK;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `}
                        fragmentShader={`
                            varying vec2 vUv;
                            varying float vSlope;
                            varying float vK;

                            uniform float uBaseAlpha;
                            uniform float uSlopeBoost;
                            uniform float uCurveBoost;
                            uniform float uSoftness;
                            uniform vec3 uColor;

                            void main() {
                                // edge fade across ribbon width
                                float left = smoothstep(0.0, uSoftness, vUv.x);
                                float right = 1.0 - smoothstep(1.0 - uSoftness, 1.0, vUv.x);
                                float edgeFade = left * right;

                                // combined weighting
                                float w = uBaseAlpha + vSlope * uSlopeBoost + vK * uCurveBoost;

                                // extra clamp so it never gets inky
                                float a = clamp(w, 0.0, 0.42) * edgeFade;

                                gl_FragColor = vec4(uColor, a);
                            }
                        `}
                    />
                </mesh>
            )}

            {/* Titanium rail body */}
            {/* Titanium rail body (banking-aware coated metal) */}
            <mesh geometry={geom} renderOrder={49} frustumCulled={false}>
                <TitaniumRailMaterial />
            </mesh>

            {/* Cyan filament (flowing current) */}
            <mesh geometry={geom} renderOrder={50} frustumCulled={false}>
                <FlowFilamentMaterial speed={0.18} density={20.0} />
            </mesh>

            {/* Outer halo */}
            <mesh
                geometry={geom}
                renderOrder={51}
                frustumCulled={false}
                scale={[1.03, 1.0, 1.03]}
            >
                <meshBasicMaterial
                    color={0x22d3ee}
                    transparent
                    opacity={0.12}
                    depthTest={false}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            <ValueBeacons curve={smoothCurve} getHeightAt={getHeightAt} />
            <StrategicMarkers />
        </group>
    );
}

/**
 * Ribbon: terrain-follow feel comes from banking + subtle vertical undulation.
 */
function makeRibbon(
    curve: THREE.CatmullRomCurve3,
    segments: number,
    width: number,
    getHeightAt: HeightSampler,
    liftOffset = 0,
) {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const slopes: number[] = [];
    const curvatures: number[] = [];
    const turns: number[] = [];

    const up = new THREE.Vector3(0, 1, 0);
    const prevNormal = new THREE.Vector3(1, 0, 0);
    const prevTangent = new THREE.Vector3(1, 0, 0);
    const prevP = new THREE.Vector3();

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const p = curve.getPoint(t);

        // subtle undulation so it isn't a sterile strip
        const lift = Math.sin(t * Math.PI * 2.0) * 0.18 + Math.sin(t * Math.PI * 4.0) * 0.08;
        p.y = getHeightAt(p.x, p.z) + 0.22 + lift + liftOffset;

        const tangent = curve.getTangent(t).normalize();

        // slope proxy: how much the segment points up/down
        // 0 = flat, 1 = steep
        let slope = 0.0;
        if (i < segments) {
            const t2 = (i + 1) / segments;
            const p2 = curve.getPoint(t2);
            const lift2 =
                Math.sin(t2 * Math.PI * 2.0) * 0.18 +
                Math.sin(t2 * Math.PI * 4.0) * 0.08;
            p2.y = getHeightAt(p2.x, p2.z) + 0.22 + lift2 + liftOffset;
            const segDir = p2.sub(p).normalize();
            slope = THREE.MathUtils.clamp(Math.abs(segDir.y) * 3.0, 0, 1);
        } else if (i > 0) {
            const segDir = p.clone().sub(prevP).normalize();
            slope = THREE.MathUtils.clamp(Math.abs(segDir.y) * 3.0, 0, 1);
        }

        // curvature proxy: how much tangent changes vs previous step
        // 0 = straight, 1 = sharp turn
        let k = 0.0;
        let turnS = 0.0;
        if (i > 0) {
            const dot = THREE.MathUtils.clamp(prevTangent.dot(tangent), -1, 1);
            const angle = Math.acos(dot); // radians, 0..pi
            k = THREE.MathUtils.clamp(angle / 0.45, 0, 1);

            // signed turn direction (left/right) in horizontal plane
            const prevH = prevTangent.clone();
            prevH.y = 0;
            prevH.normalize();
            const curH = tangent.clone();
            curH.y = 0;
            curH.normalize();
            const crossY = prevH.x * curH.z - prevH.z * curH.x;
            const sign = crossY >= 0 ? 1.0 : -1.0;
            turnS = sign * k;
        }
        prevTangent.copy(tangent);

        // Banking: rotate binormal around tangent slightly
        const bank = Math.sin(t * Math.PI * 2.0) * 0.20;
        const normal = prevNormal.clone().cross(tangent).cross(tangent).normalize();
        if (normal.lengthSq() < 1e-6) normal.copy(prevNormal);
        prevNormal.copy(normal);

        const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        const banked = binormal.clone().applyAxisAngle(tangent, bank).normalize();

        const left = p.clone().addScaledVector(banked, -width * 0.5);
        const right = p.clone().addScaledVector(banked, width * 0.5);

        positions.push(left.x, left.y, left.z);
        positions.push(right.x, right.y, right.z);

        slopes.push(slope);
        slopes.push(slope);
        curvatures.push(k);
        curvatures.push(k);
        turns.push(turnS);
        turns.push(turnS);

        uvs.push(0, t);
        uvs.push(1, t);

        prevP.copy(p);
    }

    for (let i = 0; i < segments; i++) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;

        indices.push(a, c, b);
        indices.push(b, c, d);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setAttribute("slope", new THREE.Float32BufferAttribute(slopes, 1));
    geom.setAttribute("curveK", new THREE.Float32BufferAttribute(curvatures, 1));
    geom.setAttribute("turnS", new THREE.Float32BufferAttribute(turns, 1));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
    return geom;
}
