// src/components/blocks/TerrainToggles.tsx
// STRATFIT — Terrain View Toggles (Timeline & Heatmap)
// User-controlled rendering options

import React from "react";
import { CalendarDays, Grid3x3 } from "lucide-react";
import styles from "./TerrainToggles.module.css";

interface TerrainTogglesProps {
  timelineEnabled: boolean;
  heatmapEnabled: boolean;
  onTimelineToggle: () => void;
  onHeatmapToggle: () => void;
  variant?: "panel" | "rail";
}

export default function TerrainToggles({
  timelineEnabled,
  heatmapEnabled,
  onTimelineToggle,
  onHeatmapToggle,
  variant = "panel",
}: TerrainTogglesProps) {
  return (
    <div className={styles.togglesContainer}>
      {/* Timeline Toggle - Standard Tactical Cyan */}
      <button
        className={`${styles.toggleButton} ${
          timelineEnabled ? styles.active : ""
        }`}
        onClick={onTimelineToggle}
        aria-pressed={timelineEnabled}
        title="Show 36-month trajectory"
      >
        <CalendarDays size={18} className={styles.toggleIcon} />
        <span className={styles.toggleLabel}>Timeline</span>
        <span className={styles.toggleIndicator}>
          {timelineEnabled ? "●" : "○"}
        </span>
      </button>

      {/* Heatmap Toggle - Thermal Amber Mode */}
      <button
        className={`${styles.toggleButton} ${styles.toggleButtonHeatmap} ${
          heatmapEnabled ? styles.activeHeatmap : ""
        }`}
        onClick={onHeatmapToggle}
        aria-pressed={heatmapEnabled}
        title="Show risk zones (thermal view)"
      >
        {/* Thermal noise background on active */}
        <div className={`${styles.thermalOverlay} ${heatmapEnabled ? styles.thermalOverlayActive : ""}`} />
        
        <Grid3x3 size={18} className={`${styles.toggleIcon} ${styles.toggleIconHeatmap}`} />
        <span className={`${styles.toggleLabel} ${styles.toggleLabelHeatmap}`}>Heatmap</span>
        <span className={`${styles.toggleIndicator} ${styles.toggleIndicatorHeatmap}`}>
          {heatmapEnabled ? "●" : "○"}
        </span>
      </button>
    </div>
  );
}
