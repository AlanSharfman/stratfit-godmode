import React, { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ROUTES } from "@/routes/routeContract"
import TerrainStage from "@/terrain/TerrainStage"
import CameraCompositionRig from "@/scene/camera/CameraCompositionRig"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import { WELCOME_PRESET } from "@/scene/camera/terrainCameraPresets"
import { useBaselineStore } from "@/state/baselineStore"
import { DEMO_COMPANY } from "@/data/demoCompany"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"

const WELCOME_METRICS: TerrainMetrics = {
  elevationScale: 1.15,
  roughness: 1.3,
  liquidityDepth: 1.2,
  growthSlope: 0.08,
  volatility: 0.25,
  ridgeIntensity: 0.7,
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function stagger(i: number) {
  return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 + i * 0.12, duration: 0.7, ease: EASE } }
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 1800
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(target * eased))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    const delay = setTimeout(() => { frame = requestAnimationFrame(step) }, 800)
    return () => { clearTimeout(delay); cancelAnimationFrame(frame) }
  }, [target])
  return <>{count.toLocaleString()}{suffix}</>
}

export default function WelcomePage() {
  const navigate = useNavigate()
  const setBaseline = useBaselineStore((s) => s.setBaseline)

  const handleDemo = useCallback(() => {
    setBaseline(DEMO_COMPANY)
    navigate(ROUTES.POSITION)
  }, [setBaseline, navigate])

  return (
    <div style={S.page}>
      <div style={S.voidBg} />

      <div style={S.terrainLayer}>
        <TerrainStage lockCamera pathsEnabled={false} terrainMetrics={WELCOME_METRICS} autoRotateSpeed={0.08} cameraPreset={WELCOME_PRESET}>
          <CameraCompositionRig preset={WELCOME_PRESET} />
          <SkyAtmosphere />
        </TerrainStage>
      </div>

      <div style={S.frostOverlay} />
      <div style={S.gradientOverlay} />

      {/* Top-left brand mark */}
      <motion.div {...stagger(0)} style={S.brandMark}>
        <img src="/stratfit-logo.png" alt="STRATFIT" style={S.brandLogoImg} />
        <div style={S.brandLogoText}>
          <span style={S.brandName}>STRATFIT</span>
          <span style={S.brandSub}>BUSINESS PHYSICS ENGINE</span>
        </div>
      </motion.div>

      <div style={S.heroContainer}>
        {/* Badge */}
        <motion.div {...stagger(1)} style={S.badge}>
          <span style={S.badgeDot} />
          <span style={S.badgeText}>YOUR BUSINESS HAS A SHAPE</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 {...stagger(2)} style={S.headline}>
          <span style={S.headlineLine}>See Your Business</span>
          <span style={S.headlineGradient}>As Living Terrain</span>
          <span style={S.headlineLine}>Before Reality Hits</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p {...stagger(3)} style={S.subtitle}>
          Every decision cascades. Every KPI is a force. Watch your business mountain{" "}
          <span style={S.highlight}>reshape in real time</span> as you ask "what if" —
          and see the consequences before they become reality.
        </motion.p>

        {/* Stats */}
        <motion.div {...stagger(4)} style={S.statsRow}>
          <div style={S.statItem}>
            <span style={S.statNumber}><AnimatedCounter target={10000} suffix="+" /></span>
            <span style={S.statLabel}>Simulations per Scenario</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={S.statNumber}><AnimatedCounter target={12} /></span>
            <span style={S.statLabel}>KPI Zones</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={S.statNumber}><AnimatedCounter target={50} suffix="+" /></span>
            <span style={S.statLabel}>Scenarios</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={S.statNumber}><AnimatedCounter target={12} /></span>
            <span style={S.statLabel}>Month Foresight</span>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div {...stagger(5)} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <motion.button
            type="button"
            onClick={() => navigate(ROUTES.INITIATE, { replace: true })}
            style={S.cta}
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(34,211,238,0.35), 0 8px 32px rgba(0,0,0,0.5)" }}
            whileTap={{ scale: 0.98 }}
          >
            Map Your Financial Landscape →
          </motion.button>
          <span style={S.ctaNote}>No signup required · See your terrain in 2 minutes</span>
          <motion.button
            type="button"
            onClick={handleDemo}
            style={S.demoBtn}
            whileHover={{ scale: 1.03, background: "rgba(167,139,250,0.12)" }}
            whileTap={{ scale: 0.97 }}
          >
            Try with sample data →
          </motion.button>
        </motion.div>

        {/* Trust badges */}
        <motion.div {...stagger(6)} style={S.trustRow}>
          <span style={S.trustBadge}>Business Physics Engine</span>
          <span style={S.trustDot} />
          <span style={S.trustBadge}>Cascade Simulation</span>
          <span style={S.trustDot} />
          <span style={S.trustBadge}>Strategic Foresight</span>
        </motion.div>
      </div>

      <div style={S.bottomVignette} />

      <div style={S.legal}>
        © {new Date().getFullYear()} STRATFIT · Business Physics for Strategic Decisions
      </div>

      <style>{`
        @keyframes welcomePulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}

const FONT = "'Inter', system-ui, sans-serif"
const VOID = "#020814"

const S: Record<string, React.CSSProperties> = {
  page: { position: "relative", width: "100%", height: "100vh", overflow: "hidden", fontFamily: FONT, color: "#e2e8f0" },
  voidBg: { position: "absolute", inset: 0, background: `linear-gradient(180deg, ${VOID} 0%, #0a0e17 50%, #0f1520 100%)`, zIndex: 0 },
  terrainLayer: { position: "absolute", inset: 0, zIndex: 1, opacity: 0.45 },
  frostOverlay: { position: "absolute", inset: 0, zIndex: 2, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", background: "rgba(2,8,20,0.3)" },
  gradientOverlay: { position: "absolute", inset: 0, zIndex: 3, background: "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 0%, rgba(2,8,20,0.7) 70%), linear-gradient(180deg, rgba(2,8,20,0.3) 0%, transparent 30%, transparent 70%, rgba(2,8,20,0.6) 100%)", pointerEvents: "none" },
  brandMark: { position: "absolute" as const, top: 28, left: 32, zIndex: 10, display: "flex", alignItems: "center", gap: 14 },
  brandLogoImg: { height: 48, width: "auto", filter: "drop-shadow(0 0 12px rgba(34,211,238,0.2))" },
  brandLogoText: { display: "flex", flexDirection: "column" as const, alignItems: "flex-start" },
  brandName: { fontSize: 22, fontWeight: 900, letterSpacing: "4px", color: "#fff", textShadow: "0 0 20px rgba(34,211,238,0.15)" },
  brandSub: { fontSize: 8, fontWeight: 700, letterSpacing: "0.35em", color: "rgba(34,211,238,0.55)", marginTop: 2 },
  heroContainer: { position: "relative", zIndex: 5, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 24px", textAlign: "center" as const, maxWidth: 720, margin: "0 auto" },
  badge: { display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)", marginBottom: 28 },
  badgeDot: { width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", animation: "welcomePulse 2s ease-in-out infinite" },
  badgeText: { fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(34,211,238,0.75)" },
  headline: { display: "flex", flexDirection: "column" as const, gap: 2, margin: "0 0 20px", lineHeight: 1.12 },
  headlineLine: { fontSize: 40, fontWeight: 200, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.88)" },
  headlineGradient: { fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #22d3ee, #06b6d4, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  subtitle: { fontSize: 15, lineHeight: 1.7, color: "rgba(148,180,214,0.65)", maxWidth: 520, margin: "0 0 28px", fontWeight: 400 },
  highlight: { color: "#22d3ee", fontWeight: 600 },
  statsRow: { display: "flex", alignItems: "center", gap: 28, marginBottom: 36 },
  statItem: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4 },
  statNumber: { fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "ui-monospace, 'JetBrains Mono', monospace" },
  statLabel: { fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "rgba(148,180,214,0.4)" },
  statDivider: { width: 1, height: 28, background: "rgba(148,180,214,0.1)" },
  cta: { padding: "15px 40px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", color: "#000", fontFamily: FONT, fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", boxShadow: "0 0 30px rgba(34,211,238,0.2), 0 8px 24px rgba(0,0,0,0.4)", marginBottom: 10 },
  ctaNote: { fontSize: 11, color: "rgba(148,180,214,0.4)", marginBottom: 12 },
  demoBtn: { padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.06)", color: "rgba(167,139,250,0.85)", fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em", marginBottom: 28 },
  trustRow: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const, justifyContent: "center" },
  trustBadge: { fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", color: "rgba(148,180,214,0.3)" },
  trustDot: { width: 3, height: 3, borderRadius: "50%", background: "rgba(148,180,214,0.15)" },
  bottomVignette: { position: "absolute" as const, bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to top, rgba(2,8,20,0.9) 0%, transparent 100%)", zIndex: 4, pointerEvents: "none" as const },
  legal: { position: "absolute" as const, bottom: 12, left: 0, right: 0, textAlign: "center" as const, fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: "0.04em", zIndex: 6, pointerEvents: "none" as const },
}
