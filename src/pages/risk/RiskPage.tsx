// src/pages/risk/RiskPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Risk Intelligence  (Premium Coming Soon Module)
// ═══════════════════════════════════════════════════════════════════════════

import React from "react"
import PageShell from "@/components/nav/PageShell"

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8.5" stroke="#21D4FD" strokeWidth="1.2" />
        <path d="M10 5.5V10.5L13 13" stroke="#21D4FD" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    label: "Survival probability modelling",
    desc: "Monte Carlo simulation across thousands of paths to quantify business survival likelihood.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <polyline points="2,15 7,9 11,12 18,4" stroke="#4DEBFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="4" x2="18" y2="8" stroke="#4DEBFF" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="14" y1="8" x2="18" y2="8" stroke="#4DEBFF" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    label: "Runway collapse detection",
    desc: "Identify the exact conditions that trigger cash depletion before they materialise.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="13" width="4" height="5" rx="1" fill="none" stroke="#6E5BFF" strokeWidth="1.2" />
        <rect x="8" y="9" width="4" height="9" rx="1" fill="none" stroke="#6E5BFF" strokeWidth="1.2" />
        <rect x="14" y="5" width="4" height="13" rx="1" fill="none" stroke="#6E5BFF" strokeWidth="1.2" />
      </svg>
    ),
    label: "Liquidity risk forecasting",
    desc: "Forward-looking liquidity pressure analysis mapped to terrain depth and basin formation.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L18 18H2L10 2Z" fill="none" stroke="#9DB7D1" strokeWidth="1.2" strokeLinejoin="round" />
        <line x1="10" y1="8" x2="10" y2="13" stroke="#9DB7D1" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="10" cy="15.5" r="0.8" fill="#9DB7D1" />
      </svg>
    ),
    label: "Volatility exposure analysis",
    desc: "Quantify structural sensitivity to market shocks, demand drops, and competitive pressures.",
  },
]

export default function RiskPage() {
  return (
    <PageShell>
      <div style={S.page}>

        {/* Ambient depth layers behind card */}
        <div style={S.glowLeft} aria-hidden="true" />
        <div style={S.glowRight} aria-hidden="true" />

        <div style={S.card}>

          {/* Icon */}
          <div style={S.iconRing}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <polygon
                points="18,4 33,30 3,30"
                fill="none"
                stroke="#21D4FD"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <polygon
                points="18,9 28.5,28 7.5,28"
                fill="rgba(33,212,253,0.07)"
                stroke="none"
              />
              <line x1="18" y1="14" x2="18" y2="22" stroke="#4DEBFF" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="18" cy="25.5" r="1.2" fill="#4DEBFF" />
            </svg>
          </div>

          {/* Badge */}
          <span style={S.badge}>COMING SOON</span>

          {/* Title / subtitle */}
          <h1 style={S.title}>Risk Intelligence</h1>
          <p style={S.subtitle}>
            Advanced probabilistic risk analysis powered by STRATFIT simulation.
          </p>

          {/* Divider */}
          <div style={S.divider} />

          {/* Feature list */}
          <ul style={S.featureList}>
            {FEATURES.map((f) => (
              <li key={f.label} style={S.featureItem}>
                <span style={S.featureIcon}>{f.icon}</span>
                <div>
                  <div style={S.featureLabel}>{f.label}</div>
                  <div style={S.featureDesc}>{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer note */}
          <p style={S.footerNote}>
            This module is being calibrated against live simulation data. It will activate progressively as the intelligence layer matures.
          </p>

        </div>
      </div>
    </PageShell>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Styles
   ───────────────────────────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  page: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 24px",
    position: "relative",
    overflow: "hidden",
  },

  /* Atmospheric depth glows */
  glowLeft: {
    position: "absolute",
    top: "10%",
    left: "-8%",
    width: 480,
    height: 480,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(33,212,253,0.055) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  glowRight: {
    position: "absolute",
    bottom: "5%",
    right: "-10%",
    width: 520,
    height: 420,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(110,91,255,0.05) 0%, transparent 70%)",
    pointerEvents: "none",
  },

  card: {
    position: "relative",
    width: "100%",
    maxWidth: 560,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px 44px 44px",
    background:
      "linear-gradient(160deg, rgba(13,42,73,0.80) 0%, rgba(8,27,51,0.90) 60%, rgba(10,16,26,0.95) 100%)",
    border: "1px solid rgba(33,212,253,0.12)",
    borderRadius: 20,
    boxShadow:
      "0 0 0 1px rgba(33,212,253,0.04) inset, 0 24px 80px rgba(0,0,0,0.65), 0 0 60px rgba(33,212,253,0.04)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  },

  iconRing: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(13,42,73,0.70)",
    border: "1px solid rgba(33,212,253,0.18)",
    boxShadow: "0 0 28px rgba(33,212,253,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  badge: {
    display: "inline-block",
    padding: "4px 14px",
    marginBottom: 18,
    borderRadius: 20,
    background: "rgba(33,212,253,0.07)",
    border: "1px solid rgba(33,212,253,0.22)",
    color: "#21D4FD",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
  },

  title: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "#EAF4FF",
    margin: "0 0 10px",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: "rgba(157,183,209,0.65)",
    lineHeight: 1.65,
    textAlign: "center",
    margin: "0 0 4px",
    maxWidth: 380,
  },

  divider: {
    width: "100%",
    height: 1,
    background:
      "linear-gradient(90deg, transparent 0%, rgba(33,212,253,0.15) 30%, rgba(33,212,253,0.15) 70%, transparent 100%)",
    margin: "28px 0",
  },

  featureList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
  },

  featureIcon: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "rgba(13,42,73,0.60)",
    border: "1px solid rgba(33,212,253,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  featureLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(234,244,255,0.88)",
    marginBottom: 3,
    letterSpacing: "0.01em",
  },

  featureDesc: {
    fontSize: 11,
    color: "rgba(157,183,209,0.50)",
    lineHeight: 1.6,
  },

  footerNote: {
    marginTop: 32,
    fontSize: 10,
    color: "rgba(157,183,209,0.25)",
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: 380,
  },
}
