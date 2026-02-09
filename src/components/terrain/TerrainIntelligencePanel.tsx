// src/components/terrain/TerrainIntelligencePanel.tsx
// STRATFIT — Active Intelligence Panel (Right) for Terrain
// Shows ALL 7 mountain metrics + Summary + Key Signals + Commentary
// Each metric matches a zone on the mountain visualization.
// Institutional. Calm. No emojis. No hype.

import React, { useMemo } from "react";

interface KPIs {
  runway?: { value: number; display?: string };
  riskScore?: { value: number; display?: string };
  riskIndex?: { value: number; display?: string };
  momentum?: { value: number; display?: string };
  burnQuality?: { value: number; display?: string };
  cashPosition?: { value: number; display?: string };
  enterpriseValue?: { value: number; display?: string };
  ltvCac?: { value: number; display?: string };
  cacPayback?: { value: number; display?: string };
  growthStress?: { value: number; display?: string };
  arrGrowthPct?: { value: number; display?: string };
  arrCurrent?: { value: number; display?: string };
  arrNext12?: { value: number; display?: string };
  earningsPower?: { value: number; display?: string };
  qualityScore?: { value: number; display?: string };
}

interface TerrainIntelligencePanelProps {
  kpis: KPIs | null | undefined;
  intelligenceEnabled: boolean;
}

// Section header style
const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(0, 224, 255, 0.5)",
  marginBottom: 8,
  fontFamily: "'Inter', sans-serif",
};

const sectionDividerStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  margin: "12px 0",
};

const insightTextStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.55,
  color: "rgba(255, 255, 255, 0.6)",
  fontFamily: "'Inter', sans-serif",
  margin: 0,
};

const metricRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "4px 0",
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "rgba(255, 255, 255, 0.4)",
  fontFamily: "'Inter', sans-serif",
};

const metricValueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "rgba(255, 255, 255, 0.85)",
  fontFamily: "'JetBrains Mono', monospace",
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.01em",
};

const bulletStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.55,
  color: "rgba(255, 255, 255, 0.55)",
  fontFamily: "'Inter', sans-serif",
  paddingLeft: 12,
  position: "relative" as const,
  marginBottom: 4,
};

