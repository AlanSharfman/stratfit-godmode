// src/terrain/TerrainNavWidget.tsx
// ═══════════════════════════════════════════════════════════════════════════
// Responsive directional-pad widget for terrain orbit control.
// Sits in the bottom-right of the terrain viewport.
// Reads OrbitControls from useTerrainControls store.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useTerrainControls } from "./useTerrainControls";

// ── Live camera position readout ──
function useCameraPosition(controls: any) {
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const rafRef = useRef(0);

  useEffect(() => {
    if (!controls?.object) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      const cam = controls.object as THREE.PerspectiveCamera;
      setPos((prev) => {
        const nx = Math.round(cam.position.x);
        const ny = Math.round(cam.position.y);
        const nz = Math.round(cam.position.z);
        if (prev.x === nx && prev.y === ny && prev.z === nz) return prev;
        return { x: nx, y: ny, z: nz };
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(rafRef.current); };
  }, [controls]);

  return pos;
}

// ── Tuning ──
const STEP_RAD = 0.04;          // radians per tick (~2.3°)
const TICK_INTERVAL_MS = 50;    // continuous press repeat rate
const ZOOM_STEP = 20;           // distance units per tick

// ── Arrow SVG builder ──
function Arrow({ rotation }: { rotation: number }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotation}deg)`, display: "block" }}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

// ── Hook: continuous press ──
function useContinuousPress(callback: () => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const start = useCallback(() => {
    callbackRef.current();
    intervalRef.current = setInterval(() => callbackRef.current(), TICK_INTERVAL_MS);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { start, stop };
}

// ── Orbit helper ──
function orbitCamera(
  controls: any,
  deltaTheta: number,
  deltaPhi: number,
) {
  if (!controls?.object || !controls?.target) return;

  const camera = controls.object as THREE.PerspectiveCamera;
  const target = controls.target as THREE.Vector3;

  const offset = camera.position.clone().sub(target);
  const spherical = new THREE.Spherical().setFromVector3(offset);

  spherical.theta += deltaTheta;
  spherical.phi += deltaPhi;

  // Respect OrbitControls min/max polar
  const minPolar = controls.minPolarAngle ?? 0;
  const maxPolar = controls.maxPolarAngle ?? Math.PI;
  spherical.phi = Math.max(minPolar, Math.min(maxPolar, spherical.phi));

  // Respect distance limits
  const minDist = controls.minDistance ?? 0;
  const maxDist = controls.maxDistance ?? Infinity;
  spherical.radius = Math.max(minDist, Math.min(maxDist, spherical.radius));

  offset.setFromSpherical(spherical);
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
  controls.update();
}

function zoomCamera(controls: any, delta: number) {
  if (!controls?.object || !controls?.target) return;

  const camera = controls.object as THREE.PerspectiveCamera;
  const target = controls.target as THREE.Vector3;

  const offset = camera.position.clone().sub(target);
  const spherical = new THREE.Spherical().setFromVector3(offset);

  const minDist = controls.minDistance ?? 0;
  const maxDist = controls.maxDistance ?? Infinity;
  spherical.radius = Math.max(minDist, Math.min(maxDist, spherical.radius + delta));

  offset.setFromSpherical(spherical);
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
  controls.update();
}

// ── Shared button styles ──
const btnBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 35,
  height: 35,
  borderRadius: 7,
  border: "1px solid rgba(255, 255, 255, 0.08)",
  background: "rgba(12, 24, 36, 0.70)",
  color: "rgba(255, 255, 255, 0.90)",
  cursor: "pointer",
  outline: "none",
  padding: 0,
  transition: "background 0.12s, color 0.12s, border-color 0.12s",
  userSelect: "none",
  WebkitUserSelect: "none",
  touchAction: "none",
};

const btnHover: Partial<React.CSSProperties> = {
  background: "rgba(12, 24, 36, 0.90)",
  color: "#5CE1FF",
  borderColor: "rgba(92, 225, 255, 0.35)",
};

const btnActive: Partial<React.CSSProperties> = {
  background: "rgba(34, 211, 238, 0.18)",
  color: "#22d3ee",
  borderColor: "rgba(34, 211, 238, 0.50)",
};

// ── Component ──
export default function TerrainNavWidget() {
  const controls = useTerrainControls((s) => s.controls);
  const [collapsed, setCollapsed] = useState(false);
  const camPos = useCameraPosition(controls);

  const orbitLeft  = useCallback(() => orbitCamera(controls, -STEP_RAD, 0), [controls]);
  const orbitRight = useCallback(() => orbitCamera(controls, STEP_RAD, 0), [controls]);
  const orbitUp    = useCallback(() => orbitCamera(controls, 0, -STEP_RAD), [controls]);
  const orbitDown  = useCallback(() => orbitCamera(controls, 0, STEP_RAD), [controls]);
  const zoomIn     = useCallback(() => zoomCamera(controls, -ZOOM_STEP), [controls]);
  const zoomOut    = useCallback(() => zoomCamera(controls, ZOOM_STEP), [controls]);

  const left  = useContinuousPress(orbitLeft);
  const right = useContinuousPress(orbitRight);
  const up    = useContinuousPress(orbitUp);
  const down  = useContinuousPress(orbitDown);
  const zIn   = useContinuousPress(zoomIn);
  const zOut  = useContinuousPress(zoomOut);

  // Reset to canonical position
  const resetView = useCallback(() => {
    if (!controls?.object || !controls?.target) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    camera.position.set(0, 155, 460);
    camera.lookAt(controls.target);
    camera.updateProjectionMatrix();
    controls.update();
  }, [controls]);

  if (!controls) return null;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        title="Terrain Navigation"
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 100,
          ...btnBase,
          width: 34,
          height: 34,
          borderRadius: 8,
          background: "rgba(0, 0, 0, 0.40)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, btnHover)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "rgba(0, 0, 0, 0.40)", color: btnBase.color, borderColor: btnBase.border })}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "10px 8px 8px",
        borderRadius: 12,
        background: "#333333",
        backdropFilter: "blur(14px) saturate(1.2)",
        WebkitBackdropFilter: "blur(14px) saturate(1.2)",
        border: "1px solid rgba(200, 215, 230, 0.35)",
        boxShadow: [
          "0 0 0 1px rgba(255, 255, 255, 0.18)",
          "0 0 0 3px rgba(6, 10, 16, 0.80)",
          "0 0 0 4px rgba(200, 215, 230, 0.30)",
          "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
          "0 2px 12px rgba(200, 215, 230, 0.08)",
          "0 0 24px rgba(200, 215, 230, 0.04)",
        ].join(", "),
        userSelect: "none",
        pointerEvents: "auto",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2, width: "100%", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 8,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(255, 255, 255, 0.70)",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          Navigate
        </span>
        <button
          onClick={() => setCollapsed(true)}
          title="Collapse"
          style={{
            ...btnBase,
            width: 18,
            height: 18,
            borderRadius: 4,
            border: "none",
            background: "transparent",
            color: "rgba(34, 211, 238, 0.45)",
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* D-pad */}
      <div style={{ display: "grid", gridTemplateColumns: "35px 35px 35px", gridTemplateRows: "35px 35px 35px", gap: 3 }}>
        {/* Row 1: empty | up | empty */}
        <div />
        <DpadButton dir={up} title="Orbit up">
          <Arrow rotation={0} />
        </DpadButton>
        <div />

        {/* Row 2: left | reset | right */}
        <DpadButton dir={left} title="Orbit left">
          <Arrow rotation={-90} />
        </DpadButton>
        <button
          onClick={resetView}
          title="Reset view"
          style={{
            ...btnBase,
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(34, 211, 238, 0.60)",
            letterSpacing: "0.04em",
          }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, btnHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: btnBase.background, color: "rgba(34, 211, 238, 0.60)", borderColor: btnBase.border })}
        >
          ⟳
        </button>
        <DpadButton dir={right} title="Orbit right">
          <Arrow rotation={90} />
        </DpadButton>

        {/* Row 3: empty | down | empty */}
        <div />
        <DpadButton dir={down} title="Orbit down">
          <Arrow rotation={180} />
        </DpadButton>
        <div />
      </div>

      {/* Zoom row */}
      <div style={{ display: "flex", gap: 3, marginTop: 3, width: "100%" }}>
        <DpadButton dir={zOut} title="Zoom out" style={{ flex: 1 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </DpadButton>
        <DpadButton dir={zIn} title="Zoom in" style={{ flex: 1 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </DpadButton>
      </div>

      {/* Camera position readout */}
      <div
        style={{
          marginTop: 4,
          padding: "3px 6px",
          borderRadius: 4,
          background: "rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(34, 211, 238, 0.12)",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 8,
          lineHeight: 1.3,
          color: "rgba(34, 211, 238, 0.55)",
          letterSpacing: "0.04em",
          textAlign: "center",
          width: "100%",
          boxSizing: "border-box",
          whiteSpace: "nowrap",
        }}
        title={`Camera: x=${camPos.x} y=${camPos.y} z=${camPos.z}`}
      >
        <span style={{ color: "rgba(255,255,255,0.35)" }}>x</span>{camPos.x}{" "}
        <span style={{ color: "rgba(255,255,255,0.35)" }}>y</span>{camPos.y}{" "}
        <span style={{ color: "rgba(255,255,255,0.35)" }}>z</span>{camPos.z}
      </div>
    </div>
  );
}

// ── DpadButton with continuous press ──
function DpadButton({
  dir,
  title,
  children,
  style: extraStyle,
}: {
  dir: { start: () => void; stop: () => void };
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      title={title}
      onPointerDown={(e) => { e.preventDefault(); Object.assign(e.currentTarget.style, btnActive); dir.start(); }}
      onPointerUp={(e) => { dir.stop(); Object.assign(e.currentTarget.style, { background: btnBase.background, color: btnBase.color, borderColor: btnBase.border }); }}
      onPointerLeave={(e) => { dir.stop(); Object.assign(e.currentTarget.style, { background: btnBase.background, color: btnBase.color, borderColor: btnBase.border }); }}
      onContextMenu={(e) => e.preventDefault()}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, btnHover)}
      onMouseLeave={(e) => {
        dir.stop();
        Object.assign(e.currentTarget.style, {
          background: btnBase.background,
          color: btnBase.color,
          borderColor: "rgba(255, 255, 255, 0.08)",
        });
      }}
      style={{ ...btnBase, ...extraStyle }}
    >
      {children}
    </button>
  );
}
