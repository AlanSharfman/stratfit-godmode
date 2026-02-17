import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { buildTerrain } from "./buildTerrain";
import { createSeed } from "./seed";
import P50Path from "../paths/P50PathRender";

export default function TerrainStage({
    children,
    demoMode = false,
}: {
    children?: React.ReactNode;
    demoMode?: boolean;
}) {
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            if ((window as any).__STRATFIT_CANVAS_MOUNTED__) {
                console.warn(
                    "[STRATFIT] Canvas remounted (dev/HMR). This may trigger WebGL context churn.",
                );
            }
            (window as any).__STRATFIT_CANVAS_MOUNTED__ = true;
            return () => {
                (window as any).__STRATFIT_CANVAS_MOUNTED__ = false;
            };
        }
        return;
    }, []);

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <Canvas
                dpr={[1, 1.75]}
                camera={{
                    // New cinematic angle: looking INTO the mountain field
                    position: [-180, 120, 210],
                    fov: 46,
                    near: 1,
                    far: 4000,
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                style={{ background: "transparent" }}
                onCreated={({ camera }) => {
                    camera.lookAt(0, 52, 0);
                    camera.updateProjectionMatrix();
                }}
            >
                <Scene demoMode={demoMode}>{children}</Scene>
            </Canvas>
        </div>
    );
}

function Scene({
    children,
    demoMode = false,
}: {
    children?: React.ReactNode;
    demoMode?: boolean;
}) {
    const solidRef = useRef<THREE.Mesh>(null);
    const wireRef = useRef<THREE.Mesh>(null);
    const { scene } = useThree();

    const geometry = useMemo(() => {
        const seed = createSeed("baseline");
        return buildTerrain(260, seed); // bigger world so it feels like a landscape
    }, []);

    // Apply identical transforms to both meshes
    useEffect(() => {
        for (const ref of [solidRef, wireRef]) {
            if (!ref.current) continue;
            ref.current.rotation.x = -Math.PI / 2;
            ref.current.position.set(0, -10, 0);
            ref.current.scale.set(1, 3.0, 1);
            ref.current.frustumCulled = false;
        }
    }, []);

    // DEV ASSERTION: count path meshes after mount (gated to avoid production spam)
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const timer = setTimeout(() => {
            let count = 0;
            scene.traverse((obj) => {
                if (obj instanceof THREE.Mesh && obj.userData.pathMesh) count++;
            });
            console.log("[ASSERT] TOTAL PATH MESHES:", count);
        }, 900);
        return () => clearTimeout(timer);
    }, [scene]);

    return (
        <>
            <ambientLight intensity={0.7} />
            <directionalLight position={[40, 80, 60]} intensity={1.35} />
            <directionalLight position={[-160, 100, -120]} intensity={0.35} />

            {/* Pass 1: Solid surface — receives RPF/CF shader injection */}
            <mesh ref={solidRef} geometry={geometry} renderOrder={0} name="terrain-surface">
                <meshStandardMaterial
                    color={0x0f1d2b}
                    emissive={0x081423}
                    emissiveIntensity={0.16}
                    transparent
                    opacity={0.62}
                    roughness={0.92}
                    metalness={0.05}
                    depthWrite
                    depthTest
                    polygonOffset
                    polygonOffsetFactor={1}
                    polygonOffsetUnits={1}
                />
            </mesh>

            {/* Pass 2: Wireframe overlay — visual grid aesthetic */}
            <mesh ref={wireRef} geometry={geometry} renderOrder={1}>
                <meshStandardMaterial
                    color={0x7dd3fc}
                    emissive={0x38bdf8}
                    emissiveIntensity={0.34}
                    wireframe
                    transparent
                    opacity={0.4}
                    roughness={0.85}
                    metalness={0.12}
                    depthWrite={false}
                    depthTest
                />
            </mesh>

            {/* Probability Corridor Path — P50 only (P10/P90 disabled for baseline stabilization) */}
            <P50Path scenarioId="baseline" />

            {/* Camera Controls — disabled when demo is active */}
            <OrbitControls
                enabled={!demoMode}
                enableDamping
                dampingFactor={0.05}
                minDistance={120}
                maxDistance={1200}
                maxPolarAngle={Math.PI / 2.18}
                target={[0, 52, 0]}
            />

            {children}
        </>
    );
}
