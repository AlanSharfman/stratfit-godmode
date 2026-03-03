// src/pages/welcome/WelcomePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Welcome Page (God Mode)
//
// Institutional front door. Real 3D terrain mountain blurred behind
// frosted glass hero content. Single CTA → /initiate.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/routes/routeContract"
import TerrainStage from "@/terrain/TerrainStage"
import CameraCompositionRig from "@/scene/camera/CameraCompositionRig"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"

/* ── Static terrain metrics for the welcome background ── */
const WELCOME_METRICS: TerrainMetrics = {
  elevationScale: 1.15,
  roughness: 1.3,
  liquidityDepth: 1.2,
  growthSlope: 0.08,
  volatility: 0.25,
  ridgeIntensity: 0.7,
}

export default function WelcomePage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  // Fade in after mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={S.page}>
      {/* ═══ LAYER 0: Deep void background ═══ */}
      <div style={S.voidBg} />

      {/* ═══ LAYER 1: Real 3D terrain — blurred behind content ═══ */}
      <div style={S.terrainLayer}>
        <TerrainStage
          lockCamera
          pathsEnabled={false}
          terrainMetrics={WELCOME_METRICS}
        >
          <CameraCompositionRig />
          <SkyAtmosphere />
        </TerrainStage>
      </div>

      {/* ═══ LAYER 2: Blur + gradient frost overlay ═══ */}
      <div style={S.frostOverlay} />
      <div style={S.gradientOverlay} />

      {/* ═══ LAYER 3: Hero content ═══ */}
      <div
        style={{
          ...S.heroContainer,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
        }}
      >
        {/* Logo */}
        <div style={S.logoRow}>
          <img
            src="/stratfit-logo.png"
            alt="STRATFIT"
            style={S.logoImg}
          />
          <div style={S.logoText}>
            <span style={S.logoName}>STRATFIT</span>
            <span style={S.logoSub}>SCENARIO INTELLIGENCE</span>
          </div>
        </div>

        {/* Badge */}
        <div style={S.badge}>
          <span style={S.badgeDot} />
          <span style={S.badgeText}>SCENARIO INTELLIGENCE</span>
        </div>

        {/* Headline */}
        <h1 style={S.headline}>
          <span style={S.headlineLine}>Stress Test Your</span>
          <span style={S.headlineGradient}>Business Strategy</span>
          <span style={S.headlineLine}>Before Execution</span>
        </h1>

        {/* Subtitle */}
        <p style={S.subtitle}>
          Run 10,000 Monte Carlo simulations. See every possible future.{" "}
          Make decisions with <span style={S.highlight}>probability</span>, not guesswork.
        </p>

        {/* Stats row */}
        <div style={S.statsRow}>
          <div style={S.statItem}>
            <span style={S.statNumber}>10,000</span>
            <span style={S.statLabel}>Simulations</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={S.statNumber}>2 min</span>
            <span style={S.statLabel}>To Clarity</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={S.statNumber}>1</span>
            <span style={S.statLabel}>Clear Focus</span>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.INITIATE)}
          style={S.cta}
          onMouseEnter={(e) => {
            ;(e.target as HTMLElement).style.background =
              "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)"
            ;(e.target as HTMLElement).style.transform = "scale(1.03)"
          }}
          onMouseLeave={(e) => {
            ;(e.target as HTMLElement).style.background =
              "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
            ;(e.target as HTMLElement).style.transform = "scale(1)"
          }}
        >
          Begin Assessment →
        </button>

        <span style={S.ctaNote}>
          No signup required · See results in 2 minutes
        </span>

        {/* Trust badges */}
        <div style={S.trustRow}>
          <span style={S.trustBadge}>✓ Monte Carlo Engine</span>
          <span style={S.trustBadge}>✓ AI Intelligence Brief</span>
          <span style={S.trustBadge}>✓ Institutional Grade</span>
        </div>
      </div>

      {/* ═══ LAYER 4: Bottom vignette ═══ */}
      <div style={S.bottomVignette} />

      {/* Legal */}
      <div style={S.legal}>
        © {new Date().getFullYear()} STRATFIT. Scenario Intelligence for Strategic Decisions.
      </div>

      {/* Fade-in animation */}
      <style>{`
        @keyframes welcomePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STYLES — institutional, god-mode
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"
const VOID = "#020814"

const S: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    fontFamily: FONT,
    color: "#e2e8f0",
  },

  voidBg: {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(180deg, ${VOID} 0%, #0a0e17 50%, #0f1520 100%)`,
    zIndex: 0,
  },

  terrainLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    opacity: 0.55,
  },

  frostOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    background: "rgba(2, 8, 20, 0.35)",
  },

  gradientOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 3,
    background:
      "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 0%, rgba(2,8,20,0.7) 70%), " +
      "linear-gradient(180deg, rgba(2,8,20,0.3) 0%, transparent 30%, transparent 70%, rgba(2,8,20,0.6) 100%)",
    pointerEvents: "none",
  },

  heroContainer: {
    position: "relative",
    zIndex: 5,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "40px 24px",
    textAlign: "center" as const,
    transition: "opacity 0.8s ease, transform 0.8s ease",
    maxWidth: 720,
    margin: "0 auto",
  },

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  logoImg: {
    height: 40,
    width: "auto",
  },

  logoText: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
  },

  logoName: {
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: "3px",
    color: "#fff",
  },

  logoSub: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.25em",
    color: "rgba(34,211,238,0.7)",
    marginTop: 1,
  },

  badge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 14px",
    borderRadius: 999,
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.2)",
    marginBottom: 28,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22d3ee",
    animation: "welcomePulse 2s ease-in-out infinite",
  },

  badgeText: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.18em",
    color: "rgba(34,211,238,0.85)",
  },

  headline: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    margin: "0 0 20px",
    lineHeight: 1.15,
  },

  headlineLine: {
    fontSize: 42,
    fontWeight: 300,
    letterSpacing: "-0.02em",
    color: "rgba(255,255,255,0.92)",
  },

  headlineGradient: {
    fontSize: 46,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    background: "linear-gradient(135deg, #22d3ee, #06b6d4, #a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 1.65,
    color: "rgba(148,180,214,0.75)",
    maxWidth: 540,
    margin: "0 0 28px",
    fontWeight: 400,
  },

  highlight: {
    color: "#22d3ee",
    fontWeight: 600,
  },

  statsRow: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    marginBottom: 32,
  },

  statItem: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 4,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: 700,
    color: "#fff",
    fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  },

  statLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(148,180,214,0.5)",
  },

  statDivider: {
    width: 1,
    height: 28,
    background: "rgba(148,180,214,0.15)",
  },

  cta: {
    padding: "14px 36px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    color: "#000",
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.04em",
    cursor: "pointer",
    boxShadow:
      "0 0 30px rgba(34,211,238,0.25), 0 8px 24px rgba(0,0,0,0.4)",
    transition: "all 200ms ease",
    marginBottom: 10,
  },

  ctaNote: {
    fontSize: 11,
    color: "rgba(148,180,214,0.45)",
    marginBottom: 24,
  },

  trustRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap" as const,
    justifyContent: "center",
  },

  trustBadge: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "rgba(148,180,214,0.4)",
  },

  bottomVignette: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    background:
      "linear-gradient(to top, rgba(2,8,20,0.9) 0%, transparent 100%)",
    zIndex: 4,
    pointerEvents: "none" as const,
  },

  legal: {
    position: "absolute" as const,
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: "center" as const,
    fontSize: 10,
    color: "rgba(255,255,255,0.15)",
    letterSpacing: "0.04em",
    zIndex: 6,
    pointerEvents: "none" as const,
  },
}
