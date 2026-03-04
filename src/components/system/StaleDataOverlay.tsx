// src/components/system/StaleDataOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Stale Data Overlay
//
// Subtle overlay that appears when simulation data may be stale
// (e.g., scenario changed but sim hasn't re-run).
// Non-blocking — user can still see underneath.
//
// Usage:
//   <StaleDataOverlay />   (auto-reads from useStaleGuard)
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";
import { useStaleGuard } from "@/hooks/useStaleGuard";

const StaleDataOverlay: React.FC = memo(() => {
  const { isStale, isRunning } = useStaleGuard();

  if (!isStale && !isRunning) return null;

  return (
    <div style={S.overlay} role="status" aria-live="polite">
      <div style={S.badge}>
        <span style={S.dot} />
        <span style={S.text}>
          {isRunning
            ? "Simulation running…"
            : "Data may be stale — re-run simulation to refresh"}
        </span>
      </div>
    </div>
  );
});

StaleDataOverlay.displayName = "StaleDataOverlay";
export default StaleDataOverlay;

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 8,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9000,
    pointerEvents: "none",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 14px",
    background: "rgba(251, 191, 36, 0.12)",
    border: "1px solid rgba(251, 191, 36, 0.25)",
    borderRadius: 6,
    backdropFilter: "blur(8px)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#fbbf24",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  text: {
    fontSize: 11,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 500,
    color: "rgba(251, 191, 36, 0.85)",
    letterSpacing: 0.2,
  },
};
