// src/components/intelligence/TerrainTargetLabel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Target Label
//
// Contextual label that appears at the terrain anchor position.
// Shows anchor label + description. Auto-fades after 4 seconds.
// Uses drei Html overlay — rendered only when targeting is active.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import { useIntelligenceTargetStore } from "@/stores/intelligenceTargetStore";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const FADE_DURATION_MS = 4000;
const LABEL_LIFT = 3.5; // height above terrain for label

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const TerrainTargetLabel: React.FC<Props> = memo(({ terrainRef }) => {
  const target = useIntelligenceTargetStore((s) => s.currentTarget);
  const isActive = useIntelligenceTargetStore((s) => s.isActive);

  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  // Show on activation, auto-fade after 4s
  useEffect(() => {
    if (isActive && target) {
      setVisible(true);
      setFading(false);
      const fadeTimer = setTimeout(() => setFading(true), FADE_DURATION_MS);
      const hideTimer = setTimeout(() => setVisible(false), FADE_DURATION_MS + 600);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setVisible(false);
      setFading(false);
    }
  }, [isActive, target]);

  const position = useMemo((): [number, number, number] => {
    if (!target) return [0, 0, 0];
    const ax = target.position[0];
    const az = target.position[2];
    const terrain = terrainRef.current;
    const ay = terrain ? terrain.getHeightAt(ax, az) + LABEL_LIFT : LABEL_LIFT;
    return [ax, ay, az];
  }, [target, terrainRef]);

  if (!visible || !target) return null;

  return (
    <Html
      position={position}
      center
      style={{
        pointerEvents: "none",
        transition: "opacity 0.6s ease",
        opacity: fading ? 0 : 1,
      }}
      zIndexRange={[30, 0]}
    >
      <div style={S.container}>
        <div style={S.label}>{target.label}</div>
        <div style={S.description}>{target.description}</div>
      </div>
    </Html>
  );
});

TerrainTargetLabel.displayName = "TerrainTargetLabel";
export default TerrainTargetLabel;

// ────────────────────────────────────────────────────────────────────────────
// INLINE STYLES
// ────────────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  container: {
    background: "rgba(8, 12, 18, 0.82)",
    border: "1px solid rgba(34, 211, 238, 0.25)",
    borderRadius: 8,
    padding: "8px 14px",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
    maxWidth: 220,
    textAlign: "center" as const,
  },
  label: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "#22d3ee",
    textTransform: "uppercase" as const,
    marginBottom: 2,
  },
  description: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 10,
    color: "rgba(226, 232, 240, 0.7)",
    lineHeight: 1.4,
  },
};
