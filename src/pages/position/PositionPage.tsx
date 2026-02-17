// src/pages/position/PositionPage.tsx
import React, { useMemo } from "react";
import TerrainStage from "@/terrain/TerrainStage";
import TerrainPathSystem from "@/components/terrain/TerrainPathSystem";
import BaselineTimelineTicks from "@/components/terrain/core/BaselineTimelineTicks";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { createSeed } from "@/terrain/seed";
import { sampleHeight } from "@/paths/sampleTerrain";

/**
 * POSITION (Canonical)
 * - TerrainStage = the 3D world + floor
 * - TerrainPathSystem = the path ribbon that all markings sit on
 * - BaselineTimelineTicks = deterministic ticks along path (time axis)
 *
 * Non-negotiable: anything simulation-rendered must be visible here with good UX.
 */
export default function PositionPage() {
    const { baseline } = useSystemBaseline();
    const hasBaseline = !!baseline;

    // Deterministic seed and height sampler
    const seed = useMemo(() => createSeed("baseline"), []);
    const getHeightAt = useMemo(
        () => (worldX: number, worldZ: number) => {
            // Convert world coords to normalized 0-1 space for terrain
            const normalizedX = (worldX + 280) / 560; // worldWidth = 560
            const normalizedZ = (worldZ + 180) / 360; // worldHeight = 360
            return sampleHeight(normalizedX, normalizedZ, seed);
        },
        [seed]
    );

    // TEMP points (deterministic) until wiring to engine trajectory.
    // We will replace this with trajectory output once wiring is verified.
    const points = useMemo(
        () => [
            { x: -220, z: 40 },
            { x: -140, z: 10 },
            { x: -60, z: -20 },
            { x: 40, z: -10 },
            { x: 140, z: 30 },
            { x: 220, z: 10 },
        ],
        []
    );

    return (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {/* Top strip placeholder: keep it simple while we stabilise terrain */}
            <div style={{ padding: "10px 16px", flexShrink: 0, opacity: 0.92 }}>
                <div style={{ fontSize: 12, color: "rgba(148,163,184,0.85)" }}>
                    Position • Terrain + Path + Timeline {hasBaseline ? "• baseline loaded" : "• baseline missing"}
                </div>
            </div>

            {/* Main stage */}
            <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                <TerrainStage />

                {/* Path + timeline overlays (must remain visible) */}
                <TerrainPathSystem
                    points={points}
                    getHeightAt={getHeightAt}
                    halfWidth={0.65}
                    widthSegments={10}
                    lift={0.06}
                    tension={0.55}
                />

                <BaselineTimelineTicks />
            </div>
        </div>
    );
}
