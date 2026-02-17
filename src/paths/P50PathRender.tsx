import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry, type HeightSampler } from "@/terrain/corridorTopology";
import { nodesToWorldXZ } from "@/paths/p50NodesTerrain";

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

    const built = useMemo(() => {
        if (points.length < 2) return null;
        return buildRibbonGeometry(points, getHeightAt, {
            samples: 520,
            halfWidth: 1.2,
            widthSegments: 10,
            lift: 0.08,
            tension: 0.5,
            normalEps: 0.6,
            smoothWindow: 5,
            maxSlopePerM: 0.55,
        });
    }, [getHeightAt, points]);

    useEffect(() => {
        return () => {
            built?.geometry?.dispose?.();
        };
    }, [built]);

    const curve = useMemo(() => {
        if (points.length < 2) return null;
        const pts = points.map((p) => new THREE.Vector3(p.x, 0, p.z));
        return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    }, [points]);

    if (!visible) return null;
    if (!built?.geometry) return null;
    if (!curve) return null;

    return (
        <group name={`path-${scenarioId}`} frustumCulled={false}>
            <mesh geometry={built.geometry} renderOrder={50} userData={{ pathMesh: true, id: "p50-ribbon-glow" }} frustumCulled={false}>
                <meshBasicMaterial
                    color={0x38bdf8}
                    transparent
                    opacity={0.22}
                    depthTest={false}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <mesh geometry={built.geometry} renderOrder={51} userData={{ pathMesh: true, id: "p50-ribbon-core" }} frustumCulled={false}>
                <meshBasicMaterial
                    color={0xe2e8f0}
                    transparent
                    opacity={0.85}
                    depthTest={false}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <Markers curve={curve} getHeightAt={getHeightAt} />
        </group>
    );
}

function Markers({
    curve,
    getHeightAt,
}: {
    curve: THREE.Curve<THREE.Vector3>;
    getHeightAt: HeightSampler;
}) {
    const tVals = [0.15, 0.38, 0.62, 0.86];
    const pts = tVals.map((t) => curve.getPoint(t));
    return (
        <>
            {pts.map((p, idx) => (
                <mesh
                    key={idx}
                    position={[p.x, getHeightAt(p.x, p.z) + 0.35, p.z]}
                    renderOrder={60}
                    userData={{ pathMesh: true, id: `p50-marker-${idx}` }}
                    frustumCulled={false}
                >
                    <sphereGeometry args={[0.55, 18, 18]} />
                    <meshBasicMaterial color={0x7dd3fc} transparent opacity={0.85} depthTest={false} depthWrite={false} />
                </mesh>
            ))}
        </>
    );
}
