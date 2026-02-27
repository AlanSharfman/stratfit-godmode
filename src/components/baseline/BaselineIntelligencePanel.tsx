import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { useScenarioStore } from "@/state/scenarioStore";
import { useMarkerLinkStore } from "@/state/markerLinkStore";
import { computeBaselineCompleteness } from "@/logic/confidence/baselineCompleteness";
import {
  aggregateStructuralHeatScore,
  buildBaselineModel,
  evaluateStructuralScore,
} from "@/logic/heat/structuralHeatEngine";
import styles from "./BaselineIntelligencePanel.module.css";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}

function fmtUsdM(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 1_000_000).toFixed(1)}M`;
}
/* \u2500\u2500 Typewriter hook \u2500 types text char-by-char with medium pace \u2500\u2500 */
function useTypewriter(text: string, speed = 30): string {
  const [displayed, setDisplayed] = useState(text)
  const prevRef = useRef(text)

  useEffect(() => {
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
  }, [text, speed])

  return displayed || text
}

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const typed = useTypewriter(text, 30)
  return (
    <div className={className}>
      {typed}
      {typed.length < text.length && <span className={styles.twCursor}>\u258E</span>}
    </div>
  )
}
type Tone = "risk" | "info" | "strength" | "strategy";

const SIGNAL_MARKERS: Array<{ id: string; label: string; tone: Tone }> = [
  { id: "burn-acceleration", label: "Burn acceleration relative to ARR scale", tone: "risk" },
  { id: "margin-volatility", label: "Margin volatility sensitivity", tone: "risk" },
  { id: "capital-dependency", label: "Capital dependency within 9\u201312 months", tone: "info" },
  { id: "revenue-concentration", label: "Revenue concentration risk", tone: "strategy" },
  { id: "runway-strength", label: "Runway buffer integrity", tone: "strength" },
];

function pickPrimaryConstraintMarker(args: {
  runwayMonths: number;
  marginPct: number;
}) {
  const { runwayMonths, marginPct } = args;

  if (runwayMonths < 9) return "capital-dependency";
  if (marginPct < 45) return "margin-volatility";
  return "burn-acceleration";
}

const BaselineIntelligencePanel: React.FC = memo(() => {
  const { baseline } = useSystemBaseline();
  const baseKpis = useScenarioStore((s) => s.engineResults?.base?.kpis ?? null);

  const activeId = useMarkerLinkStore((s) => s.activeId);
  const hoverId = useMarkerLinkStore((s) => s.hoverId);
  const setActive = useMarkerLinkStore((s) => s.setActive);
  const setHover = useMarkerLinkStore((s) => s.setHover);

  const survivalBaselinePct = useMemo(() => {
    const v = baseKpis?.riskIndex?.value;
    return clamp(typeof v === "number" ? v : 70, 0, 100);
  }, [baseKpis]);

  const ctx = useMemo(
    () => (baseline ? buildBaselineModel(baseline, survivalBaselinePct) : null),
    [baseline, survivalBaselinePct],
  );

  const structuralScore = useMemo(() => (ctx ? aggregateStructuralHeatScore(ctx) : 70), [ctx]);
  const heat = useMemo(() => evaluateStructuralScore(structuralScore), [structuralScore]);

  const completeness = useMemo(() => computeBaselineCompleteness(baseline), [baseline]);
  const completenessPct = Math.round(completeness.completeness01 * 100);

  const revenue = baseline?.financial.arr ?? 0;
  const margin = baseline?.financial.grossMarginPct ?? 0;
  const burn = baseline?.financial.monthlyBurn ?? 0;
  const cash = baseline?.financial.cashOnHand ?? 0;
  const runway = burn > 0 ? cash / burn : 999;

  const status =
    structuralScore >= 78 ? "STRONG" :
    structuralScore >= 62 ? "STABLE" :
    structuralScore >= 48 ? "WATCH" : "WEAK";

  const primaryConstraintText =
    runway < 9
      ? "Runway compression within 6–9 months"
      : margin < 45
        ? "Margin stability below institutional threshold"
        : "Burn vs margin mismatch";

  const primaryMarkerId = useMemo(
    () => pickPrimaryConstraintMarker({ runwayMonths: runway, marginPct: margin }),
    [runway, margin],
  );

  const isPrimaryActive = activeId === primaryMarkerId;
  const isPrimaryHover = hoverId === primaryMarkerId;

  return (
    <aside className={styles.rightPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>BASELINE INTELLIGENCE</div>
        <div className={styles.cubeScene} aria-hidden="true">
          <div className={styles.cube}>
            <div className={`${styles.cubeFace} ${styles.cubeFront}`} />
            <div className={`${styles.cubeFace} ${styles.cubeBack}`} />
            <div className={`${styles.cubeFace} ${styles.cubeRight}`} />
            <div className={`${styles.cubeFace} ${styles.cubeLeft}`} />
            <div className={`${styles.cubeFace} ${styles.cubeTop}`} />
            <div className={`${styles.cubeFace} ${styles.cubeBottom}`} />
          </div>
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>SYSTEM DIAGNOSTIC</div>

        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>Status:</div>
          <div className={styles.statusValue} style={{ color: `var(${heat.color})` }}>
            {status}
          </div>
        </div>

        {/* Primary constraint is now linked to the correct mountain marker */}
        <div
          className={[
            "mk-signal",
            "mk-signal-compact",
            "mk-tone-risk",
            isPrimaryActive ? "mk-signal-active" : "",
            !isPrimaryActive && isPrimaryHover ? "mk-signal-hover" : "",
          ].join(" ")}
          data-tone="risk"
          onMouseEnter={() => setHover(primaryMarkerId)}
          onMouseLeave={() => setHover(null)}
          onClick={() => setActive(isPrimaryActive ? null : primaryMarkerId)}
          style={{ cursor: "pointer" }}
        >
          <div className={styles.constraintLabel}>Primary Constraint:</div>
          <div className={styles.constraintValue}>{primaryConstraintText}</div>
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>STRUCTURAL STORY</div>
        <TypewriterText
          className={styles.storyText}
          text={runway < 12
            ? "Liquidity headroom is narrowing. Burn intensity is compressing optionality faster than revenue scale can absorb."
            : "Runway is supported by current capital base. Composition quality depends on margin stability and burn proportionality."}
        />
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>KEY SIGNALS (Ranked)</div>

        <ol className={styles.signalList}>
          {SIGNAL_MARKERS.map((sig) => {
            const isActive = activeId === sig.id;
            const isHovered = hoverId === sig.id;

            return (
              <li
                key={sig.id}
                className={[
                  "mk-signal",
                  `mk-tone-${sig.tone}`,
                  isActive ? "mk-signal-active" : "",
                  !isActive && isHovered ? "mk-signal-hover" : "",
                ].join(" ")}
                data-tone={sig.tone}
                onMouseEnter={() => setHover(sig.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setActive(isActive ? null : sig.id)}
                style={{ cursor: "pointer" }}
              >
                <span className="mk-signalDot" />
                <span className="mk-signalText">{sig.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>TERRAIN INTERPRETATION</div>
        <TypewriterText
          className={styles.storyText}
          text="Each peak maps to Revenue \u2192 Margin \u2192 Runway \u2192 Burn \u2192 Efficiency. Valleys indicate structural fragility. Confidence width reflects certainty."
        />
      </div>

      <div className={styles.panelFoot}>
        <div className={styles.footLine}>
          Structural score:{" "}
          <span style={{ color: `var(${heat.color})` }}>{Math.round(structuralScore)}/100</span>
        </div>
        <div className={styles.footLine}>Input completeness: {completenessPct}%</div>
      </div>
    </aside>
  );
});

BaselineIntelligencePanel.displayName = "BaselineIntelligencePanel";
export default BaselineIntelligencePanel;


