// src/terrain/TerrainStage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Position Stage (REALITY VISUALIZATION)
// Navigation Contract: src/contracts/navigationContract.ts
//
// ROLE: Single Canvas host for terrain, P50 trajectory, markers, timeline,
//       and liquidity particles (when enabled).
// READS: Initiate snapshot ONLY (via SystemBaselineProvider). (Rule 1)
// RULES:
//   - No Objectives dependency — terrain shape is Initiate-derived only.
//   - No simulation logic (Rule 3).
//   - No baseline writes (Rule 4).
//   - Water/liquidity particles are a Position layer (Rule 6).
// ═══════════════════════════════════════════════════════════════════════════
// Phase 2/1: camera + far-plane + fog stabilization (deterministic)
// Phase 2.2: granularity prop wired from PositionPage toggle

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";
import P50Path from "@/paths/P50Path";

import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import BaselineTimelineTicks from "@/terrain/BaselineTimelineTicks";
import type { TimeGranularity } from "@/terrain/TimelineTicks";
import { baselineSeedString } from "@/terrain/seed";
import MarkerLayer from "@/components/terrain/markers/MarkerLayer";
import LiquidityFlowLayer from "@/components/terrain/liquidity/LiquidityFlowLayer";
import HorizonBand from "@/terrain/HorizonBand";
import { useRenderFlagsStore } from "@/state/renderFlagsStore";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";
import DemoTourDirector from "@/demo/DemoTourDirector";

