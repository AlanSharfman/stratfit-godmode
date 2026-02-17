import React, { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { generateP50Nodes } from "@/paths/generatePath";
import { nodesToWorldXZ } from "@/paths/p50NodesTerrain";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry } from "@/terrain/corridorTopology";
import { useMarkerLinkStore } from "@/state/markerLinkStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { useScenarioStore } from "@/state/scenarioStore";
import {
    clamp01,
    deriveWorldStateMarkers,
    pickMarkerIndex,
    TYPE_HEX,
} from "./markerStrength";
import type { TrajectoryMarkerType } from "@/types/trajectory";

/**
 * StrategicLeverageMarkers — semantic production markers (baseline truth).
 * Goals:
 * - Readable at cinematic distance
 * - Obvious hover/active
 * - No orange
 * - Camera-distance scaling
 */

// Debug gate
const DEBUG_MARKERS =
    typeof window !== "undefined" &&
    import.meta.env.DEV &&
    (window as any).__SF_DEBUG_MARKERS__;

const EPSILON_Y = 0.03;
const BASE_SCALE = 1.35;
const MIN_SCALE = 1.0;
const MAX_SCALE = 2.2;

// Human-readable labels for marker IDs
const MARKER_LABEL: Record<string, string> = {
    "capital-dependency": "Capital Dependency",
    "burn-acceleration": "Burn Acceleration",
    "margin-volatility": "Margin Volatility",
    "revenue-concentration": "Revenue Concentration",
    "runway-strength": "Runway Strength",
};

// Palette discipline (no orange)
const TYPE_COLOR: Record<TrajectoryMarkerType, THREE.Color> = {
    risk_inflection: new THREE.Color("#EF4444"),
    runway_threshold: new THREE.Color("#EF4444"),
    leverage_opportunity: new THREE.Color("#6366F1"),
    confidence_shift: new THREE.Color("#22D3EE"),
};

function yawFromTangent(tan: THREE.Vector3) {
    return Math.atan2(tan.x, tan.z);
}

// ── Bezel Dot (anchor disc under marker) ─────────────────────────────────────

function BezelDot({ color }: { color: THREE.Color }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} renderOrder={20}>
            <circleGeometry args={[0.35, 32]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.25}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                depthTest
            />
        </mesh>
    );
}

// ── Glyphs ─────────────────────────────────────────────

function Halo({
    color,
    strength,
    active,
}: {
    color: THREE.Color;
    strength: number;
    active: boolean;
}) {
    const outer = 0.62 + 0.26 * strength;
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={21}>
            <ringGeometry args={[0.22, outer, 64]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={active ? 0.78 : 0.48}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                depthTest
            />
        </mesh>
    );
}

function MicroTick({
    color,
    kind,
    strength,
}: {
    color: THREE.Color;
    kind: TrajectoryMarkerType;
    strength: number;
}) {
    const base = 0.14 + 0.08 * strength;

    if (kind === "risk_inflection") {
        return (
            <group renderOrder={23}>
                <mesh position={[0, 0.11, base]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.16, 3]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.98}
                        depthWrite={false}
                        depthTest
                    />
                </mesh>
                <mesh position={[0, 0.085, base * 1.5]}>
                    <boxGeometry args={[0.04, 0.10, 0.20]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.92}
                        depthWrite={false}
                        depthTest
                    />
                </mesh>
            </group>
        );
    }

    if (kind === "runway_threshold") {
        return (
            <mesh position={[0, 0.13, base]} renderOrder={23}>
                <boxGeometry args={[0.05, 0.30, 0.05]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.98}
                    depthWrite={false}
                    depthTest
                />
            </mesh>
        );
    }

    if (kind === "leverage_opportunity") {
        return (
            <mesh position={[0, 0.18, 0]} renderOrder={23}>
                <octahedronGeometry args={[0.18 + 0.08 * strength, 0]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.6}
                    roughness={0.30}
                    metalness={0.18}
                    transparent
                    opacity={0.95}
                    depthWrite={false}
                />
            </mesh>
        );
    }

    // confidence_shift — ring glyph
    return (
        <mesh position={[0, 0.16, 0]} renderOrder={23}>
            <torusGeometry args={[0.16 + 0.08 * strength, 0.028, 10, 40]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.8}
                roughness={0.30}
                metalness={0.12}
                transparent
                opacity={0.94}
                depthWrite={false}
            />
        </mesh>
    );
}

// ── Single Marker with camera-distance scaling ─────────────────────────────────────

interface MarkerGroupProps {
    marker: ReturnType<typeof deriveWorldStateMarkers>[number];
    position: THREE.Vector3;
    yaw: number;
    isActive: boolean;
    isHover: boolean;
    onOver: (id: string) => void;
    onOut: () => void;
    onClick: (id: string) => void;
}

