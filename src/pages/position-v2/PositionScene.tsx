import React from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      <Canvas
        className={styles.canvas}
        dpr={[1, 2]}
        camera={{ position: [0, 18, 38], fov: 42 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#05070a"]} />
        <fog attach="fog" args={["#05070a", 40, 160]} />

        <ambientLight intensity={0.55} />
        <directionalLight position={[30, 40, 20]} intensity={1.2} />

        <Suspense fallback={null}>
          <TerrainStage />
        </Suspense>
      </Canvas>

      <div className={styles.horizonGlow} />
    </div>
  );
}
