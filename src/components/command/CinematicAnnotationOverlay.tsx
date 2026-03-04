// src/components/command/CinematicAnnotationOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Cinematic Annotation Overlay (Command Centre)
//
// Renders floating HTML labels at terrain anchor positions during director
// beats. Uses drei <Html> for screen-space projection from world coords.
//
// Consumed by TerrainTheatre as a child of TerrainStage (inside R3F Canvas).
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
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
  const [opacity, setOpacity] = useState(0);
  const [position, setPosition] = useState<[number, number, number]>([0, -9999, 0]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sample terrain height once terrain is ready, then fade in
  useEffect(() => {
    if (!anchor) return;
    const ax = anchor.position[0];
    const az = anchor.position[2];
    const terrain = terrainRef.current;
    const ay = terrain ? terrain.getHeightAt(ax, az) + LABEL_LIFT : LABEL_LIFT;
    setPosition([ax, ay, az]);
    timerRef.current = setTimeout(() => setOpacity(1), 60);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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
        background: "rgba(6, 12, 20, 0.92)",
        border: `1px solid ${color}55`,
        borderRadius: 8,
        padding: "6px 12px",
        boxShadow: `0 0 16px ${color}30, 0 6px 20px rgba(0,0,0,0.5)`,
        maxWidth: 200,
        minWidth: 100,
        textAlign: "center" as const,
        opacity,
        transition: "opacity 0.5s ease-out",
        userSelect: "none" as const,
      }}>
        <div style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color,
          marginBottom: 3,
          whiteSpace: "nowrap" as const,
        }}>
          {anchor.label}
        </div>
        <div style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 9,
          color: "rgba(226, 232, 240, 0.75)",
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
