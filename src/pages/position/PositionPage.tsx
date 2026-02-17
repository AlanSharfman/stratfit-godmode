// src/pages/position/PositionPage.tsx
import React from "react";
import TerrainStage from "@/terrain/TerrainStage";

// These were just added by you in the checkpoint commit.
// If either import fails, we'll rg the exact exported names and adjust.
import TerrainPathSystem from "@/paths/TerrainPathSystem";

export default function PositionPage() {
  return (
    <div
      className="mode-terrain"
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 3D CANVAS ZONE */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <TerrainStage />

        {/* Path + markers MUST be visible ON TOP of terrain */}
        <TerrainPathSystem />
      </div>
    </div>
  );
}
