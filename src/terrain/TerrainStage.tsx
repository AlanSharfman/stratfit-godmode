import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { buildTerrain } from "./buildTerrain";
import { createSeed } from "./seed";
import P50Path from "../paths/P50Path";

export default function TerrainStage({ children }: { children?: React.ReactNode }) {
    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <Canvas
                camera={{
                    position: [40, 135, 320],
                    fov: 42,
                    near: 1,
                    far: 3000,
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                style={{ background: "transparent" }}
                onCreated={({ camera }) => {
                    camera.lookAt(-35, 18, 0);
                    camera.updateProjectionMatrix();
                }}
            >
                <Scene>{children}</Scene>
            </Canvas>
        </div>
    );
}

function Scene({ children }: { children?: React.ReactNode }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const { scene } = useThree();

    const geometry = useMemo(() => {
        const seed = createSeed("baseline");
        return buildTerrain(120, seed);
    }, []);

    useEffect(() => {
        if (!meshRef.current) return;
        meshRef.current.rotation.x = -Math.PI / 2;
        meshRef.current.position.set(0, -6, 0);
        meshRef.current.frustumCulled = false;
    }, []);

    // DEV ASSERTION: count path meshes after mount
    useEffect(() => {
        setTimeout(() => {
            let count = 0;
            scene.traverse((obj) => {
                if (obj instanceof THREE.Mesh && obj.userData.pathMesh) {
                    count++;
                    console.log("[ASSERT] Path mesh:", obj.name);
                }
            });
            console.log("[ASSERT] TOTAL PATH MESHES:", count);
        }, 1000);
    }, [scene]);

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[100, 100, 50]} intensity={0.8} />
            <directionalLight position={[-100, 50, -50]} intensity={0.3} />

            {/* Terrain Mesh */}
            <mesh ref={meshRef} geometry={geometry} renderOrder={0} name="terrain-surface">
                <meshStandardMaterial
                    ref={materialRef}
                    color={0x7dd3fc}
                    emissive={0x38bdf8}
                    emissiveIntensity={0.3}
                    wireframe
                    transparent
                    opacity={0.65}
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* Probability Corridor Path — P50 only (P10/P90 disabled for baseline stabilization) */}
            <P50Path scenarioId="baseline" />

            {/* Camera Controls */}
            <OrbitControls
                enableDamping
                dampingFactor={0.05}
                minDistance={100}
                maxDistance={600}
                maxPolarAngle={Math.PI / 2.2}
                target={[0, 18, 0]}
            />

            {children}
        </>
    );
}
