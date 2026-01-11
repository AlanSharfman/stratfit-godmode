// src/strategy/TimelineChart.tsx
// STRATFIT — 36-Month Timeline Projection Chart

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useScenarioStore } from "@/state/scenarioStore";
import { STRATEGY_LABEL_COLORS } from "./Strategy";
import type { Strategy } from "./Strategy";

// Color palette for multiple strategies
const STRATEGY_COLORS = [
  "#22d3ee", // Cyan
  "#a855f7", // Purple
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#ef4444", // Red
  "#3b82f6", // Blue
];

interface TimelineChartProps {
  metric?: "valuation" | "arr" | "runway" | "cash" | "risk" | "totalFunding";
  height?: number;
}

export function TimelineChart({ 
  metric = "valuation", 
  height = 300 
}: TimelineChartProps) {
  const strategies = useScenarioStore((s) => s.strategies);

  const chartData = useMemo(() => {
    if (strategies.length === 0) return [];

    // Find the strategy with most timeline points
    const maxPoints = Math.max(...strategies.map((s) => s.timeline?.length ?? 0));
    if (maxPoints === 0) return [];

    // Build combined data points
    const data = [];
    for (let i = 0; i < maxPoints; i++) {
      const point: Record<string, number | string> = {
        month: strategies[0]?.timeline?.[i]?.month ?? i * 3,
      };

      strategies.forEach((s) => {
        const timelinePoint = s.timeline?.[i];
        if (timelinePoint) {
          point[s.name] = timelinePoint[metric];
        }
      });

      data.push(point);
    }

    return data;
  }, [strategies, metric]);

  const formatValue = (value: number) => {
    if (metric === "valuation" || metric === "arr" || metric === "cash" || metric === "totalFunding") {
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    }
    if (metric === "runway") return `${value.toFixed(0)} mo`;
    if (metric === "risk") return `${value.toFixed(0)}`;
    return value.toFixed(0);
  };

  const metricLabels: Record<string, string> = {
    valuation: "Enterprise Value",
    arr: "ARR (12-Month)",
    runway: "Runway (Months)",
    cash: "Cash Position",
    risk: "Risk Index",
    totalFunding: "Cumulative Funding",
  };

  if (strategies.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "rgba(160,200,255,0.5)",
          fontSize: 14,
        }}
      >
        Save strategies to see timeline projections
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "rgba(160,200,255,0.5)",
          fontSize: 14,
        }}
      >
        No timeline data available
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(10,15,24,0.9)",
        borderRadius: 12,
        border: "1px solid rgba(120,180,255,0.15)",
        padding: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#6fd3ff",
            textTransform: "uppercase",
          }}
        >
          36-Month Projection: {metricLabels[metric]}
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {strategies.map((s, i) => (
            <span
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "rgba(230,242,255,0.8)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: STRATEGY_COLORS[i % STRATEGY_COLORS.length],
                }}
              />
              <span>{s.name}</span>
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: `${STRATEGY_LABEL_COLORS[s.label]}22`,
                  color: STRATEGY_LABEL_COLORS[s.label],
                  fontSize: 9,
                  fontWeight: 600,
                }}
              >
                {s.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(120,180,255,0.1)"
          />
          <XAxis
            dataKey="month"
            stroke="rgba(160,200,255,0.5)"
            fontSize={11}
            tickFormatter={(v) => `M${v}`}
          />
          <YAxis
            stroke="rgba(160,200,255,0.5)"
            fontSize={11}
            tickFormatter={formatValue}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,15,24,0.95)",
              border: "1px solid rgba(120,180,255,0.2)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => [formatValue(value), ""]}
            labelFormatter={(label) => `Month ${label}`}
          />
          <Legend />
          {strategies.map((s, i) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.name}
              stroke={STRATEGY_COLORS[i % STRATEGY_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Metric Summary */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(strategies.length, 4)}, 1fr)`,
          gap: 12,
        }}
      >
        {strategies.map((s, i) => {
          const startValue = s.timeline?.[0]?.[metric] ?? 0;
          const endValue = s.timeline?.[s.timeline.length - 1]?.[metric] ?? 0;
          const change = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
          const isPositive = metric === "risk" ? change < 0 : change > 0;

          return (
            <div
              key={s.id}
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                background: "rgba(0,0,0,0.3)",
                border: `1px solid ${STRATEGY_COLORS[i % STRATEGY_COLORS.length]}33`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(160,200,255,0.6)",
                  marginBottom: 4,
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#e6f2ff",
                }}
              >
                {formatValue(endValue)}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: isPositive ? "#6fffd2" : "#ff7a9a",
                  marginTop: 2,
                }}
              >
                {isPositive ? "↑" : "↓"} {Math.abs(change).toFixed(1)}% over 36mo
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimelineChart;

