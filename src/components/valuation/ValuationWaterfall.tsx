// src/components/valuation/ValuationWaterfall.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Waterfall Chart (Phase V-4)
//
// CFO-grade SVG waterfall: Baseline EV → sequential driver deltas → Scenario EV
// Explains WHY enterprise value changed from Baseline to Active Scenario.
//
// No charting library. Pure SVG, consistent with EV Distribution chart (V-3A).
// No UI-side valuation math — formatting only.
// Reads from WaterfallPayload output of selectWaterfallFromSimulation.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from "react";
import type { WaterfallPayload, WaterfallStep } from "@/valuation/valuationTypes";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  waterfall: WaterfallPayload | null;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  step: WaterfallStep | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const SVG_WIDTH = 600;
const SVG_HEIGHT = 280;
const CHART_LEFT = 12;
const CHART_RIGHT = SVG_WIDTH - 12;
const CHART_WIDTH = CHART_RIGHT - CHART_LEFT;
const BAR_TOP = 60;
const BAR_BOTTOM = 220;
const BAR_HEIGHT = BAR_BOTTOM - BAR_TOP;
const LABEL_Y = 240;
const VALUE_Y = 256;
const CONNECTOR_Y_OFFSET = 0;

const COLORS = {
  baseline: "#475569",       // slate-500
  baselineBorder: "#22d3ee", // cyan hairline
  positive: "#34d399",       // emerald
  negative: "#f87171",       // red
  flat: "#64748b",           // muted slate
  scenario: "#0ea5e9",       // sky-500
  scenarioBorder: "#22d3ee", // cyan hairline
  connector: "rgba(255, 255, 255, 0.1)",
  text: "rgba(255, 255, 255, 0.75)",
  textMuted: "rgba(255, 255, 255, 0.4)",
  textValue: "rgba(255, 255, 255, 0.9)",
  gridLine: "rgba(255, 255, 255, 0.04)",
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS — formatting only, zero computation
// ═══════════════════════════════════════════════════════════════════════════

function fmtM(v: number): string {
  if (!isFinite(v) || v === 0) return "$0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtDelta(v: number): string {
  if (!isFinite(v) || v === 0) return "$0";
  const sign = v > 0 ? "+" : "";
  return `${sign}${fmtM(v)}`;
}

function fmtPct(v: number): string {
  if (!isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${(v * 100).toFixed(1)}%`;
}

function stepColor(dir: "up" | "down" | "flat"): string {
  if (dir === "up") return COLORS.positive;
  if (dir === "down") return COLORS.negative;
  return COLORS.flat;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ValuationWaterfall({ waterfall }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    step: null,
  });

  // ── Empty state ──
  if (
    !waterfall ||
    waterfall.baselineEV == null ||
    waterfall.scenarioEV == null
  ) {
    return (
      <div style={S.empty}>
        <p style={S.emptyTitle}>—</p>
        <p style={S.emptyHint}>
          Run baseline + scenario to generate valuation attribution.
        </p>
      </div>
    );
  }

  const { baselineEV, scenarioEV, steps, notes } = waterfall;
  const totalDelta = scenarioEV - baselineEV;
  const totalDeltaPct = baselineEV !== 0 ? totalDelta / Math.abs(baselineEV) : 0;

  // ── Compute bar geometry ──
  // Total columns = 1 (baseline) + steps.length + 1 (scenario) = steps.length + 2
  const colCount = steps.length + 2;
  const colWidth = CHART_WIDTH / colCount;
  const barWidth = Math.min(colWidth * 0.6, 52);

  // Value range: we need to fit all running totals
  const runningTotals = useMemo(() => {
    const totals: number[] = [baselineEV];
    let running = baselineEV;
    for (const step of steps) {
      running += step.delta;
      totals.push(running);
    }
    totals.push(scenarioEV);
    return totals;
  }, [baselineEV, scenarioEV, steps]);

  const minVal = Math.min(...runningTotals, 0);
  const maxVal = Math.max(...runningTotals);
  const valRange = maxVal - minVal || 1;

  // Map a value to Y coordinate (higher value = higher on screen = lower Y)
  const valToY = useCallback(
    (v: number) => {
      const frac = (v - minVal) / valRange;
      return BAR_BOTTOM - frac * BAR_HEIGHT;
    },
    [minVal, valRange],
  );

  // ── Build bar segments ──
  type BarSegment = {
    x: number;
    topY: number;
    bottomY: number;
    width: number;
    color: string;
    strokeColor?: string;
    label: string;
    valueLabel: string;
    step?: WaterfallStep;
    isEndpoint?: boolean;
  };

  const bars = useMemo<BarSegment[]>(() => {
    const result: BarSegment[] = [];

    // Baseline bar
    const baseX = CHART_LEFT + colWidth * 0.5 - barWidth / 2;
    result.push({
      x: baseX,
      topY: valToY(baselineEV),
      bottomY: valToY(0),
      width: barWidth,
      color: COLORS.baseline,
      strokeColor: COLORS.baselineBorder,
      label: "Baseline",
      valueLabel: fmtM(baselineEV),
      isEndpoint: true,
    });

    // Step bars (waterfall bridge segments)
    let running = baselineEV;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const prevRunning = running;
      running += step.delta;

      const colIndex = i + 1;
      const sx = CHART_LEFT + colWidth * (colIndex + 0.5) - barWidth / 2;

      const topVal = Math.max(prevRunning, running);
      const bottomVal = Math.min(prevRunning, running);

      result.push({
        x: sx,
        topY: valToY(topVal),
        bottomY: valToY(bottomVal),
        width: barWidth,
        color: stepColor(step.direction),
        label: step.label,
        valueLabel: fmtDelta(step.delta),
        step,
      });
    }

    // Scenario bar
    const scenX = CHART_LEFT + colWidth * (colCount - 0.5) - barWidth / 2;
    result.push({
      x: scenX,
      topY: valToY(scenarioEV),
      bottomY: valToY(0),
      width: barWidth,
      color: COLORS.scenario,
      strokeColor: COLORS.scenarioBorder,
      label: "Scenario",
      valueLabel: fmtM(scenarioEV),
      isEndpoint: true,
    });

    return result;
  }, [baselineEV, scenarioEV, steps, colWidth, barWidth, colCount, valToY]);

  // ── Connector lines (running total between bars) ──
  const connectors = useMemo(() => {
    const lines: { x1: number; x2: number; y: number }[] = [];
    let running = baselineEV;

    for (let i = 0; i < steps.length; i++) {
      const fromBar = bars[i]; // Previous bar
      const toBar = bars[i + 1]; // Current step bar
      const connY = valToY(running);

      lines.push({
        x1: fromBar.x + fromBar.width,
        x2: toBar.x,
        y: connY + CONNECTOR_Y_OFFSET,
      });

      running += steps[i].delta;
    }

    // Last step → scenario connector
    if (steps.length > 0) {
      const lastStepBar = bars[bars.length - 2];
      const scenBar = bars[bars.length - 1];
      const connY = valToY(running);
      lines.push({
        x1: lastStepBar.x + lastStepBar.width,
        x2: scenBar.x,
        y: connY + CONNECTOR_Y_OFFSET,
      });
    }

    return lines;
  }, [bars, steps, baselineEV, valToY]);

  // ── Tooltip handlers ──
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, bar: BarSegment) => {
      if (!bar.step) return;
      const rect = (e.currentTarget as SVGElement).closest("svg")?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 12,
        step: bar.step,
      });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!tooltip.visible) return;
      const rect = (e.currentTarget as SVGElement).closest("svg")?.getBoundingClientRect();
      if (!rect) return;
      setTooltip((prev) => ({
        ...prev,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 12,
      }));
    },
    [tooltip.visible],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0, step: null });
  }, []);

  // ── Direction icon ──
  const deltaDirection: "up" | "down" | "flat" =
    totalDelta > 0 ? "up" : totalDelta < 0 ? "down" : "flat";

  return (
    <div style={S.wrapper}>
      {/* ── Header Row ── */}
      <div style={S.headerRow}>
        <div style={S.headerCell}>
          <span style={S.headerLabel}>Baseline EV</span>
          <span style={S.headerValue}>{fmtM(baselineEV)}</span>
        </div>
        <div style={S.headerDelta}>
          <span style={S.headerLabel}>Δ</span>
          <span
            style={{
              ...S.headerValue,
              color: deltaDirection === "up" ? COLORS.positive : deltaDirection === "down" ? COLORS.negative : COLORS.text,
            }}
          >
            {fmtDelta(totalDelta)} ({fmtPct(totalDeltaPct)})
          </span>
        </div>
        <div style={S.headerCell}>
          <span style={S.headerLabel}>Scenario EV</span>
          <span style={{ ...S.headerValue, color: "#22d3ee" }}>
            {fmtM(scenarioEV)}
          </span>
        </div>
        {notes?.method && (
          <div style={S.methodTag}>
            {notes.method}
            {notes.horizonYears != null ? ` · ${notes.horizonYears}Y` : ""}
          </div>
        )}
      </div>

      {/* ── SVG Waterfall ── */}
      <div style={S.chartContainer}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width="100%"
          style={{ display: "block", maxWidth: SVG_WIDTH }}
        >
          {/* Background grid lines */}
          {[0.25, 0.5, 0.75].map((frac) => {
            const y = BAR_BOTTOM - frac * BAR_HEIGHT;
            return (
              <line
                key={frac}
                x1={CHART_LEFT}
                x2={CHART_RIGHT}
                y1={y}
                y2={y}
                stroke={COLORS.gridLine}
                strokeWidth={1}
              />
            );
          })}

          {/* Zero line */}
          <line
            x1={CHART_LEFT}
            x2={CHART_RIGHT}
            y1={valToY(0)}
            y2={valToY(0)}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Connector lines */}
          {connectors.map((c, i) => (
            <line
              key={`conn-${i}`}
              x1={c.x1}
              x2={c.x2}
              y1={c.y}
              y2={c.y}
              stroke={COLORS.connector}
              strokeWidth={1}
              strokeDasharray="3 2"
            />
          ))}

          {/* Bars */}
          {bars.map((bar, i) => {
            const barH = Math.max(bar.bottomY - bar.topY, 2);
            return (
              <g
                key={i}
                onMouseEnter={(e) => handleMouseEnter(e, bar)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: bar.step ? "pointer" : "default" }}
              >
                {/* Bar fill */}
                <rect
                  x={bar.x}
                  y={bar.topY}
                  width={bar.width}
                  height={barH}
                  rx={3}
                  fill={bar.color}
                  opacity={bar.isEndpoint ? 0.85 : 0.75}
                />
                {/* Endpoint stroke highlight */}
                {bar.strokeColor && (
                  <rect
                    x={bar.x}
                    y={bar.topY}
                    width={bar.width}
                    height={barH}
                    rx={3}
                    fill="none"
                    stroke={bar.strokeColor}
                    strokeWidth={1}
                    opacity={0.4}
                  />
                )}
                {/* Label */}
                <text
                  x={bar.x + bar.width / 2}
                  y={LABEL_Y}
                  textAnchor="middle"
                  fill={COLORS.textMuted}
                  fontSize={9}
                  fontWeight={500}
                  letterSpacing="0.03em"
                >
                  {bar.label}
                </text>
                {/* Value */}
                <text
                  x={bar.x + bar.width / 2}
                  y={VALUE_Y}
                  textAnchor="middle"
                  fill={bar.step ? stepColor(bar.step.direction) : COLORS.textValue}
                  fontSize={10}
                  fontWeight={600}
                >
                  {bar.valueLabel}
                </text>

                {/* Direction arrow on step bars */}
                {bar.step && bar.step.direction !== "flat" && (
                  <text
                    x={bar.x + bar.width / 2}
                    y={bar.topY - 6}
                    textAnchor="middle"
                    fill={stepColor(bar.step.direction)}
                    fontSize={10}
                  >
                    {bar.step.direction === "up" ? "▲" : "▼"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Tooltip ── */}
        {tooltip.visible && tooltip.step && (
          <div
            style={{
              ...S.tooltip,
              left: tooltip.x,
              top: tooltip.y,
            }}
          >
            <span style={S.tooltipLabel}>{tooltip.step.label}</span>
            <span
              style={{
                ...S.tooltipValue,
                color: stepColor(tooltip.step.direction),
              }}
            >
              {fmtDelta(tooltip.step.delta)}
            </span>
            {tooltip.step.probability != null && (
              <span style={S.tooltipProb}>
                (p={Math.round(tooltip.step.probability * 100)}%)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE STYLES — institutional dark palette
// ═══════════════════════════════════════════════════════════════════════════

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
  },

  // ── Header row ──
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    padding: "0 4px",
  },
  headerCell: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  headerDelta: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "4px 14px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: 6,
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.4)",
  },
  headerValue: {
    fontSize: 16,
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: "-0.01em",
  },
  methodTag: {
    marginLeft: "auto",
    fontSize: 9,
    fontWeight: 500,
    letterSpacing: "0.04em",
    color: "rgba(255, 255, 255, 0.3)",
    padding: "3px 8px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: 4,
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },

  // ── Chart ──
  chartContainer: {
    position: "relative",
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },

  // ── Tooltip ──
  tooltip: {
    position: "absolute",
    pointerEvents: "none",
    transform: "translate(-50%, -100%)",
    background: "rgba(6, 12, 24, 0.95)",
    border: "1px solid rgba(34, 211, 238, 0.2)",
    borderRadius: 6,
    padding: "6px 10px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6)",
    zIndex: 100,
  },
  tooltipLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.8)",
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: 700,
  },
  tooltipProb: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.4)",
  },

  // ── Empty state ──
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 300,
    color: "rgba(255, 255, 255, 0.2)",
    margin: 0,
  },
  emptyHint: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.35)",
    margin: 0,
    textAlign: "center",
  },
};
