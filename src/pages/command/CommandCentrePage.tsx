// src/pages/command/CommandCentrePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Command Centre Page
//
// Route: /command
// Executive Intelligence — centralised command & analytics hub.
// ═══════════════════════════════════════════════════════════════════════════

import PortalNav from "@/components/nav/PortalNav";
import ProvenanceBadge from "@/components/system/ProvenanceBadge";

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0d1b2a 0%, #0a1628 100%)",
    display: "flex",
    flexDirection: "column",
    color: "#e2e8f0",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    gap: 24,
  },
  icon: {
    fontSize: 48,
    opacity: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    background: "linear-gradient(135deg, #22d3ee, #67e8f9)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.45,
    maxWidth: 420,
    textAlign: "center" as const,
    lineHeight: 1.6,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "0 16px 8px",
  },
};

export default function CommandCentrePage() {
  return (
    <div style={S.page}>
      <PortalNav />
      <div style={S.content}>
        <span style={S.icon}>◆</span>
        <h1 style={S.title}>Executive Intelligence</h1>
        <p style={S.subtitle}>
          Centralised command hub — strategic analytics, scenario orchestration
          and board-ready intelligence. Coming soon.
        </p>
      </div>
      <div style={S.footer}>
        <ProvenanceBadge />
      </div>
    </div>
  );
}
