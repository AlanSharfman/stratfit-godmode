// src/pages/GodModeTest.tsx
// Test page for the Gemini-corrected God Mode Mountain
// Visit /godmode to see the holographic glass terrain with lava rivers

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { GodModeMountain } from "@/components/compare/GodModeMountain";

export default function GodModeTest() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#050a12",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 4.2, 11.5], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Environment preset="studio" blur={0.9} />
        <GodModeMountain
          scenarioA={{ score: 72, arr: 0, survival: 0, runway: 0 }}
          scenarioB={{ score: 65, arr: 0, survival: 0, runway: 0 }}
          t={0.5}
        />
      </Canvas>
    </div>
  );
}
