// src/pages/valuation/ValuationPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Engine  (Premium Coming Soon Module)
// ═══════════════════════════════════════════════════════════════════════════

import React from "react"
import PageShell from "@/components/nav/PageShell"

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="2.5" width="15" height="15" rx="2.5" stroke="#21D4FD" strokeWidth="1.2" />
        <polyline points="5,14 8,10 11,12 15,7" stroke="#21D4FD" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "DCF simulation modelling",
    desc: "Probabilistic discounted cash flow across bear, base, and bull scenario paths.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="#4DEBFF" strokeWidth="1.2" />
        <line x1="10" y1="4" x2="10" y2="10" stroke="#4DEBFF" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="10" y1="10" x2="14" y2="13" stroke="#4DEBFF" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    label: "Revenue multiple benchmarking",
    desc: "ARR multiples calibrated against comparable stage, sector, and growth trajectory data.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="10" rx="7.5" ry="4.5" stroke="#6E5BFF" strokeWidth="1.2" />
        <line x1="2.5" y1="10" x2="2.5" y2="15" stroke="#6E5BFF" strokeWidth="1.1" />
        <line x1="17.5" y1="10" x2="17.5" y2="15" stroke="#6E5BFF" strokeWidth="1.1" />
        <path d="M2.5 15 Q10 19 17.5 15" fill="none" stroke="#6E5BFF" strokeWidth="1.2" />
      </svg>
    ),
    label: "Comparable company valuation",
    desc: "Peer-set EV benchmarking across 200+ analogous business profiles and exit trajectories.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <line x1="4" y1="16" x2="4" y2="4" stroke="#9DB7D1" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="4" y1="16" x2="16" y2="16" stroke="#9DB7D1" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="6" y="12" width="2" height="4" rx="0.5" fill="rgba(157,183,209,0.25)" stroke="#9DB7D1" strokeWidth="0.8" />
        <rect x="9" y="8"  width="2" height="8" rx="0.5" fill="rgba(157,183,209,0.45)" stroke="#9DB7D1" strokeWidth="0.8" />
        <rect x="12" y="5" width="2" height="11" rx="0.5" fill="rgba(157,183,209,0.65)" stroke="#9DB7D1" strokeWidth="0.8" />
      </svg>
    ),
    label: "Probabilistic valuation ranges (P10 / P50 / P90)",
    desc: "Monte Carlo-derived confidence intervals across 10,000 simulation paths for investor-grade outputs.",
  },
]

export default function ValuationPage() {
  return (
    <PageShell>
      <div style={S.page}>

        {/* Atmospheric depth glows */}
        <div style={S.glowLeft} aria-hidden="true" />
        <div style={S.glowRight} aria-hidden="true" />

        <div style={S.card}>

          {/* Icon */}
          <div style={S.iconRing}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="3" y="7" width="30" height="22" rx="4" stroke="#21D4FD" strokeWidth="1.5" fill="none" />
              <rect x="3" y="7" width="30" height="22" rx="4" fill="rgba(33,212,253,0.05)" />
              <polyline
                points="7,26 13,17 19,21 29,10"
                stroke="#4DEBFF"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="7"  cy="26" r="1.5" fill="#21D4FD" />
              <circle cx="13" cy="17" r="1.5" fill="#21D4FD" />
              <circle cx="19" cy="21" r="1.5" fill="#21D4FD" />
              <circle cx="29" cy="10" r="1.5" fill="#4DEBFF" />
            </svg>
          </div>

          {/* Badge */}
          <span style={S.badge}>COMING SOON</span>

          {/* Title / subtitle */}
          <h1 style={S.title}>Valuation Engine</h1>
          <p style={S.subtitle}>
            Quantify how strategic decisions impact enterprise value.
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
            The Valuation Engine integrates live simulation outputs with market data to produce investor-grade enterprise value estimates. Activation in progress.
          </p>

        </div>
      </div>
    </PageShell>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Styles — locked palette
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

  glowLeft: {
    position: "absolute",
    top: "5%",
    left: "-6%",
    width: 500,
    height: 460,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(33,212,253,0.048) 0%, transparent 68%)",
    pointerEvents: "none",
  },
  glowRight: {
    position: "absolute",
    bottom: "8%",
    right: "-8%",
    width: 480,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(110,91,255,0.048) 0%, transparent 68%)",
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
