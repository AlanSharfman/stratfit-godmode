import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { generateP50Nodes } from "@/paths/generatePath";
import { nodesToWorldXZ } from "@/paths/P50Path";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry } from "@/terrain/corridorTopology";

/**
 * BaselineTimelineTicks — implicit time markers along the P50 corridor.
 *
 * Shows "Now", "3m", "6m", "9m", "12m", "18m", "24m" ticks anchored to
 * the corridor centerline, converting the static stripe into a visible
 * forward journey.
 *
 * Baseline-only (interpretation, not control). No slider, no interaction.
 * Stable under hot reload, deterministic placement, no stacking.
 *
 * Each tick renders:
 *   - a subtle vertical line segment (cyan/ice colors)
 *   - a horizontal base dash
 *   - an HTML label below the path
 *   - dev assertion logging for tick count verification
 */

// ── Tick definitions: corridor-parameter t → label ──
// t ∈ [0, 1] along the P50 centerline corresponds to a 24-month horizon.
const TICKS: { t: number; label: string }[] = [
    { t: 0.00, label: "Now" },
    { t: 0.125, label: "3m" },
    { t: 0.25, label: "6m" },
    { t: 0.375, label: "9m" },
    { t: 0.50, label: "12m" },
    { t: 0.75, label: "18m" },
    { t: 1.00, label: "24m" },
];

// Cyan/Ice theme as per requirements (no orange)
const TICK_COLOR = new THREE.Color(0x67e8f9); // cyan-300
const TICK_EMISSIVE = new THREE.Color(0x0891b2); // cyan-600
const LABEL_COLOR = "#67e8f9"; // cyan-300

function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
}

type TickPosition = {
    label: string;
    position: THREE.Vector3;
    terrainY: number;
};

export default function BaselineTimelineTicks({
    visible = true,
}: {
    visible?: boolean;
}) {
    const seed = useMemo(() => createSeed("baseline"), []);

    // React Compiler friendly memoization - split into smaller pieces
    const centerlineData = useMemo(() => {
        try {
            const nodes = generateP50Nodes();
            const { points, getHeightAt } = nodesToWorldXZ(nodes, seed);
            const { centerline } = buildRibbonGeometry(points, getHeightAt, {
                samples: 220,
                halfWidth: 0.55,
                widthSegments: 2,
                lift: 0,
                tension: 0.55,
            });

            return { centerline, valid: centerline.length >= 3 };
        } catch (error) {
            console.error("BaselineTimelineTicks: failed to compute centerline", error);
            return { centerline: [], valid: false };
        }
    }, [seed]);

    const tickPositions = useMemo(() => {
        if (!centerlineData.valid) {
            console.warn("BaselineTimelineTicks: centerline invalid", centerlineData.centerline.length);
            return [];
        }

        const { centerline } = centerlineData;
        const count = centerline.length;

        return TICKS.map(({ t, label }) => {
            const idx = clamp(Math.round(t * (count - 1)), 0, count - 1);
            const p = centerline[idx];

            // Tangent for perpendicular offset
            const prev = centerline[Math.max(0, idx - 1)];
            const next = centerline[Math.min(count - 1, idx + 1)];
            const tan = next.clone().sub(prev);
            if (tan.lengthSq() < 1e-6) tan.set(0, 0, 1);
            tan.normalize();

            // Side vector (perpendicular to tangent on XZ plane)
            const up = new THREE.Vector3(0, 1, 0);
            const side = new THREE.Vector3().crossVectors(up, tan).normalize();

            // Offset the tick slightly to the side of the path (right side)
            const offset = side.clone().multiplyScalar(4.5);

            return {
                label,
                // Tick line bottom with small Y offset to prevent z-fighting
                position: new THREE.Vector3(
                    p.x + offset.x,
                    p.y + 0.2, // Small lift above corridor
                    p.z + offset.z,
                ),
                terrainY: p.y,
            };
        });
    }, [centerlineData]);

    // Dev assertion: verify exactly 7 ticks, no duplicates
    useEffect(() => {
        if (!visible || tickPositions.length === 0) return;

        const tickNames = tickPositions.map(({ label }) => `baseline-tick:${label}`);
        const uniqueNames = new Set(tickNames);

        console.log(`[BaselineTimelineTicks] Rendered ${tickPositions.length} ticks:`, tickNames);

        if (tickPositions.length !== 7) {
            console.error(`[BaselineTimelineTicks] Expected 7 ticks, got ${tickPositions.length}`);
        }

        if (uniqueNames.size !== tickPositions.length) {
            console.error(`[BaselineTimelineTicks] Duplicate ticks detected! Unique: ${uniqueNames.size}, Total: ${tickPositions.length}`);
        }

        if (tickPositions.length === 7 && uniqueNames.size === 7) {
            console.log(`[BaselineTimelineTicks] ✓ All 7 ticks validated, no duplicates`);
        }
    }, [visible, tickPositions]);

    if (!visible || tickPositions.length === 0) return null;

    return (
        <group
            name="baseline-timeline-ticks"
            frustumCulled={false}
            renderOrder={15}
        >
            {tickPositions.map(({ label, position }) => (
                <group
                    key={`baseline-tick:${label}`}
                    name={`baseline-tick:${label}`}
                    position={[position.x, position.y, position.z]}
                >
                    {/* Vertical tick line */}
                    <mesh
                        name={`baseline-tick:${label}:vertical`}
                        renderOrder={16}
                    >
                        <boxGeometry args={[0.08, 1.0, 0.08]} />
                        <meshStandardMaterial
                            color={TICK_COLOR}
                            emissive={TICK_EMISSIVE}
                            emissiveIntensity={0.3}
                            transparent
                            opacity={0.8}
                            depthWrite={false}
                            depthTest
                        />
                    </mesh>

                    {/* Small horizontal dash at base */}
                    <mesh
                        name={`baseline-tick:${label}:dash`}
                        position={[0, -0.5, 0]}
                        renderOrder={16}
                    >
                        <boxGeometry args={[0.8, 0.05, 0.05]} />
                        <meshStandardMaterial
                            color={TICK_COLOR}
                            emissive={TICK_EMISSIVE}
                            emissiveIntensity={0.2}
                            transparent
                            opacity={0.6}
                            depthWrite={false}
                            depthTest
                        />
                    </mesh>

                    {/* HTML Label */}
                    <Html
                        position={[0, -1.4, 0]}
                        center
                        distanceFactor={80}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                        <div style={{
                            color: LABEL_COLOR,
                            fontSize: 10,
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                            textShadow: "0 0 6px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.7)",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            opacity: 0.9,
                        }}>
                            {label}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
}