function MarkerGroup({
    marker,
    position,
    yaw,
    isActive,
    isHover,
    onOver,
    onOut,
    onClick,
}: MarkerGroupProps) {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    const color = TYPE_COLOR[marker.type];
    const strength = clamp01(marker.strength);

    // Camera-distance scaling (clamped)
    useFrame(() => {
        if (!groupRef.current) return;
        const dist = camera.position.distanceTo(position);
        const distScale = THREE.MathUtils.clamp(8 / dist, MIN_SCALE, MAX_SCALE);
        const interactScale = isActive ? 1.2 : isHover ? 1.1 : 1.0;
        const strengthScale = 1 + 0.25 * strength;
        const finalScale = BASE_SCALE * distScale * interactScale * strengthScale;
        groupRef.current.scale.setScalar(finalScale);
    });

    return (
        <group
            ref={groupRef}
            position={[position.x, position.y, position.z]}
            rotation={[0, yaw, 0]}
            renderOrder={20}
            onPointerOver={(e) => {
                e.stopPropagation();
                onOver(marker.id);
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                onOut();
            }}
            onClick={(e) => {
                e.stopPropagation();
                onClick(marker.id);
            }}
        >
            {/* Bezel dot anchor */}
            <BezelDot color={color} />

            <Halo color={color} strength={strength} active={isActive || isHover} />
            <MicroTick color={color} kind={marker.type} strength={strength} />

            {/* HTML label pinned below glyph */}
            <Html
                position={[0, -0.65, 0]}
                center
                distanceFactor={50}
                style={{ pointerEvents: "none", userSelect: "none" }}
            >
                <div
                    style={{
                        color: TYPE_HEX[marker.type],
                        fontSize: 13,
                        fontWeight: 800,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        textShadow:
                            "0 0 12px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.85), 0 4px 16px rgba(0,0,0,0.6)",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        opacity: isActive || isHover ? 1 : 0.9,
                        transform: `scale(${isActive ? 1.15 : 1})`,
                        transition: "opacity 0.18s, transform 0.18s",
                    }}
                >
                    {MARKER_LABEL[marker.id] ?? marker.id}
                </div>
            </Html>
        </group>
    );
}

// ── Main component ─────────────────────────────────────

export default function StrategicLeverageMarkers({
    riskValues: _riskValues,
    enabled = true,
}: {
    riskValues: Float32Array;
    enabled?: boolean;
}) {
    const { baseline } = useSystemBaseline();
    const baseKpis = useScenarioStore((s) => s.engineResults?.base?.kpis ?? null);

    const activeId = useMarkerLinkStore((s) => s.activeId);
    const hoverId = useMarkerLinkStore((s) => s.hoverId);
    const setActive = useMarkerLinkStore((s) => s.setActive);
    const setHover = useMarkerLinkStore((s) => s.setHover);

    const seed = useMemo(() => createSeed("baseline"), []);

    const { centerline, getHeightAt } = useMemo(() => {
        const nodes = generateP50Nodes();
        const { points, getHeightAt } = nodesToWorldXZ(nodes, seed);
        const { centerline } = buildRibbonGeometry(points, getHeightAt, {
            samples: 220,
            halfWidth: 0.65,
            widthSegments: 2,
            lift: 0.10,
            tension: 0.55,
        });
        return { centerline, getHeightAt };
    }, [seed]);

    const worldState = useMemo(() => {
        const arr = baseline?.financial.arr ?? 0;
        const grossMarginPct = baseline?.financial.grossMarginPct ?? 0;
        const monthlyBurn = baseline?.financial.monthlyBurn ?? 0;
        const cash = baseline?.financial.cashOnHand ?? 0;
        const runwayMonths = monthlyBurn > 0 ? cash / monthlyBurn : 999;
        return {
            markers: deriveWorldStateMarkers({
                runwayMonths,
                grossMarginPct,
                monthlyBurn,
                arr,
            }),
            baseKpis,
        };
    }, [baseline, baseKpis]);

    const placements = useMemo(() => {
        const samples = centerline.length;
        if (samples < 3) return [];

        const result = worldState.markers.map((m) => {
            const idx = pickMarkerIndex(m, samples);
            const p = centerline[idx];

            const prev = centerline[Math.max(0, idx - 1)];
            const next = centerline[Math.min(samples - 1, idx + 1)];
            const tan = next.clone().sub(prev);
            if (tan.lengthSq() < 1e-6) tan.set(0, 0, 1);
            tan.normalize();

            const yaw = yawFromTangent(tan);
            const y = getHeightAt(p.x, p.z) + EPSILON_Y;

            return {
                marker: m,
                position: new THREE.Vector3(p.x, y, p.z),
                yaw,
            };
        });

        // Debug log once
        if (DEBUG_MARKERS && result.length > 0) {
            console.log("[DEBUG_MARKERS] Marker count:", result.length);
            console.log(
                "[DEBUG_MARKERS] First 3 positions:",
                result.slice(0, 3).map((p) => `(${p.position.x.toFixed(1)}, ${p.position.y.toFixed(1)}, ${p.position.z.toFixed(1)})`),
            );
        }

        return result;
    }, [centerline, getHeightAt, worldState.markers]);

    const onOver = useCallback(
        (id: string) => {
            setHover(id);
        },
        [setHover],
    );
    const onOut = useCallback(() => {
        setHover(null);
    }, [setHover]);
    const onClick = useCallback(
        (id: string) => {
            setActive(activeId === id ? null : id);
        },
        [activeId, setActive],
    );

    if (!enabled || placements.length === 0) return null;

    return (
        <group frustumCulled={false} renderOrder={20}>
            {placements.map(({ marker, position, yaw }) => (
                <MarkerGroup
                    key={marker.id}
                    marker={marker}
                    position={position}
                    yaw={yaw}
                    isActive={activeId === marker.id}
                    isHover={hoverId === marker.id}
                    onOver={onOver}
                    onOut={onOut}
                    onClick={onClick}
                />
            ))}
        </group>
    );
}
