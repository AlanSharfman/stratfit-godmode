import React, { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLocation } from "react-router-dom"

const STORAGE_KEY = "stratfit-onboarding-complete"

interface TourStep {
  title: string
  body: string
  highlight: string
}

const POSITION_STEPS: TourStep[] = [
  {
    title: "Your Business Mountain",
    body: "This 3D terrain represents your company. Peaks are strengths, valleys are weaknesses. Each zone maps to a KPI — from liquidity to enterprise value.",
    highlight: "terrain",
  },
  {
    title: "KPI Zones",
    body: "10 zones span the terrain left to right. The health of each zone determines its elevation. Red zones need attention. Green zones are strong.",
    highlight: "legend",
  },
  {
    title: "Health Pulse",
    body: "The right panel shows your overall health score, 12-month survival probability, and cliff detector — early warnings of critical thresholds ahead.",
    highlight: "rightRail",
  },
  {
    title: "Command Palette",
    body: "Press Ctrl+K anywhere to instantly navigate, search scenarios, or jump to any page. It's your command centre.",
    highlight: "nav",
  },
  {
    title: "Mentor Mode",
    body: "The AI CFO assistant lives in the bottom-right corner. It provides context-aware strategic insights and proactive alerts based on your live KPIs.",
    highlight: "mentor",
  },
  {
    title: "You're Ready",
    body: "Explore your terrain. Ask 'What If' questions. Watch the mountain reshape. Your business has a shape — now you can see it.",
    highlight: "none",
  },
]

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function OnboardingTour() {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const location = useLocation()

  useEffect(() => {
    if (location.pathname !== "/position") return
    const done = localStorage.getItem(STORAGE_KEY)
    if (done) return
    const timer = setTimeout(() => setActive(true), 1500)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const complete = useCallback(() => {
    setActive(false)
    localStorage.setItem(STORAGE_KEY, "true")
  }, [])

  const next = useCallback(() => {
    if (step >= POSITION_STEPS.length - 1) {
      complete()
    } else {
      setStep((s) => s + 1)
    }
  }, [step, complete])

  const skip = useCallback(() => {
    complete()
  }, [complete])

  if (!active) return null

  const current = POSITION_STEPS[step]

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 4000,
              background: "rgba(2,4,10,0.7)",
              backdropFilter: "blur(2px)",
            }}
          />

          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{
              position: "fixed",
              bottom: 48,
              left: "50%",
              transform: "translateX(-50%)",
              width: 480, zIndex: 4001,
              background: "linear-gradient(135deg, rgba(10,18,32,0.98), rgba(6,14,28,0.99))",
              border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: 14,
              boxShadow: "0 16px 64px rgba(0,0,0,0.6), 0 0 40px rgba(34,211,238,0.05)",
              overflow: "hidden",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {/* Progress dots */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 6,
              padding: "14px 20px 0",
            }}>
              {POSITION_STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                    background: i === step ? "#22d3ee" : i < step ? "rgba(34,211,238,0.3)" : "rgba(200,220,240,0.06)",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div style={{ padding: "20px 28px 12px" }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "rgba(34,211,238,0.5)",
                marginBottom: 8,
              }}>
                {String(step + 1).padStart(2, "0")} / {String(POSITION_STEPS.length).padStart(2, "0")}
              </div>
              <h3 style={{
                fontSize: 18, fontWeight: 300, color: "rgba(200,220,240,0.9)",
                letterSpacing: "0.02em", margin: "0 0 10px",
              }}>
                {current.title}
              </h3>
              <p style={{
                fontSize: 13, lineHeight: 1.7, color: "rgba(200,220,240,0.5)",
                margin: 0, fontWeight: 400,
              }}>
                {current.body}
              </p>
            </div>

            {/* Actions */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 28px 20px",
            }}>
              <button
                onClick={skip}
                style={{
                  background: "none", border: "none",
                  color: "rgba(200,220,240,0.2)", fontSize: 11,
                  cursor: "pointer", fontWeight: 500,
                }}
              >
                Skip tour
              </button>
              <button
                onClick={next}
                style={{
                  padding: "10px 24px", borderRadius: 8,
                  background: "rgba(34,211,238,0.1)",
                  border: "1px solid rgba(34,211,238,0.25)",
                  color: "#22d3ee", fontSize: 12, fontWeight: 600,
                  letterSpacing: "0.04em", cursor: "pointer",
                }}
              >
                {step === POSITION_STEPS.length - 1 ? "Start Exploring" : "Next"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
