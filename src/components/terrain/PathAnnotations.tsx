import React from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type PathAnnotation = {
    id: string;
    position: THREE.Vector3;
    label: string;
};

export default function PathAnnotations({
    annotations,
    visible = true,
}: {
    annotations: PathAnnotation[];
    visible?: boolean;
}) {
    if (!visible || annotations.length === 0) return null;

    return (
        <group name="path-annotations" frustumCulled={false} renderOrder={40}>
            {annotations.map((a) => (
                <group key={a.id} position={a.position.toArray()}>
                    <mesh renderOrder={41}>
                        <sphereGeometry args={[0.22, 14, 14]} />
                        <meshStandardMaterial
                            color="#22d3ee"
                            emissive="#22d3ee"
                            emissiveIntensity={0.35}
                            transparent
                            opacity={0.9}
                            depthWrite={false}
                        />
                    </mesh>

                    <Html distanceFactor={85} center style={{ pointerEvents: "none" }}>
                        <div
                            style={{
                                fontSize: 11,
                                color: "#e2e8f0",
                                background: "rgba(15,23,42,0.82)",
                                padding: "6px 8px",
                                borderRadius: 8,
                                border: "1px solid rgba(34,211,238,0.25)",
                                boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
                                whiteSpace: "nowrap",
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            {a.label}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
}
