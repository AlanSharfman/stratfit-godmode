// src/components/system/ProbabilityNotice.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Global Legal Probability Notice
//
// Persistent, low-opacity institutional notice displayed at the bottom of
// key analytical pages (Position, Compare, Decision).
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";

const NOTICE_TEXT =
  "STRATFIT provides probabilistic scenario modelling based on user inputs and system assumptions. " +
  "Results represent simulated outcomes and do not constitute financial advice, forecasts, or guarantees.";

export interface SystemProbabilityNoticeProps {
  /** Override position — defaults to bottom-center fixed */
  position?: "bottom-center" | "bottom-right";
  style?: React.CSSProperties;
}

const SystemProbabilityNotice: React.FC<SystemProbabilityNoticeProps> = memo(
  ({ position = "bottom-center", style }) => {
    const posStyles: React.CSSProperties =
      position === "bottom-right"
        ? { right: 16, left: "auto", textAlign: "right" as const }
        : { left: "50%", transform: "translateX(-50%)", textAlign: "center" as const };

    return (
      <div
        style={{ ...S.container, ...posStyles, ...style }}
        role="contentinfo"
        aria-label="Legal probability notice"
      >
        {NOTICE_TEXT}
      </div>
    );
  }
);

SystemProbabilityNotice.displayName = "SystemProbabilityNotice";
export default SystemProbabilityNotice;

// ────────────────────────────────────────────────────────────────────────────
// INLINE STYLES
// ────────────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: 8,
    maxWidth: 680,
    padding: "6px 16px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: 9,
    lineHeight: 1.5,
    letterSpacing: "0.02em",
    color: "rgba(148, 163, 184, 0.35)",
    pointerEvents: "none",
    userSelect: "none",
    zIndex: 5,
  },
};
