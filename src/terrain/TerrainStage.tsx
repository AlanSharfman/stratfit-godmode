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
                    position: [0, 80, 380],
                    fov: 50,
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
                    camera.lookAt(0, 40, 0);
                    camera.updateProjectionMatrix();
                }}
            >
                <Scene>{children}</Scene>
            </Canvas>
        </div>
    );
}

function Scene({ children }: { children?: React.ReactNode }) {
    const solidRef = useRef<THREE.Mesh>(null);
    const wireRef = useRef<THREE.Mesh>(null);
    const solidMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const { scene } = useThree();

    const geometry = useMemo(() => {
        const seed = createSeed("baseline");
        return buildTerrain(120, seed);
    }, []);

    // Apply identical transforms to both meshes
    useEffect(() => {
        for (const ref of [solidRef, wireRef]) {
            if (!ref.current) continue;
            ref.current.rotation.x = -Math.PI / 2;
            ref.current.position.set(0, -6, 0);
            ref.current.frustumCulled = false;
        }
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
            {/* Lighting - low-angle grazing for relief perception */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 15, 5]} intensity={1.4} />
            <directionalLight position={[-100, 50, -50]} intensity={0.3} />

            {/* Pass 1: Solid surface — receives RPF/CF shader injection */}
            <mesh ref={solidRef} geometry={geometry} renderOrder={0} name="terrain-surface">
                <meshStandardMaterial
                    ref={solidMatRef}
                    color={0x1a2a3a}
                    emissive={0x0d1b2a}
                    emissiveIntensity={0.15}
                    wireframe={false}
                    transparent
                    opacity={0.55}
                    roughness={0.9}
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
                    emissiveIntensity={0.3}
                    wireframe
                    transparent
                    opacity={0.45}
                    roughness={0.8}
                    metalness={0.1}
                    depthWrite={false}
                    depthTest
                />
            </mesh>

            {/* Probability Corridor Path — P50 only (P10/P90 disabled for baseline stabilization) */}
            <P50Path scenarioId="baseline" />

            {/* Camera Controls */}
            <OrbitControls
                enableDamping
                dampingFactor={0.05}
                minDistance={80}
                maxDistance={800}
                maxPolarAngle={Math.PI / 2.2}
                target={[0, 40, 0]}
            />

            {children}
        </>
    );
}
