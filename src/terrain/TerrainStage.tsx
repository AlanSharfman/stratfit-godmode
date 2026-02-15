import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
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
                    position: [0, 110, 260],
                    fov: 50,
                    near: 1,
                    far: 2500,
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                style={{ background: "transparent" }}
            >
                <Scene>{children}</Scene>
            </Canvas>
        </div>
    );
}

function Scene({ children }: { children?: React.ReactNode }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [scene] = useState(() => new THREE.Scene());

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

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[100, 100, 50]} intensity={0.8} />
            <directionalLight position={[-100, 50, -50]} intensity={0.3} />

            {/* Terrain Mesh */}
            <mesh ref={meshRef} geometry={geometry}>
                <meshStandardMaterial
                    color={0x7dd3fc}
                    wireframe
                    transparent
                    opacity={0.35}
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* P50 Path */}
            <P50Path scene={scene} scenarioId="baseline" />

            {/* Camera Controls */}
            <OrbitControls
                enableDamping
                dampingFactor={0.05}
                minDistance={100}
                maxDistance={500}
                maxPolarAngle={Math.PI / 2.2}
                target={[0, 20, 0]}
            />

            {children}
        </>
    );
}
