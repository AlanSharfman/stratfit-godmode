import React from "react";
import { useInitiateStore } from "@/state/initiateStore";

const FONT = "'Inter', system-ui, sans-serif";
const CYAN = "rgba(34, 211, 238, 0.85)";
const GLASS_BG = "rgba(0, 0, 0, 0.35)";
const GLASS_BORDER = "1px solid rgba(182, 228, 255, 0.08)";
const INPUT_BG = "rgba(6, 12, 24, 0.6)";
const INPUT_BORDER = "1px solid rgba(34, 211, 238, 0.12)";
const INPUT_FOCUS_BORDER = "1px solid rgba(34, 211, 238, 0.4)";

const S: Record<string, React.CSSProperties> = {
  root: {
    width: "100%",
    maxWidth: 1100,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 4,
  },

  logoImg: {
    height: 32,
    width: "auto",
    display: "block",
    flexShrink: 0,
  },

  brandGroup: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  },

  brandName: {
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: "2.5px",
    color: "#fff",
    fontFamily: FONT,
  },

  title: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "0.06em",
    color: "#fff",
    fontFamily: FONT,
  },

  subtitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: CYAN,
    fontFamily: FONT,
  },

  divider: {
    width: 1,
    height: 22,
    background: "rgba(182, 228, 255, 0.12)",
    flexShrink: 0,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },

  card: {
    background: GLASS_BG,
    border: GLASS_BORDER,
    borderRadius: 10,
    padding: "20px 24px",
    backdropFilter: "blur(12px)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  cardFull: {
    background: GLASS_BG,
    border: GLASS_BORDER,
    borderRadius: 10,
    padding: "20px 24px",
    backdropFilter: "blur(12px)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    gridColumn: "1 / -1",
  },

  cardTitle: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    color: "rgba(34, 211, 238, 0.5)",
    fontFamily: FONT,
    marginBottom: 4,
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: "rgba(226, 240, 255, 0.6)",
    fontFamily: FONT,
  },

  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 6,
    border: INPUT_BORDER,
    background: INPUT_BG,
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: FONT,
    outline: "none",
    transition: "border 200ms ease, background 200ms ease",
    boxSizing: "border-box" as const,
  },

  textarea: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 6,
    border: INPUT_BORDER,
    background: INPUT_BG,
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: FONT,
    outline: "none",
    transition: "border 200ms ease, background 200ms ease",
    boxSizing: "border-box" as const,
    minHeight: 80,
    resize: "vertical" as const,
  },
};

export default function InitiatePanel() {
  const {
    companyName,
    timeHorizonMonths,
    baselineRevenue,
    baselineRunwayMonths,
    objective,
    setField,
  } = useInitiateStore();

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <img src="/stratfit-logo.png" alt="STRATFIT" style={S.logoImg} />
        <div style={S.brandGroup}>
          <span style={S.brandName}>STRATFIT</span>
          <div style={S.divider} />
          <span style={S.subtitle}>Initiate</span>
        </div>
      </div>

      {/* 2-column landscape grid */}
      <div style={S.grid}>
        {/* ── Left card: Identity ── */}
        <div style={S.card}>
          <span style={S.cardTitle}>Identity</span>

          <div style={S.fieldGroup}>
            <label style={S.label}>Company Name</label>
            <input
              style={S.input}
              value={companyName}
              onChange={(e) => setField("companyName", e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Time Horizon (months)</label>
            <input
              style={S.input}
              type="number"
              value={timeHorizonMonths}
              onChange={(e) => setField("timeHorizonMonths", Number(e.target.value))}
              placeholder="24"
            />
          </div>
        </div>

        {/* ── Right card: Financials ── */}
        <div style={S.card}>
          <span style={S.cardTitle}>Financials</span>

          <div style={S.fieldGroup}>
            <label style={S.label}>Baseline Revenue</label>
            <input
              style={S.input}
              type="number"
              value={baselineRevenue}
              onChange={(e) => setField("baselineRevenue", Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Runway (months)</label>
            <input
              style={S.input}
              type="number"
              value={baselineRunwayMonths}
              onChange={(e) => setField("baselineRunwayMonths", Number(e.target.value))}
              placeholder="18"
            />
          </div>
        </div>

        {/* ── Full-width card: Objective ── */}
        <div style={S.cardFull}>
          <span style={S.cardTitle}>Strategic Objective</span>

          <div style={S.fieldGroup}>
            <label style={S.label}>Objective</label>
            <textarea
              style={S.textarea}
              value={objective}
              onChange={(e) => setField("objective", e.target.value)}
              placeholder="Describe your strategic goal…"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