function readCssVar(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

type TerrainStageProps = {
  granularity?: TimeGranularity
  terrainMetrics?: TerrainMetrics
  /** When true, no OrbitControls are mounted — camera is fully programmatic. */
  lockCamera?: boolean
  signals?: Array<{
    key: string
    label: string
    tone: "strong" | "watch" | "risk"
    detail: string
    metricLine: string
  }>
}

export default function TerrainStage({ granularity, terrainMetrics, lockCamera = false, signals }: TerrainStageProps) {
  const terrainRef = useRef<TerrainSurfaceHandle>(null!);
  const [terrainReady, setTerrainReady] = useState(false);
  const { baseline } = useSystemBaseline();
  const rebuildKey = baselineSeedString(baseline as any);

  const [fogColor, setFogColor] = useState("#050A10");
  useEffect(() => {
    // Use the global "charcoal" void token when available.
    setFogColor(readCssVar("--color-bg-void", readCssVar("--navy-950", "#050A10")));
  }, []);

  const [hoveredSignalKey, setHoveredSignalKey] = useState<string | null>(null)

  // ── Render flags ──
  const { showMarkers, showFlow, showPaths, watchDemo } = useRenderFlagsStore();
  useEffect(() => {
    if (terrainReady) return;
    let cancelled = false;
    let raf: number;
    function check() {
      if (cancelled) return;
      if (terrainRef.current) {
        setTerrainReady(true);
        return;
      }
      raf = requestAnimationFrame(check);
    }
    check();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [terrainReady]);

  return (
    <Canvas
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
      dpr={[1, 2]}
      camera={{ position: [0, 155, 460], fov: 46, near: 0.1, far: 5000 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera, gl }) => {
        // Wide cinematic composition — ridge in upper third, foreground visible
        camera.position.set(0, 155, 460);
        camera.lookAt(0, 18, 0);
        camera.updateProjectionMatrix();

        // Transparent clear — Position page supplies charcoal gradient behind Canvas.
        gl.setClearColor(fogColor, 0);
      }}
    >
      {/* Orbit controls — disabled on Position (lockCamera), active only in demo mode */}
      {!lockCamera && !watchDemo && (
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={false}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          minPolarAngle={1.107}
          maxPolarAngle={1.107}
          rotateSpeed={0.55}
          minDistance={220}
          maxDistance={700}
          target={[0, 14, 0]}
        />
      )}

      {/* Demo Tour Director (camera + overlay) mounts INSIDE Canvas */}
      {watchDemo && terrainReady && (
        <DemoTourDirector enabled terrainRef={terrainRef} />
      )}

      {/* Fog stays deterministic; background comes from DOM gradient behind the canvas. */}
      <fog attach="fog" args={[fogColor, 420, 2800]} />

      {/* Lights: lifted for brighter terrain readability */}
      <ambientLight intensity={1.55} />
      <directionalLight position={[120, 180, 120]} intensity={2.10} color="#DFFAFF" />
      <directionalLight position={[-80, 120, -60]} intensity={0.85} color="#6ef0ff" />

      <HorizonBand />

      <Suspense fallback={null}>
        <TerrainSurface ref={terrainRef} terrainMetrics={terrainMetrics} />
        {terrainReady && (
          <>
            {showPaths && (
              <P50Path terrainRef={terrainRef} rebuildKey={rebuildKey} />
            )}
            {/* Canonical ticks (BaselineTimelineTicks) — terrainRef for surface-aligned Y */}
            <BaselineTimelineTicks visible terrainRef={terrainRef} />
            <LiquidityFlowLayer terrainRef={terrainRef} enabled={showFlow} />
            <MarkerLayer terrainRef={terrainRef} enabled={showMarkers} />

            {/* Position: On-terrain diagnostic labels (hover to reveal detail) */}
            {signals && signals.length > 0 && (
              <group name="position-terrain-signals" frustumCulled={false} renderOrder={90}>
                {signals.map((s, idx) => {
                  const offsets: Array<[number, number]> = [
                    [-85, -55],
                    [-18, -35],
                    [52, -25],
                    [92, -48],
                  ]
                  const [x, z] = offsets[idx] ?? [0, -35]
                  const y = terrainRef.current?.getHeightAt(x, z) ?? 0

                  const dotColor =
                    s.tone === "strong"
                      ? "rgba(40,255,190,1)"
                      : s.tone === "watch"
                        ? "rgba(250,204,21,1)"
                        : "rgba(255,78,128,1)"

                  const isHover = hoveredSignalKey === s.key
                  return (
                    <group key={s.key} position={[x, y + 2.4, z]}>
                      <mesh renderOrder={91}>
                        <sphereGeometry args={[0.35, 16, 16]} />
                        <meshStandardMaterial
                          color="#22d3ee"
                          emissive="#22d3ee"
                          emissiveIntensity={0.25}
                          transparent
                          opacity={0.75}
                          depthWrite={false}
                        />
                      </mesh>

                      <Html distanceFactor={85} center style={{ pointerEvents: "auto" }}>
                        <div
                          onMouseEnter={() => setHoveredSignalKey(s.key)}
                          onMouseLeave={() => setHoveredSignalKey((k) => (k === s.key ? null : k))}
                          style={{
                            fontFamily: "ui-monospace, JetBrains Mono, monospace",
                            color: "rgba(226,232,240,0.96)",
                            background: "rgba(10,14,20,0.72)",
                            border: "1px solid rgba(34,211,238,0.24)",
                            borderRadius: 10,
                            padding: "8px 10px",
                            boxShadow: "0 10px 26px rgba(0,0,0,0.48)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            whiteSpace: "nowrap",
                            cursor: "default",
                            minWidth: 180,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 999,
                                background: dotColor,
                                boxShadow: `0 0 14px ${dotColor.replace(",1)", ",0.22)")}`,
                                flex: "0 0 auto",
                              }}
                            />
                            <span style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase" }}>
                              {s.label}
                            </span>
                          </div>

                          <div style={{ marginTop: 4, fontSize: 11, color: "rgba(148,163,184,0.82)" }}>
                            {s.metricLine}
                          </div>

                          {isHover && (
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 12,
                                color: "rgba(241,245,249,0.92)",
                                maxWidth: 360,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                borderTop: "1px solid rgba(255,255,255,0.06)",
                                paddingTop: 6,
                                animation: "sfType 900ms steps(36,end) 1",
                              }}
                            >
                              {s.detail}
                            </div>
                          )}

                          <style>{`
                            @keyframes sfType {
                              from { max-width: 0; opacity: 0.35; }
                              to { max-width: 360px; opacity: 1; }
                            }
                          `}</style>
                        </div>
                      </Html>
                    </group>
                  )
                })}
              </group>
            )}
          </>
        )}
      </Suspense>
    </Canvas>
  );
}
