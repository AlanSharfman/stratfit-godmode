// src/components/terrain/TerrainIntelligencePanel.tsx
// STRATFIT — Active Intelligence Panel (Right) for Terrain
// Sections: SUMMARY · KEY SIGNALS · SYSTEM COMMENTARY · WHAT THIS VIEW SHOWS
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

const keyNumberStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#00E0FF",
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "-0.02em",
};

const keyLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(255, 255, 255, 0.35)",
  marginTop: 2,
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

const TerrainIntelligencePanel: React.FC<TerrainIntelligencePanelProps> = ({
  kpis,
  intelligenceEnabled,
}) => {
  const runway = kpis?.runway?.value ?? 24;
  const riskScore = kpis?.riskScore?.value ?? 30;
  const burn = kpis?.burnQuality?.value ?? 50;
  const ev = kpis?.enterpriseValue?.value ?? 50;
  const ltvCac = kpis?.ltvCac?.value ?? 3;
  const qualityScore = kpis?.qualityScore?.value ?? 0.65;
  const arrGrowth = kpis?.arrGrowthPct?.value ?? 0;

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

    return items;
  }, [runway, riskScore, ltvCac, arrGrowth]);

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
        padding: "16px 18px",
        overflowY: "auto",
        background: "rgba(255, 255, 255, 0.02)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* SUMMARY */}
      <div>
        <div style={sectionHeaderStyle}>Summary</div>
        <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
          <div>
            <div style={keyNumberStyle}>{runway}<span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 3 }}>mo</span></div>
            <div style={keyLabelStyle}>Runway</div>
          </div>
          <div>
            <div style={keyNumberStyle}>{Math.round(qualityScore * 100)}<span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 2 }}>%</span></div>
            <div style={keyLabelStyle}>Quality</div>
          </div>
        </div>
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
                Terrain represents the distribution of probabilistic futures.
              </div>
              <div style={bulletStyle}>
                <span style={{ position: "absolute", left: 0, color: "rgba(0,224,255,0.4)" }}>–</span>
                Height reflects outcome strength; spread reflects uncertainty.
              </div>
              <div style={bulletStyle}>
                <span style={{ position: "absolute", left: 0, color: "rgba(0,224,255,0.4)" }}>–</span>
                Risk density highlights where downside scenarios cluster.
              </div>
              <div style={bulletStyle}>
                <span style={{ position: "absolute", left: 0, color: "rgba(0,224,255,0.4)" }}>–</span>
                Sensitivity nodes indicate regions of high model sensitivity.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TerrainIntelligencePanel;





