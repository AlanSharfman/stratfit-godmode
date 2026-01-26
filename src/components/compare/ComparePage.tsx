// src/components/compare/ComparePage.tsx
// Physical Lighting — No HDR Studio, Controlled Exposure

import React, { useState } from "react";
import * as THREE from "three";
import { ViewToggle } from "./ViewToggle";
import { GodModeMountain } from "./GodModeMountain";
import { FinancialGridSafetyNet } from "./FinancialGridSafetyNet";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { OrbitControls } from "@react-three/drei";

type ViewMode = "terrain" | "grid";
const STORAGE_KEY = "stratfit_view_mode";

export default function ComparePage() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "terrain";
    return (window.localStorage.getItem(STORAGE_KEY) as ViewMode) || "terrain";
  });

  const [t, setT] = useState(0.5);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <div className="flex flex-col h-screen bg-[#080c10] overflow-hidden">
      
      {/* HEADER */}
      <div className="h-14 border-b border-slate-800/40 bg-[#080c10] flex items-center justify-between px-6 z-10 shrink-0">
        <div>
          <h1 className="text-white text-sm font-semibold tracking-tight">COMPARE</h1>
          <p className="text-[10px] text-slate-600 tracking-wide uppercase">
            Baseline (A) vs Exploration (B)
          </p>
        </div>
        <ViewToggle viewMode={viewMode} setViewMode={handleViewChange} />
      </div>

      {/* TIMELINE */}
      {viewMode === "terrain" && (
        <div className="h-12 border-b border-slate-800/40 bg-[#080c10] px-6 flex items-center gap-4 shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-slate-600 w-20">
            Timeline
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-500"
          />

          <div className="text-[10px] text-slate-500 font-mono w-24 text-right">
            T+{Math.round(t * 36)}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 relative" style={{ background: "#080c10" }}>
        {viewMode === "terrain" ? (
          <div className="w-full h-full">
            <Canvas
              camera={{ position: [0, 4.5, 12], fov: 40 }}
              gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
                toneMapping: THREE.ACESFilmicToneMapping,
              }}
              dpr={[1, 2]}
              onCreated={({ gl }) => {
                // Low exposure — prevents whiteout, keeps shadows dark
                gl.toneMappingExposure = 0.75;
                gl.outputColorSpace = THREE.SRGBColorSpace;
              }}
            >
              {/* NO Environment — pure directional lighting */}
              {/* This removes the HDR studio that was causing gloss */}
              
              <color attach="background" args={["#080c10"]} />

              <GodModeMountain scenarioA={{ score: 72 }} scenarioB={{ score: 65 }} t={t} />

              <OrbitControls
                enablePan={false}
                enableZoom={false}
                rotateSpeed={0.5}
                maxPolarAngle={Math.PI / 2.1}
                minPolarAngle={Math.PI / 3.5}
              />

              <EffectComposer disableNormalPass>
                {/* Bloom: only catches emissive veins */}
                <Bloom
                  luminanceThreshold={1.2}
                  luminanceSmoothing={0.2}
                  intensity={0.35}
                  radius={0.4}
                  mipmapBlur
                />
                {/* Strong vignette: focuses attention on center */}
                <Vignette eskil={false} offset={0.15} darkness={0.85} />
              </EffectComposer>
            </Canvas>
          </div>
        ) : (
          <div className="w-full h-full animate-in fade-in duration-300">
            <FinancialGridSafetyNet />
          </div>
        )}
      </div>
    </div>
  );
}
