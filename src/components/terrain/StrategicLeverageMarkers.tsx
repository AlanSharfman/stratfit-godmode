import React, { useCallback, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { generateP50Nodes } from "@/paths/generatePath";
import { nodesToWorldXZ } from "@/paths/P50Path";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry } from "@/terrain/corridorTopology";
import { useMarkerLinkStore } from "@/state/markerLinkStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { useScenarioStore } from "@/state/scenarioStore";
import { clamp01, deriveWorldStateMarkers, pickMarkerIndex, TYPE_HEX } from "./markerStrength";
import type { TrajectoryMarkerType } from "@/types/trajectory";

/**
 * StrategicLeverageMarkers -- semantic production markers.
 *
 * Replaces placeholder amber/orange dots with STRATFIT semantic anchors:
 * - glyph + halo + micro tick per type
 * - color by marker type (no orange anywhere)
 * - hover/click drives existing right-panel linkage (markerLinkStore)
 * - deterministic placement via marker.t on corridor centerline
 * - terrain-anchored: y = terrain height + epsilon (0.02)
 * - depthWrite false + renderOrder to avoid z-fighting
 *
 * Markers derived from canonical baseline truth (worldState.markers).
 */

const EPSILON_Y = 0.02;

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

// -- Glyph sub-components --

function Halo({ color, strength, active }: { color: THREE.Color; strength: number; active: boolean }) {
    const outer = 0.48 + 0.18 * strength;
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={21}>
            <ringGeometry args={[0.18, outer, 48]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={active ? 0.62 : 0.40}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                depthTest
            />
        </mesh>
    );
}

function MicroTick({ color, kind, strength }: { color: THREE.Color; kind: TrajectoryMarkerType; strength: number }) {
    const base = 0.10 + 0.06 * strength;

    if (kind === "risk_inflection") {
        return (
            <group renderOrder={23}>
                <mesh position={[0, 0.08, base]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.12, 3]} />
                    <meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} depthTest />
                </mesh>
                <mesh position={[0, 0.06, base * 1.4]}>
                    <boxGeometry args={[0.03, 0.08, 0.16]} />
                    <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} depthTest />
                </mesh>
            </group>
        );
    }

    if (kind === "runway_threshold") {
        return (
            <mesh position={[0, 0.10, base]} renderOrder={23}>
                <boxGeometry args={[0.04, 0.24, 0.04]} />
                <meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} depthTest />
            </mesh>
        );
    }

    if (kind === "leverage_opportunity") {
        return (
            <mesh position={[0, 0.14, 0]} renderOrder={23}>
                <octahedronGeometry args={[0.13 + 0.05 * strength, 0]} />
                <meshStandardMaterial
                    color={color} emissive={color} emissiveIntensity={1.2}
                    roughness={0.35} metalness={0.15} transparent opacity={0.92} depthWrite={false}
                />
            </mesh>
        );
    }

    // confidence_shift -- ring glyph
    return (
        <mesh position={[0, 0.12, 0]} renderOrder={23}>
            <torusGeometry args={[0.12 + 0.06 * strength, 0.022, 10, 32]} />
            <meshStandardMaterial
                color={color} emissive={color} emissiveIntensity={1.4}
                roughness={0.35} metalness={0.1} transparent opacity={0.9} depthWrite={false}
            />
        </mesh>
    );
}

// -- Main component --

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
            halfWidth: 0.55,
            widthSegments: 2,
            lift: 0,
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
        return { markers: deriveWorldStateMarkers({ runwayMonths, grossMarginPct, monthlyBurn, arr }), baseKpis };
    }, [baseline, baseKpis]);

    const placements = useMemo(() => {
        const samples = centerline.length;
        if (samples < 3) return [];

        return worldState.markers.map((m) => {
            const idx = pickMarkerIndex(m, samples);
            const p = centerline[idx];
            const prev = centerline[Math.max(0, idx - 1)];
            const next = centerline[Math.min(samples - 1, idx + 1)];
            const tan = next.clone().sub(prev);
            if (tan.lengthSq() < 1e-6) tan.set(0, 0, 1);
            tan.normalize();
            const yaw = yawFromTangent(tan);
            return { marker: m, position: new THREE.Vector3(p.x, getHeightAt(p.x, p.z) + EPSILON_Y, p.z), yaw };
        });
    }, [centerline, getHeightAt, worldState.markers]);

    const onOver = useCallback((id: string) => { setHover(id); }, [setHover]);
    const onOut = useCallback(() => { setHover(null); }, [setHover]);
    const onClick = useCallback((id: string) => { setActive(activeId === id ? null : id); }, [activeId, setActive]);

    if (!enabled || placements.length === 0) return null;

    return (
        <group frustumCulled={false} renderOrder={20}>
            {placements.map(({ marker, position, yaw }) => {
                const color = TYPE_COLOR[marker.type];
                const strength = clamp01(marker.strength);
                const isActive = activeId === marker.id;
                const isHover = hoverId === marker.id;
                const scale = 1 + (isActive ? 0.14 : isHover ? 0.08 : 0) + 0.12 * strength;

                return (
                    <group
                        key={marker.id}
                        position={[position.x, position.y, position.z]}
                        rotation={[0, yaw, 0]}
                        scale={[scale, scale, scale]}
                        renderOrder={20}
                        onPointerOver={(e) => { e.stopPropagation(); onOver(marker.id); }}
                        onPointerOut={(e) => { e.stopPropagation(); onOut(); }}
                        onClick={(e) => { e.stopPropagation(); onClick(marker.id); }}
                    >
                        <Halo color={color} strength={strength} active={isActive || isHover} />
                        <MicroTick color={color} kind={marker.type} strength={strength} />
                        {/* HTML label pinned below glyph */}
                        <Html
                            position={[0, -0.5, 0]}
                            center
                            distanceFactor={80}
                            style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                            <div style={{
                                color: TYPE_HEX[marker.type],
                                fontSize: 11,
                                fontWeight: 600,
                                fontFamily: "'Inter', system-ui, sans-serif",
                                textShadow: "0 0 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)",
                                whiteSpace: "nowrap",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                opacity: isActive || isHover ? 1 : 0.85,
                                transform: `scale(${isActive ? 1.1 : 1})`,
                                transition: "opacity 0.2s, transform 0.2s",
                            }}>
                                {MARKER_LABEL[marker.id] ?? marker.id}
                            </div>
                        </Html>
                    </group>
                );
            })}
        </group>
    );
}