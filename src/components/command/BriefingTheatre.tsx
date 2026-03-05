import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { BriefingSection, CommandBriefing, BriefingInputs } from "@/core/command/generateCommandBriefing"
import { generateCommandBriefing } from "@/core/command/generateCommandBriefing"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { timeSimulation, buildKpiSnapshot, findFirstCliff } from "@/engine/timeSimulation"

interface BriefingTheatreProps {
  kpis: PositionKpis
  onClose: () => void
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function buildInputsFromKpis(kpis: PositionKpis): BriefingInputs {
  const snap = buildKpiSnapshot({
    cashBalance: kpis.cashOnHand, runwayMonths: kpis.runwayMonths,
    growthRatePct: kpis.growthRatePct, arr: kpis.arr,
    revenueMonthly: kpis.revenueMonthly, burnMonthly: kpis.burnMonthly,
    churnPct: kpis.churnPct, grossMarginPct: kpis.grossMarginPct,
    efficiencyRatio: kpis.efficiencyRatio, enterpriseValue: kpis.valuationEstimate,
  })
  const timeline = timeSimulation(snap, { direct: {} }, 12)
  const cliff = findFirstCliff(timeline)

  const criticalCount = KPI_KEYS.filter(k => getHealthLevel(k, kpis) === "critical").length
  const riskIndex = Math.max(0, 100 - criticalCount * 20)

  return {
    scenarioName: "Current Position",
    baselineName: "Live Baseline",
    evP50: kpis.valuationEstimate || null,
    evDCF: null,
    evRevMultiple: kpis.arr > 0 ? kpis.arr * (kpis.growthRatePct > 40 ? 12 : kpis.growthRatePct > 20 ? 8 : 5) : null,
    evEbitdaMultiple: null,
    evP10: kpis.valuationEstimate ? kpis.valuationEstimate * 0.5 : null,
    evP90: kpis.valuationEstimate ? kpis.valuationEstimate * 2.2 : null,
    riskIndex,
    runwayMonths: kpis.runwayMonths,
    dispersionWidth: kpis.valuationEstimate ? kpis.valuationEstimate * 0.8 : null,
    volatility: kpis.churnPct > 8 || kpis.runwayMonths < 6 ? 0.6 : 0.25,
    waterfallSteps: [
      { label: "Revenue Growth", delta: kpis.arr * (kpis.growthRatePct / 100), direction: "up" },
      { label: "Burn Rate", delta: -kpis.burnMonthly * 12, direction: "down" },
      { label: "Margin Expansion", delta: kpis.arr * ((kpis.grossMarginPct - 50) / 100), direction: kpis.grossMarginPct > 50 ? "up" : "down" },
    ],
    probZones: { upside: riskIndex > 60 ? 35 : 15, base: 50, stress: riskIndex > 60 ? 15 : 35 },
    provenance: { runId: Date.now(), seed: null, engineVersion: "physics-v4" },
    terrainSignals: {
      elevationScale: kpis.growthRatePct > 30 ? 2.0 : kpis.growthRatePct > 15 ? 1.5 : 0.8,
      roughness: kpis.burnMonthly > kpis.revenueMonthly ? 2.5 : 1.0,
      ridgeIntensity: Math.abs(kpis.growthRatePct - kpis.grossMarginPct) / 100,
      volatility: kpis.churnPct / 20,
    },
    pathSignals: {
      pathPointCount: 24,
      stressProbability: cliff ? 0.6 : 0.2,
      growthRate: kpis.growthRatePct / 100,
      churnRate: kpis.churnPct / 100,
    },
    riskHotspots: cliff ? [{
      id: cliff.kpi,
      type: "tipping_point",
      severity: 0.8,
      description: `${cliff.kpi} reaches ${cliff.threshold} threshold`,
      month: cliff.month,
    }] : [],
  }
}

export default function BriefingTheatre({ kpis, onClose }: BriefingTheatreProps) {
  const briefing = useMemo(() => {
    const inputs = buildInputsFromKpis(kpis)
    return generateCommandBriefing(inputs)
  }, [kpis])

  const [activeSection, setActiveSection] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number>(0)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  const section = briefing.sections[activeSection]

  const speakSection = useCallback((sec: BriefingSection) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const text = sec.lines.join(" ")
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.92
    utt.pitch = 1.0
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes("Samantha") || v.name.includes("Ava") || (v.lang === "en-US" && v.name.includes("Female")))
    if (preferred) utt.voice = preferred
    synthRef.current = utt
    window.speechSynthesis.speak(utt)
  }, [])

  const advance = useCallback(() => {
    setActiveSection(prev => {
      const next = prev + 1
      if (next >= briefing.sections.length) {
        setIsPlaying(false)
        window.speechSynthesis?.cancel()
        return prev
      }
      speakSection(briefing.sections[next])
      return next
    })
  }, [briefing, speakSection])

  const play = useCallback(() => {
    setIsPlaying(true)
    setActiveSection(0)
    setProgress(0)
    speakSection(briefing.sections[0])
  }, [briefing, speakSection])

  const stop = useCallback(() => {
    setIsPlaying(false)
    window.speechSynthesis?.cancel()
    clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 100
        if (next >= section.pauseMs) {
          advance()
          return 0
        }
        return next
      })
    }, 100)
    timerRef.current = interval as unknown as number
    return () => clearInterval(interval)
  }, [isPlaying, section, advance])

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); clearInterval(timerRef.current) }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(2,4,10,0.97)",
        display: "flex", flexDirection: "column",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 32px",
        borderBottom: "1px solid rgba(34,211,238,0.08)",
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(34,211,238,0.5)", textTransform: "uppercase" }}>
            Intelligence Briefing
          </div>
          <div style={{ fontSize: 16, fontWeight: 200, color: "rgba(200,220,240,0.85)", marginTop: 4, letterSpacing: "0.05em" }}>
            {section?.title ?? "Briefing"}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "rgba(200,220,240,0.05)", border: "1px solid rgba(200,220,240,0.1)",
          borderRadius: 6, padding: "8px 16px", color: "rgba(200,220,240,0.5)",
          fontSize: 11, cursor: "pointer", fontWeight: 600,
        }}>
          Close
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "rgba(34,211,238,0.06)" }}>
        <motion.div
          style={{ height: "100%", background: "linear-gradient(90deg, #22d3ee, #a78bfa)" }}
          animate={{ width: `${((activeSection + (progress / section.pauseMs)) / briefing.sections.length) * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "48px 64px", overflow: "auto" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{ maxWidth: 700, width: "100%", textAlign: "center" }}
          >
            {/* Section number */}
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(34,211,238,0.4)",
              textTransform: "uppercase", marginBottom: 16,
            }}>
              {String(activeSection + 1).padStart(2, "0")} / {String(briefing.sections.length).padStart(2, "0")}
            </div>

            {/* Section title */}
            <h2 style={{
              fontSize: 28, fontWeight: 200, color: "rgba(200,220,240,0.9)",
              letterSpacing: "0.05em", marginBottom: 32, lineHeight: 1.3,
            }}>
              {section.title}
            </h2>

            {/* Narrative */}
            {section.lines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.3, duration: 0.6 }}
                style={{
                  fontSize: 15, lineHeight: 1.8, color: "rgba(200,220,240,0.6)",
                  marginBottom: 16, fontWeight: 300,
                }}
              >
                {line}
              </motion.p>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Section dots + controls */}
      <div style={{
        padding: "16px 32px 24px",
        borderTop: "1px solid rgba(34,211,238,0.06)",
        display: "flex", justifyContent: "center", alignItems: "center", gap: 24,
      }}>
        {/* Section dots */}
        <div style={{ display: "flex", gap: 6 }}>
          {briefing.sections.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveSection(i); setProgress(0); if (isPlaying) speakSection(briefing.sections[i]) }}
              style={{
                width: i === activeSection ? 24 : 8, height: 8, borderRadius: 4,
                background: i === activeSection ? "#22d3ee" : i < activeSection ? "rgba(34,211,238,0.3)" : "rgba(200,220,240,0.08)",
                border: "none", cursor: "pointer", transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? stop : play}
          style={{
            padding: "10px 24px", borderRadius: 8,
            background: isPlaying ? "rgba(200,220,240,0.05)" : "rgba(34,211,238,0.1)",
            border: `1px solid ${isPlaying ? "rgba(200,220,240,0.1)" : "rgba(34,211,238,0.2)"}`,
            color: isPlaying ? "rgba(200,220,240,0.5)" : "#22d3ee",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {isPlaying ? "■ Stop" : "▶ Play Briefing"}
        </button>

        {/* Manual nav */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { if (activeSection > 0) { setActiveSection(activeSection - 1); setProgress(0) } }}
            disabled={activeSection === 0}
            style={{
              padding: "8px 14px", borderRadius: 6,
              background: "rgba(200,220,240,0.03)", border: "1px solid rgba(200,220,240,0.08)",
              color: activeSection === 0 ? "rgba(200,220,240,0.1)" : "rgba(200,220,240,0.4)",
              fontSize: 12, cursor: activeSection === 0 ? "default" : "pointer",
            }}
          >
            ←
          </button>
          <button
            onClick={() => { if (activeSection < briefing.sections.length - 1) { setActiveSection(activeSection + 1); setProgress(0) } }}
            disabled={activeSection === briefing.sections.length - 1}
            style={{
              padding: "8px 14px", borderRadius: 6,
              background: "rgba(200,220,240,0.03)", border: "1px solid rgba(200,220,240,0.08)",
              color: activeSection === briefing.sections.length - 1 ? "rgba(200,220,240,0.1)" : "rgba(200,220,240,0.4)",
              fontSize: 12, cursor: activeSection === briefing.sections.length - 1 ? "default" : "pointer",
            }}
          >
            →
          </button>
        </div>
      </div>
    </motion.div>
  )
}
