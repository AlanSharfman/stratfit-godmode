// src/pages/command/CommandCentrePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Command Centre Page (Cinematic Intelligence Theatre)
//
// Route: /command
// Executive Intelligence — centralised command & analytics hub.
//
// Layout:
//   - Top bar: status + Investor Briefing button + provenance
//   - Theatre: TerrainTheatre (65%) + BriefingRail (35%)
//   - Footer: ProbabilityNotice
//
// No simulation engine changes. Selector-only access.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import PortalNav from "@/components/nav/PortalNav";
import ProvenanceBadge from "@/components/system/ProvenanceBadge";
import SystemProbabilityNotice from "@/components/system/ProbabilityNotice";
import TheatreLayout from "@/components/command/TheatreLayout";
import TimelineSyncStrip from "@/components/timeline/TimelineSyncStrip";

const FONT = "'Inter', system-ui, sans-serif";
const CYAN = "#22d3ee";

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0d1b2a 0%, #0a1628 100%)",
    display: "flex",
    flexDirection: "column",
    color: "#e2e8f0",
    fontFamily: FONT,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    borderBottom: "1px solid rgba(182, 228, 255, 0.06)",
    flexShrink: 0,
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    background: "linear-gradient(135deg, #22d3ee, #67e8f9)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 6px rgba(34, 197, 94, 0.5)",
  },
  statusLabel: {
    fontSize: 10,
    color: "rgba(148, 180, 214, 0.55)",
    fontWeight: 600,
    letterSpacing: "0.06em",
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  investorBtn: {
    padding: "7px 18px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    fontFamily: FONT,
    border: `1px solid rgba(34, 211, 238, 0.35)`,
    borderRadius: 6,
    background: "rgba(34, 211, 238, 0.1)",
    color: CYAN,
    cursor: "pointer",
    transition: "all 200ms ease",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  investorBtnActive: {
    padding: "7px 18px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    fontFamily: FONT,
    border: `1px solid rgba(34, 211, 238, 0.6)`,
    borderRadius: 6,
    background: "rgba(34, 211, 238, 0.2)",
    color: "#fff",
    cursor: "pointer",
    transition: "all 200ms ease",
    display: "flex",
    alignItems: "center",
    gap: 6,
    boxShadow: `0 0 20px -6px rgba(34, 211, 238, 0.25)`,
  },
  theatreContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "0 16px 4px",
    flexShrink: 0,
  },
};

export default function CommandCentrePage() {
  const [theatreActive, setTheatreActive] = useState(true);

  const toggleTheatre = useCallback(() => {
    setTheatreActive((v) => !v);
  }, []);

  return (
    <div style={S.page}>
      <PortalNav />

      {/* ── Top Bar ── */}
      <div style={S.topBar}>
        <div style={S.topBarLeft}>
          <span style={S.pageTitle}>◆ Command Centre</span>
          <span style={S.statusDot} />
          <span style={S.statusLabel}>Intelligence Theatre</span>
        </div>
        <div style={S.topBarRight}>
          <button
            type="button"
            onClick={toggleTheatre}
            style={theatreActive ? S.investorBtnActive : S.investorBtn}
          >
            ◆ Intelligence Briefing
          </button>
          <ProvenanceBadge />
        </div>
      </div>

      {/* ── Timeline Sync ── */}
      <TimelineSyncStrip mode="all" />

      {/* ── Theatre ── */}
      <div style={S.theatreContainer}>
        {theatreActive ? (
          <TheatreLayout />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.4,
              fontSize: 14,
            }}
          >
            Activate Intelligence Briefing to launch the Intelligence Theatre.
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={S.footer}>
        <ProvenanceBadge />
      </div>

      {/* ── Probability Notice ── */}
      <SystemProbabilityNotice />
    </div>
  );
}
