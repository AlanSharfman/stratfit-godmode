import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { generateP50Nodes } from "@/paths/generatePath";
import { nodesToWorldXZ } from "@/paths/P50Path";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry } from "@/terrain/corridorTopology";
import { devlog, devwarn } from "@/lib/devlog";

const TICKS = [
    { t: 0.00, label: "Now" },
    { t: 0.25, label: "6m" },
    { t: 0.50, label: "12m" },
    { t: 0.75, label: "18m" },
    { t: 1.00, label: "24m" },
];

const TICK_COLOR = new THREE.Color(0x67e8f9);
const TICK_EMISSIVE = new THREE.Color(0x0891b2);
const LABEL_COLOR = "#67e8f9";

function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
}

export default function BaselineTimelineTicks({ visible = true }: { visible?: boolean }) {
    const seed = useMemo(() => createSeed("baseline"), []);
    const nodes = useMemo(() => generateP50Nodes(), []);
    const pathData = useMemo(() => nodesToWorldXZ(nodes, seed), [nodes, seed]);
    
    const centerline = useMemo(() => {
        const { points, getHeightAt } = pathData;
        const { centerline: cl } = buildRibbonGeometry(points, getHeightAt, {
            samples: 220,
            halfWidth: 0.55,
            widthSegments: 2,
            lift: 0,
            tension: 0.55,
        });
        return cl;
    }, [pathData]);

    const tickPositions = useMemo(() => {
        if (centerline.length < 3) {
            devwarn("BaselineTimelineTicks: centerline invalid");
            return [];
        }

        const count = centerline.length;

        return TICKS.map(({ t, label }) => {
            const idx = clamp(Math.round(t * (count - 1)), 0, count - 1);
            const p = centerline[idx];

            const prev = centerline[Math.max(0, idx - 1)];
            const next = centerline[Math.min(count - 1, idx + 1)];
            const tan = next.clone().sub(prev).normalize();

            const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tan).normalize();
            const offset = side.multiplyScalar(4.5);

            return {
                label,
                position: new THREE.Vector3(p.x + offset.x, p.y + 0.2, p.z + offset.z),
            };
        });
    }, [centerline]);

    useEffect(() => {
        if (!visible || tickPositions.length === 0) return;
        devlog("[BaselineTimelineTicks] ticks:", tickPositions.length);
    }, [visible, tickPositions]);

    if (!visible || tickPositions.length === 0) return null;

    return (
        <group name="baseline-timeline-ticks" frustumCulled={false} renderOrder={15}>
            {tickPositions.map(({ label, position }) => (
                <group key={label} position={[position.x, position.y, position.z]}>
                    <mesh renderOrder={16}>
                        <boxGeometry args={[0.08, 1.0, 0.08]} />
                        <meshStandardMaterial
                            color={TICK_COLOR}
                            emissive={TICK_EMISSIVE}
                            emissiveIntensity={0.3}
                            transparent
                            opacity={0.8}
                            depthWrite={false}
                        />
                    </mesh>

                    <mesh position={[0, -0.5, 0]} renderOrder={16}>
                        <boxGeometry args={[0.8, 0.05, 0.05]} />
                        <meshStandardMaterial
                            color={TICK_COLOR}
                            emissive={TICK_EMISSIVE}
                            emissiveIntensity={0.2}
                            transparent
                            opacity={0.6}
                            depthWrite={false}
                        />
                    </mesh>

                    <Html
                        position={[0, -1.4, 0]}
                        center
                        transform
                        sprite
                        occlude={false}
                        distanceFactor={10}
                        zIndexRange={[200, 0]}
                    >
                        <div style={{
                            padding: "4px 8px",
                            borderRadius: 10,
                            fontSize: 12,
                            letterSpacing: 0.4,
                            color: "rgba(234,251,255,0.92)",
                            background: "rgba(6, 18, 24, 0.55)",
                            border: "1px solid rgba(34, 211, 238, 0.22)",
                            boxShadow: "0 0 16px rgba(34, 211, 238, 0.12)",
                            backdropFilter: "blur(10px)",
                            whiteSpace: "nowrap",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 600,
                        }}>
                            {label}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
}
