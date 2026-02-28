import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { useScenarioStore } from "@/state/scenarioStore";
import { computeBaselineCompleteness } from "@/logic/confidence/baselineCompleteness";
import {
  aggregateStructuralHeatScore,
  buildBaselineModel,
  evaluateStructuralScore,
} from "@/logic/heat/structuralHeatEngine";
import styles from "./BaselineIntelligencePanel.module.css";

/* ── helpers ── */
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}

/* ── Typewriter hook — types text char-by-char ── */
function useTypewriter(text: string, speed = 28): string {
  const [displayed, setDisplayed] = useState(text);
  const prevRef = useRef(text);

  useEffect(() => {
    if (text === prevRef.current && displayed === text) return;
    prevRef.current = text;
    let i = 0;
    setDisplayed("");
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return displayed || text;
}

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const typed = useTypewriter(text, 28);
  return (
    <div className={className}>
      {typed}
      {typed.length < text.length && <span className={styles.twCursor}>{"\u258E"}</span>}
    </div>
  );
}

/* ── Driver derivation ── */
type Tone = "risk" | "info" | "strength" | "strategy";

interface Driver {
  label: string;
  impact: string;
  tone: Tone;
}

function deriveDrivers(args: {
  runway: number;
  margin: number;
  burn: number;
  revenue: number;
  structuralScore: number;
}): Driver[] {
  const { runway, margin, burn, revenue, structuralScore } = args;
  const out: Driver[] = [];

  // 1 — Runway pressure (always evaluate first)
  if (runway < 9) {
    out.push({ label: "Capital timeline", impact: "Constraining strategic optionality", tone: "risk" });
  } else if (runway < 18) {
    out.push({ label: "Capital timeline", impact: "Adequate but narrowing with scale", tone: "info" });
  } else {
    out.push({ label: "Capital timeline", impact: "Supports multi-quarter planning horizon", tone: "strength" });
  }

  // 2 — Margin quality
  if (margin < 40) {
    out.push({ label: "Margin composition", impact: "Below institutional threshold", tone: "risk" });
  } else if (margin < 60) {
    out.push({ label: "Margin composition", impact: "Serviceable but limits reinvestment rate", tone: "info" });
  } else {
    out.push({ label: "Margin composition", impact: "Supports durable unit economics", tone: "strength" });
  }

  // 3 — Burn proportionality
  const burnToRev = revenue > 0 ? burn / (revenue / 12) : 999;
  if (burnToRev > 1.5) {
    out.push({ label: "Burn proportionality", impact: "Outpacing revenue momentum", tone: "risk" });
  } else if (burnToRev > 0.8) {
    out.push({ label: "Burn proportionality", impact: "Tracking close to revenue cadence", tone: "strategy" });
  } else {
    out.push({ label: "Burn proportionality", impact: "Well within sustainable envelope", tone: "strength" });
  }

  // 4 — Structural integrity (only if meaningful)
  if (structuralScore < 50) {
    out.push({ label: "Structural integrity", impact: "Multiple dimensions under stress", tone: "risk" });
  } else if (structuralScore < 70) {
    out.push({ label: "Structural integrity", impact: "Partial imbalance across dimensions", tone: "strategy" });
  }

  return out.slice(0, 4);
}

/* ── Headline derivation ── */
function deriveHeadline(args: {
  runway: number;
  margin: number;
  structuralScore: number;
}): string {
  const { runway, margin, structuralScore } = args;

  if (structuralScore < 48)
    return "Multiple structural pressures require near-term attention.";
  if (runway < 9)
    return "Capital timeline is the binding constraint on forward strategy.";
  if (margin < 45)
    return "Margin composition is limiting reinvestment capacity.";
  if (structuralScore >= 78)
    return "Structural position supports sustained forward momentum.";
  return "Position is stable with selective pressure points to monitor.";
}

/* ── Interpretation derivation ── */
function deriveInterpretation(args: {
  runway: number;
  margin: number;
  structuralScore: number;
}): string {
  const { runway, margin, structuralScore } = args;

  if (structuralScore < 48)
    return "The current trajectory shows compounding stress across capital, margin and burn dimensions. Prioritise stabilisation before growth investment.";
  if (runway < 12)
    return "Liquidity headroom is narrowing. Burn intensity is compressing optionality faster than revenue scale can absorb.";
  if (margin < 50)
    return "Margin depth is the primary gate on sustainable scaling. Improving unit economics will unlock broader strategic range.";
  return "Runway is supported by the current capital base. Trajectory quality depends on maintaining margin stability alongside proportional growth.";
}

/* ── Component ── */
const FALLBACK_MSG = "Analysis will appear after simulation completes.";

const BaselineIntelligencePanel: React.FC = memo(() => {
  const { baseline } = useSystemBaseline();
  const baseKpis = useScenarioStore((s) => s.engineResults?.base?.kpis ?? null);

  const survivalBaselinePct = useMemo(() => {
    const v = baseKpis?.riskIndex?.value;
    return clamp(typeof v === "number" ? v : 70, 0, 100);
  }, [baseKpis]);

  const ctx = useMemo(
    () => (baseline ? buildBaselineModel(baseline, survivalBaselinePct) : null),
    [baseline, survivalBaselinePct],
  );

  const structuralScore = useMemo(
    () => (ctx ? aggregateStructuralHeatScore(ctx) : 70),
    [ctx],
  );
  const heat = useMemo(() => evaluateStructuralScore(structuralScore), [structuralScore]);

  const completeness = useMemo(() => computeBaselineCompleteness(baseline), [baseline]);
  const completenessPct = Math.round(completeness.completeness01 * 100);

  const revenue = baseline?.financial.arr ?? 0;
  const margin = baseline?.financial.grossMarginPct ?? 0;
  const burn = baseline?.financial.monthlyBurn ?? 0;
  const cash = baseline?.financial.cashOnHand ?? 0;
  const runway = burn > 0 ? cash / burn : 999;

  const ready = !!baseline;

  const headline = useMemo(
    () => deriveHeadline({ runway, margin, structuralScore }),
    [runway, margin, structuralScore],
  );

  const drivers = useMemo(
    () => deriveDrivers({ runway, margin, burn, revenue, structuralScore }),
    [runway, margin, burn, revenue, structuralScore],
  );

  const interpretation = useMemo(
    () => deriveInterpretation({ runway, margin, structuralScore }),
    [runway, margin, structuralScore],
  );

  return (
    <aside className={styles.rightPanel}>
      {/* ── Header ── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          AI INTELLIGENCE
          <span className={styles.strobeDots} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
        </div>
      </div>

      {!ready ? (
        <div className={styles.panelSection}>
          <div className={styles.fallback}>{FALLBACK_MSG}</div>
        </div>
      ) : (
        <>
          {/* ── 1. Diagnostic Headline ── */}
          <div className={styles.panelSection}>
            <div className={styles.headline}>{headline}</div>
          </div>

          {/* ── 2. Primary Drivers ── */}
          <div className={styles.panelSection}>
            <div className={styles.sectionTitle}>PRIMARY DRIVERS</div>
            <ul className={styles.driverList}>
              {drivers.map((d, i) => (
                <li key={i} className={styles.driverItem} data-tone={d.tone}>
                  <span className={styles.driverDot} data-tone={d.tone} />
                  <span className={styles.driverLabel}>{d.label}</span>
                  <span className={styles.driverSep}>{" — "}</span>
                  <span className={styles.driverImpact}>{d.impact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 3. Interpretation ── */}
          <div className={styles.panelSection}>
            <div className={styles.sectionTitle}>INTERPRETATION</div>
            <TypewriterText className={styles.storyText} text={interpretation} />
          </div>

          {/* ── Footer ── */}
          <div className={styles.panelFoot}>
            <div className={styles.footLine}>
              Structural score:{" "}
              <span style={{ color: `var(${heat.color})` }}>
                {Math.round(structuralScore)}/100
              </span>
            </div>
            <div className={styles.footLine}>
              Input completeness: {completenessPct}%
            </div>
          </div>
        </>
      )}
    </aside>
  );
});

BaselineIntelligencePanel.displayName = "BaselineIntelligencePanel";
export default BaselineIntelligencePanel;


