// src/components/command/CinematicAnnotationOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Cinematic Annotation Overlay (Command Centre)
//
// Renders floating HTML labels at terrain anchor positions during director
// beats. Uses drei <Html> for screen-space projection from world coords.
//
// Consumed by TerrainTheatre as a child of TerrainStage (inside R3F Canvas).
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import { Html } from "@react-three/drei";
import { getTerrainAnchor } from "@/terrain/terrainAnchors";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

const LABEL_LIFT = 5.5;

function labelColor(anchorId: string): string {
  if (anchorId.includes("risk")) return "#ef4444";
  if (anchorId.includes("ev") || anchorId.includes("valuation") || anchorId.includes("revenue")) return "#34d399";
  return "#22d3ee";
}

interface SingleAnnotationProps {
  anchorId: string;
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const SingleAnnotation: React.FC<SingleAnnotationProps> = memo(({ anchorId, terrainRef }) => {
  const anchor = getTerrainAnchor(anchorId);

  const position = useMemo((): [number, number, number] => {
    if (!anchor) return [0, -9999, 0];
    const ax = anchor.position[0];
    const az = anchor.position[2];
    const terrain = terrainRef.current;
    const ay = terrain ? terrain.getHeightAt(ax, az) + LABEL_LIFT : LABEL_LIFT;
    return [ax, ay, az];
  }, [anchor, terrainRef]);

  if (!anchor) return null;

  const color = labelColor(anchorId);

  return (
    <Html
      position={position}
      center
      style={{ pointerEvents: "none" }}
      zIndexRange={[35, 0]}
    >
      <div style={{
        background: "rgba(6, 12, 20, 0.88)",
        border: `1px solid ${color}40`,
        borderRadius: 8,
        padding: "6px 12px",
        backdropFilter: "blur(10px)",
        boxShadow: `0 0 16px ${color}25, 0 6px 20px rgba(0,0,0,0.4)`,
        maxWidth: 200,
        textAlign: "center" as const,
        animation: "cinAnnotFadeIn 0.6s ease-out",
      }}>
        <div style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color,
          marginBottom: 2,
        }}>
          {anchor.label}
        </div>
        <div style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 9,
          color: "rgba(226, 232, 240, 0.65)",
          lineHeight: 1.4,
        }}>
          {anchor.description}
        </div>
      </div>
    </Html>
  );
});
SingleAnnotation.displayName = "SingleAnnotation";

interface CinematicAnnotationOverlayProps {
  markerIds: string[];
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const CinematicAnnotationOverlay: React.FC<CinematicAnnotationOverlayProps> = memo(
  ({ markerIds, terrainRef }) => {
    if (!markerIds.length) return null;

    return (
      <group name="cinematic-annotations">
        {markerIds.map((id) => (
          <SingleAnnotation key={id} anchorId={id} terrainRef={terrainRef} />
        ))}
      </group>
    );
  },
);

CinematicAnnotationOverlay.displayName = "CinematicAnnotationOverlay";
export default CinematicAnnotationOverlay;
