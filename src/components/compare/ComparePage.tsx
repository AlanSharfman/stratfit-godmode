"use client";

import React, { useState, useEffect } from "react";
import { ViewToggle } from "@/components/compare/ViewToggle";
import { GodModeMountain } from "@/components/compare/GodModeMountain"; // Ensure this imports the correct file!
import { FinancialGridSafetyNet } from "@/components/compare/FinancialGridSafetyNet";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Environment } from "@react-three/drei";

type ViewMode = "terrain" | "grid";
const STORAGE_KEY = "stratfit_view_mode";

export default function ComparePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("terrain");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem(STORAGE_KEY) as ViewMode;
    if (saved) setViewMode(saved);
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  };

  if (!mounted) return <div className="h-screen bg-[#050b14]" />;

  return (
    <div className="flex flex-col h-screen bg-[#050b14] overflow-hidden">
      
      {/* HEADER */}
      <div className="h-14 border-b border-slate-800/60 bg-[#050b14] flex items-center justify-between px-6 z-10 shrink-0">
        <div>
          <h1 className="text-white text-sm font-semibold tracking-tight">COMPARE</h1>
          <p className="text-[10px] text-slate-500 tracking-wide uppercase">
            Baseline (A) vs Exploration (B)
          </p>
        </div>
        <ViewToggle viewMode={viewMode} setViewMode={handleViewChange} />
      </div>

      {/* MAIN CONTENT STAGE */}
      <div className="flex-1 relative bg-black">
        {viewMode === "terrain" ? (
          <div className="w-full h-full animate-in fade-in duration-500">
            <Canvas
              camera={{ position: [0, 4.2, 10.2], fov: 38 }}
              gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
              }}
              dpr={[1, 2]} 
              onCreated={({ gl }) => {
                gl.toneMappingExposure = 0.9; 
              }}
            >
              <Environment preset="studio" blur={1} /> 

              {/* CLEAN RENDER: No invalid 't' prop here */}
              <GodModeMountain scenarioA={{ score: 72 }} scenarioB={{ score: 65 }} />

              <EffectComposer disableNormalPass>
                <Bloom
                  luminanceThreshold={1.2} 
                  luminanceSmoothing={0.2}
                  intensity={0.4} 
                  mipmapBlur
                />
                <Vignette eskil={false} offset={0.1} darkness={0.8} />
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
