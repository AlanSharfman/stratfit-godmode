import React, { memo, useMemo } from "react";
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

type Tone = "risk" | "info" | "strength" | "strategy";

const SIGNAL_MARKERS: Array<{ id: string; label: string; tone: Tone }> = [
  { id: "burn-acceleration", label: "Burn acceleration relative to ARR scale", tone: "risk" },
  { id: "margin-volatility", label: "Margin volatility sensitivity", tone: "risk" },
  { id: "capital-dependency", label: "Capital dependency within 9–12 months", tone: "info" },
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
        <div className={styles.panelDots}>
          <span /><span /><span />
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>STRUCTURAL METRICS</div>
        <div className={styles.kvGrid}>
          <div className={styles.kvRow}><div className={styles.k}>Revenue</div><div className={styles.v}>{fmtUsdM(revenue)}</div></div>
          <div className={styles.kvRow}><div className={styles.k}>Margin</div><div className={styles.v}>{margin.toFixed(0)}%</div></div>
          <div className={styles.kvRow}><div className={styles.k}>Runway</div><div className={styles.v}>{Math.round(runway)} months</div></div>
          <div className={styles.kvRow}><div className={styles.k}>Burn Ratio</div><div className={styles.v}>{ctx ? ctx.derived.burnRatio.toFixed(1) : "—"}x</div></div>
          <div className={styles.kvRow}><div className={styles.k}>Risk Index</div><div className={styles.v}>{Math.round(survivalBaselinePct)}%</div></div>
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
        <div className={styles.storyText}>
          {runway < 12
            ? "Liquidity headroom is narrowing. Burn intensity is compressing optionality faster than revenue scale can absorb."
            : "Runway is supported by current capital base. Composition quality depends on margin stability and burn proportionality."}
        </div>
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
        <div className={styles.storyText}>
          Each peak maps to Revenue → Margin → Runway → Burn → Efficiency. Valleys indicate structural fragility. Confidence width reflects certainty.
        </div>
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


