import React, { useEffect, useMemo, useRef, useState } from "react"
import type { DiagnosticCardVM, PositionViewModel } from "../overlays/positionState"
import styles from "./PositionNarrative.module.css"

/* ── Typewriter hook ─────────────────────────────────────────── */
function useTypewriter(text: string, speed = 18): string {
  const [displayed, setDisplayed] = useState("")
  const prevRef = useRef(text)

  useEffect(() => {
    // Only animate when text actually changes
    if (text === prevRef.current && displayed === text) return
    prevRef.current = text

    let i = 0
    setDisplayed("")
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed]) // eslint-disable-line react-hooks/exhaustive-deps

  return displayed || text
}

type Props = {
  vm: PositionViewModel | null
}

const TONE_ORDER: Record<DiagnosticCardVM["tone"], number> = {
  risk: 0,
  watch: 1,
  strong: 2,
}

function rankDiagnostics(items: DiagnosticCardVM[]): DiagnosticCardVM[] {
  return [...items].sort((a, b) => {
    const ta = TONE_ORDER[a.tone]
    const tb = TONE_ORDER[b.tone]
    if (ta !== tb) return ta - tb
    return a.title.localeCompare(b.title)
  })
}

function joinNatural(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function toneVerb(tone: PositionViewModel["stateTone"]): string {
  if (tone === "risk") return "is under material pressure"
  if (tone === "watch") return "requires active monitoring"
  return "is operating within acceptable bounds"
}

export default function ExecutiveNarrativeCard({ vm }: Props) {
  const lines = useMemo(() => {
    if (!vm) return null

    const { kpis } = vm

    const ranked = rankDiagnostics(vm.diagnostics ?? [])
    const top = ranked.slice(0, 2)
    const causeTitles = top.map((d) => d.title)
    const cause = causeTitles.length ? joinNatural(causeTitles) : "core operating drivers"

    const effect =
      `Position is ${vm.state} and ${toneVerb(vm.stateTone)} — ` +
      `${kpis.runwayMonths.toFixed(1)} months runway, risk index ${kpis.riskIndex.toFixed(1)}.`

    const b1 = vm.bullets?.[0]
    const b2 = vm.bullets?.[1]
    const action =
      b1 && b2
        ? `Focus next on: ${b1}; ${b2}.`
        : b1
          ? `Focus next on: ${b1}.`
          : `Focus next on the highest-risk diagnostics first.`

    const metricHints = top.map((d) => d.metricLine).filter(Boolean)
    const causeLine =
      metricHints.length
        ? `Primary signals: ${cause} (${metricHints.join(" \u00b7 ")}).`
        : `Primary signals: ${cause}.`

    const confidenceLine = `Confidence: ${vm.confidencePct}% (${vm.confidenceBand}).`

    return { effect, causeLine, action, confidenceLine }
  }, [vm])

  if (!lines) return null

  return (
    <div className={styles.narrativeCard} aria-label="Executive narrative">
      <div className={styles.title}>Executive Summary</div>
      <div className={styles.body}>
        <TypewriterParagraph text={lines.effect} className={styles.paragraph} />
        <TypewriterParagraph text={lines.causeLine} className={styles.paragraph} />
        <TypewriterParagraph text={lines.action} className={styles.paragraph} />
        <TypewriterParagraph text={lines.confidenceLine} className={styles.paragraph} />
      </div>
    </div>
  )
}

/* ── Single paragraph with typewriter ── */
function TypewriterParagraph({ text, className }: { text: string; className?: string }) {
  const typed = useTypewriter(text, 14)
  return (
    <p className={className}>
      {typed}
      {typed.length < text.length && <span className={styles.cursor}>▎</span>}
    </p>
  )
}
