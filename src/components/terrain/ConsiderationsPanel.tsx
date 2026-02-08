// src/components/terrain/ConsiderationsPanel.tsx
// STRATFIT — Considerations Panel (exactly 6 lines, typewriter effect)
// Deterministic rule-based generator from engine outputs.
// No emojis. No "you should". No exclamation. No fluff.

import React, { useMemo } from "react";
import { useTypewriterLines } from "./useTypewriterLines";
import { considerationsTypewriterEnabled } from "@/config/featureFlags";

interface KPIs {
  runway?: { value: number };
  riskScore?: { value: number };
  riskIndex?: { value: number };
  momentum?: { value: number };
  burnQuality?: { value: number };
  cashPosition?: { value: number };
  enterpriseValue?: { value: number };
  ltvCac?: { value: number };
  cacPayback?: { value: number };
  growthStress?: { value: number };
  arrGrowthPct?: { value: number };
}

interface ConsiderationsPanelProps {
  kpis: KPIs | null | undefined;
  snapshotKey: string;
}

/**
 * Generate exactly 6 consideration lines from KPI outputs.
 * Deterministic. Calm. Institutional. No hype.
 */
function generateConsiderations(kpis: KPIs): string[] {
  const runway = kpis.runway?.value ?? 24;
  const riskScore = kpis.riskScore?.value ?? 30;
  const momentum = kpis.momentum?.value ?? 50;
  const burn = kpis.burnQuality?.value ?? 50;
  const cash = kpis.cashPosition?.value ?? 4_000_000;
  const ev = kpis.enterpriseValue?.value ?? 50;
  const ltvCac = kpis.ltvCac?.value ?? 3;
  const cacPayback = kpis.cacPayback?.value ?? 18;
  const growthStress = kpis.growthStress?.value ?? 0.3;
  const arrGrowth = kpis.arrGrowthPct?.value ?? 0;

  const lines: string[] = [];

  // 1. Runway assessment
  if (runway >= 24) {
    lines.push(`Runway of ${runway} months provides sufficient operating margin for strategic execution.`);
  } else if (runway >= 12) {
    lines.push(`Runway of ${runway} months requires active monitoring. Capital planning advised within 6 months.`);
  } else {
    lines.push(`Runway of ${runway} months indicates near-term capital constraint. Immediate action recommended.`);
  }

  // 2. Risk profile
  if (riskScore < 30) {
    lines.push("Risk exposure remains contained. Defensive posture is stable across key vectors.");
  } else if (riskScore < 60) {
    lines.push(`Risk exposure at ${riskScore}/100 suggests moderate sensitivity to market and execution variables.`);
  } else {
    lines.push(`Elevated risk score of ${riskScore}/100. Downside scenarios carry material probability weight.`);
  }

  // 3. Growth quality
  if (ltvCac >= 4 && cacPayback <= 15) {
    lines.push("Customer acquisition economics are efficient. LTV/CAC ratio supports sustainable scaling.");
  } else if (ltvCac >= 2) {
    lines.push(`LTV/CAC at ${ltvCac.toFixed(1)}x with ${Math.round(cacPayback)}mo payback. Growth is funded but capital-intensive.`);
  } else {
    lines.push("Customer acquisition efficiency is below institutional thresholds. Unit economics require correction.");
  }

  // 4. Momentum/Revenue
  if (arrGrowth > 30) {
    lines.push("Revenue trajectory shows strong upward momentum. Sustaining this requires operational capacity alignment.");
  } else if (arrGrowth > 0) {
    lines.push("Revenue growth is positive but moderate. Demand-side acceleration may improve valuation trajectory.");
  } else {
    lines.push("Revenue trajectory is flat or contracting. Pricing power and demand levers warrant attention.");
  }

  // 5. Burn discipline
  if (burn >= 60) {
    lines.push("Burn quality indicates disciplined capital deployment. Cash efficiency supports longer-term optionality.");
  } else if (burn >= 35) {
    lines.push("Burn rate is within acceptable bounds but leaves limited margin for execution variance.");
  } else {
    lines.push("Burn profile is aggressive relative to revenue generation. Runway compression is a structural risk.");
  }

  // 6. Valuation / overall
  if (growthStress < 0.3) {
    lines.push("Growth fragility is low. The model projects resilient outcomes across most simulated futures.");
  } else if (growthStress < 0.6) {
    lines.push("Growth fragility is moderate. Scenario dispersion widens under stress. Monitor sensitivity nodes.");
  } else {
    lines.push("Growth fragility is elevated. Probabilistic outcomes show significant variance in downside tail.");
  }

  return lines.slice(0, 6);
}

const ConsiderationsPanel: React.FC<ConsiderationsPanelProps> = ({
  kpis,
  snapshotKey,
}) => {
  const lines = useMemo(
    () => generateConsiderations(kpis ?? {}),
    [kpis]
  );

  const displayed = useTypewriterLines(lines, snapshotKey, {
    charSpeed: 20,
    lineStagger: 250,
    enabled: considerationsTypewriterEnabled,
  });

  return (
    <div style={{
      padding: "16px 20px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color: "rgba(255,255,255,0.3)",
        marginBottom: 12,
        fontFamily: "'Inter', sans-serif",
      }}>
        Considerations
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {displayed.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.78)",
              fontFamily: "'JetBrains Mono', 'IBM Plex Mono', 'SF Mono', monospace",
              minHeight: 20,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <span style={{
              color: "rgba(0,224,255,0.4)",
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              minWidth: 16,
              marginTop: 3,
            }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsiderationsPanel;





