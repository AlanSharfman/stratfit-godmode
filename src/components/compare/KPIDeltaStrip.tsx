import type { MetricsResult } from "@/logic/calculateMetrics";

interface KPIDeltaStripProps {
  leftMetrics: MetricsResult | null;
  rightMetrics: MetricsResult | null;
  leftName?: string;
  rightName?: string;
}

function fmtDelta(left: number | undefined, right: number | undefined): { text: string; positive: boolean | null } {
  const l = left ?? 0;
  const r = right ?? 0;
  const d = r - l;
  if (Math.abs(d) < 0.01) return { text: "—", positive: null };
  return { text: (d > 0 ? "+" : "") + d.toFixed(1), positive: d > 0 };
}

export default function KPIDeltaStrip({ leftMetrics, rightMetrics, leftName, rightName }: KPIDeltaStripProps) {
  if (!leftMetrics || !rightMetrics) return null;

  const kpis = [
    { label: "Momentum", left: leftMetrics.momentum, right: rightMetrics.momentum, higherIsBetter: true },
    { label: "Earnings Power", left: leftMetrics.earningsPower, right: rightMetrics.earningsPower, higherIsBetter: true },
    { label: "Runway", left: leftMetrics.runway, right: rightMetrics.runway, higherIsBetter: true },
    { label: "Enterprise Value", left: leftMetrics.enterpriseValue, right: rightMetrics.enterpriseValue, higherIsBetter: true },
    { label: "Risk Index", left: leftMetrics.riskIndex, right: rightMetrics.riskIndex, higherIsBetter: false },
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      padding: "10px 24px",
      borderTop: "1px solid rgba(0,229,255,0.12)",
      borderBottom: "1px solid rgba(0,229,255,0.12)",
      background: "rgba(0,229,255,0.03)",
      fontSize: 11,
      letterSpacing: "0.08em",
    }}>
      {leftName && rightName && (
        <span style={{ color: "rgba(255,255,255,0.4)", marginRight: 20, fontSize: 10, textTransform: "uppercase" }}>
          {leftName} → {rightName}
        </span>
      )}
      {kpis.map(({ label, left, right, higherIsBetter }) => {
        const { text, positive } = fmtDelta(left, right);
        const isGood = positive === null ? null : (higherIsBetter ? positive : !positive);
        const color = isGood === null ? "rgba(255,255,255,0.4)" : isGood ? "#00FFC2" : "#FF4D6D";
        return (
          <div key={label} style={{ marginRight: 28, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
            <span style={{ color, fontWeight: 600, fontSize: 13 }}>{text}</span>
          </div>
        );
      })}
    </div>
  );
}