function formatCash(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function getStatusColor(value: number, thresholds: { good: number; warn: number; invert?: boolean }): string {
  const { good, warn, invert } = thresholds;
  if (invert) {
    // Lower is better (e.g. risk)
    if (value <= good) return "rgba(52, 211, 153, 0.85)";
    if (value <= warn) return "rgba(251, 191, 36, 0.85)";
    return "rgba(248, 113, 113, 0.85)";
  }
  // Higher is better
  if (value >= good) return "rgba(52, 211, 153, 0.85)";
  if (value >= warn) return "rgba(251, 191, 36, 0.85)";
  return "rgba(248, 113, 113, 0.85)";
}

const TerrainIntelligencePanel: React.FC<TerrainIntelligencePanelProps> = ({
  kpis,
  intelligenceEnabled,
}) => {
  // ── Extract all metrics ────────────────────────────────────────────
  const runway = kpis?.runway?.value ?? 24;
  const riskScore = kpis?.riskScore?.value ?? 30;
  const riskIndex = kpis?.riskIndex?.value ?? 70;
  const burn = kpis?.burnQuality?.value ?? 50;
  const cashPosition = kpis?.cashPosition?.value ?? 4_000_000;
  const ev = kpis?.enterpriseValue?.value ?? 0;
  const ltvCac = kpis?.ltvCac?.value ?? 3;
  const qualityScore = kpis?.qualityScore?.value ?? 0.65;
  const arrGrowth = kpis?.arrGrowthPct?.value ?? 0;
  const arrCurrent = kpis?.arrCurrent?.value ?? 0;
  const earningsPower = kpis?.earningsPower?.value ?? 0;
  const survivalPct = Math.round(Math.max(0, Math.min(100, 100 - riskScore)));
  const cacPayback = kpis?.cacPayback?.value ?? 18;

  // ── 7 Mountain Metrics (match zone labels on mountain) ────────────
  const mountainMetrics = useMemo(() => [
    {
      label: "Revenue",
      value: arrCurrent > 0 ? formatCash(arrCurrent) : kpis?.arrCurrent?.display ?? "—",
      color: getStatusColor(arrGrowth, { good: 20, warn: 5 }),
      sub: arrGrowth > 0 ? `+${arrGrowth.toFixed(0)}% YoY` : arrGrowth === 0 ? "Flat" : `${arrGrowth.toFixed(0)}% YoY`,
    },
    {
      label: "Margin",
      value: earningsPower > 0 ? `${earningsPower.toFixed(0)}%` : kpis?.earningsPower?.display ?? "—",
      color: getStatusColor(earningsPower, { good: 60, warn: 30 }),
      sub: earningsPower >= 60 ? "Healthy" : earningsPower >= 30 ? "Moderate" : "Compressed",
    },
    {
      label: "Runway",
      value: `${runway}mo`,
      color: getStatusColor(runway, { good: 24, warn: 12 }),
      sub: runway >= 24 ? "Extended" : runway >= 12 ? "Adequate" : "Critical",
    },
    {
      label: "Cash",
      value: formatCash(cashPosition),
      color: getStatusColor(cashPosition, { good: 3_000_000, warn: 1_000_000 }),
      sub: "Position",
    },
    {
      label: "Burn",
      value: burn > 0 ? `${burn.toFixed(0)}/100` : "—",
      color: getStatusColor(burn, { good: 60, warn: 35 }),
      sub: burn >= 60 ? "Disciplined" : burn >= 35 ? "Moderate" : "Aggressive",
    },
    {
      label: "LTV/CAC",
      value: `${ltvCac.toFixed(1)}x`,
      color: getStatusColor(ltvCac, { good: 3, warn: 1.5 }),
      sub: `${Math.round(cacPayback)}mo payback`,
    },
    {
      label: "Risk",
      value: `${survivalPct}%`,
      color: getStatusColor(riskScore, { good: 30, warn: 60, invert: true }),
      sub: riskScore < 30 ? "Low exposure" : riskScore < 60 ? "Moderate" : "Elevated",
    },
  ], [arrCurrent, arrGrowth, earningsPower, runway, cashPosition, burn, ltvCac, cacPayback, survivalPct, riskScore, kpis]);

  // Summary text
  const summaryText = useMemo(() => {
    if (runway >= 24 && riskScore < 40) {
      return "Operational posture is stable. Capital reserves support continued execution with low structural risk.";
    } else if (runway >= 12) {
      return "Moderate operational position. Capital efficiency and risk management require active monitoring.";
    } else {
      return "Near-term capital pressure detected. Runway compression requires immediate strategic response.";
    }
  }, [runway, riskScore]);

  // Key signals
  const signals = useMemo(() => {
    const items: { label: string; status: "positive" | "neutral" | "warning" }[] = [];
    
    items.push({
      label: runway >= 24 ? "Runway above 24mo threshold" : runway >= 12 ? "Runway within operational bounds" : "Runway below critical threshold",
      status: runway >= 24 ? "positive" : runway >= 12 ? "neutral" : "warning",
    });
    items.push({
      label: riskScore < 35 ? "Risk exposure contained" : riskScore < 65 ? "Moderate risk sensitivity" : "Elevated downside exposure",
      status: riskScore < 35 ? "positive" : riskScore < 65 ? "neutral" : "warning",
    });
    items.push({
      label: ltvCac >= 3 ? "Customer economics efficient" : "Customer acquisition cost-intensive",
      status: ltvCac >= 3 ? "positive" : "warning",
    });
    if (arrGrowth > 20) {
      items.push({ label: "Revenue trajectory shows strong momentum", status: "positive" });
    } else if (arrGrowth < 0) {
      items.push({ label: "Revenue contraction detected", status: "warning" });
    }
    if (cashPosition < 1_000_000) {
      items.push({ label: "Cash position below critical reserve", status: "warning" });
    }

    return items;
  }, [runway, riskScore, ltvCac, arrGrowth, cashPosition]);

  // Commentary
  const commentary = useMemo(() => {
    const lines: string[] = [];
    if (burn >= 60) {
      lines.push("Burn discipline supports strategic optionality.");
    } else {
      lines.push("Burn rate warrants attention relative to revenue velocity.");
    }
    if (qualityScore >= 0.7) {
      lines.push("Quality composite indicates institutional-grade operational health.");
    } else if (qualityScore >= 0.4) {
      lines.push("Quality composite is moderate. Targeted improvements recommended.");
    }
    return lines;
  }, [burn, qualityScore]);

  const statusColor = (status: string) => {
    if (status === "positive") return "rgba(16, 185, 129, 0.7)";
    if (status === "warning") return "rgba(239, 68, 68, 0.7)";
    return "rgba(255, 255, 255, 0.35)";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "14px 16px",
        overflowY: "auto",
        background: "rgba(255, 255, 255, 0.02)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* ═══ MOUNTAIN METRICS — Matches the 7 zones ═══ */}
      <div>
        <div style={sectionHeaderStyle}>Mountain Metrics</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {mountainMetrics.map((m) => (
            <div key={m.label} style={metricRowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {/* Color dot matching zone */}
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: m.color,
                  flexShrink: 0,
                }} />
                <span style={metricLabelStyle}>{m.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={metricValueStyle}>{m.value}</span>
                <span style={{
                  fontSize: 9,
                  color: "rgba(255, 255, 255, 0.3)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}>
                  {m.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionDividerStyle} />

      {/* SUMMARY */}
      <div>
        <div style={sectionHeaderStyle}>Summary</div>
        <p style={insightTextStyle}>{summaryText}</p>
      </div>

      <div style={sectionDividerStyle} />

      {/* KEY SIGNALS */}
      <div>
        <div style={sectionHeaderStyle}>Key Signals</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {signals.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: statusColor(s.status),
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 11.5,
                color: "rgba(255, 255, 255, 0.6)",
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.4,
              }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionDividerStyle} />

      {/* SYSTEM COMMENTARY */}
      <div>
        <div style={sectionHeaderStyle}>System Commentary</div>
        {commentary.map((line, i) => (
          <p key={i} style={{ ...insightTextStyle, marginBottom: 4 }}>{line}</p>
        ))}
      </div>

      {/* WHAT THIS VIEW SHOWS — only when Intelligence ON */}
      {intelligenceEnabled && (
        <>
          <div style={sectionDividerStyle} />
          <div>
            <div style={sectionHeaderStyle}>What This View Shows</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={bulletStyle}>
                <span style={{ position: "absolute", left: 0, color: "rgba(0,224,255,0.4)" }}>–</span>
                Each peak maps to a metric zone: Revenue → Margin → Runway → Cash → Burn → Efficiency → Risk.
              </div>
              <div style={bulletStyle}>
                <span style={{ position: "absolute", left: 0, color: "rgba(0,224,255,0.4)" }}>–</span>
                Height reflects strength. Taller peaks indicate stronger performance.
              </div>
              <div style={bulletStyle}>
                <span style={{ position: "absolute", left: 0, color: "rgba(0,224,255,0.4)" }}>–</span>
                Valleys indicate areas of weakness or structural vulnerability.
              </div>
              <div style={bulletStyle}>
                <span style={{ position: "absolute", left: 0, color: "rgba(0,224,255,0.4)" }}>–</span>
                The dashed horizon line shows the sustainability threshold.
              </div>
              <div style={bulletStyle}>
                <span style={{ position: "absolute", left: 0, color: "rgba(0,224,255,0.4)" }}>–</span>
                Confidence band width reflects uncertainty across simulated futures.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TerrainIntelligencePanel;
