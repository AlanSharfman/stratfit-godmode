// src/components/KPIConsole.tsx
// STRATFIT — KPI Console (loop-proof with React 18 + Zustand)

import React, { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { METRICS, type MetricDefinition, type MetricId } from "../dashboardConfig";
import { useMetricsStore } from "../state/metricsStore";
import { useUIStore } from "../state/uiStore";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function trendFromHistory(arr: number[]): number {
  if (!arr || arr.length < 2) return 0;
  const prev = arr[arr.length - 2];
  const next = arr[arr.length - 1];
  if (!Number.isFinite(prev) || !Number.isFinite(next)) return 0;

  const delta = next - prev;
  const denom = Math.max(1, Math.abs(prev) * 0.35);
  return clamp(delta / denom, -1, 1);
}

function trendLabel(t: number) {
  const x = clamp(t, -1, 1);
  if (x > 0.25) return "Up";
  if (x < -0.25) return "Down";
  return "Flat";
}

function formatMetric(def: MetricDefinition, value: number): string {
  switch (def.id) {
    case "runway":
      return `${value.toFixed(1)} mo`;
    case "cash":
      return `$${value.toFixed(2)}m`;
    case "growth":
      return `${value.toFixed(0)}%`;
    case "ebitda":
      return `${value.toFixed(0)}%`;
    case "burn":
      return `$${value.toFixed(0)}k/m`;
    case "risk":
      return `${value.toFixed(0)}/100`;
    case "value":
      return `$${value.toFixed(1)}m`;
    default:
      return value.toFixed(2);
  }
}

function Sparkline({ data }: { data: number[] }) {
  const W = 120;
  const H = 28;
  const pad = 2;

  if (!data || data.length < 2) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <path
          d={`M ${pad} ${H / 2} L ${W - pad} ${H / 2}`}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.25"
        />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (i * (W - pad * 2)) / (data.length - 1);
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const d = `M ${pts.join(" L ")}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.85" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="4.5" opacity="0.12" />
    </svg>
  );
}

export default function KPIConsole() {
  // ✅ React 18-safe: memoized snapshot prevents "getSnapshot should be cached" warning
  const { metrics, history, status, lastError, focusedMetric, setFocusedMetric } = useMetricsStore(
    useShallow((s) => ({
      metrics: s.metrics,
      history: s.history,
      status: s.status,
      lastError: s.lastError,
      focusedMetric: s.focusedMetric,
      setFocusedMetric: s.setFocusedMetric,
    }))
  );

  const activeMetricId = useUIStore((s) => s.activeMetricId);
  const setActiveMetricId = useUIStore((s) => s.setActiveMetricId);

  const blocked = status === "blocked";
  const loading = status === "loading";

  // ✅ ESC key handler to clear focus lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusedMetric) {
        setFocusedMetric(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedMetric, setFocusedMetric]);

  return (
    <section className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs tracking-widest opacity-70">KPI CONSOLE</div>
        <div className="flex items-center gap-2 text-xs">
          {loading && <span className="opacity-70">Computing…</span>}
          {blocked && <span className="opacity-90">Blocked</span>}
          {!loading && !blocked && <span className="opacity-70">Live</span>}
        </div>
      </div>

      {blocked && lastError ? (
        <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs opacity-90">
          <div className="mb-1 font-semibold">Metrics blocked</div>
          <div className="opacity-80">{lastError}</div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {METRICS.map((def) => {
          const id = def.id as MetricId;
          const value = metrics[id];
          const spark = history[id] ?? [];
          const trend = trendFromHistory(spark);
          const missing = !Number.isFinite(value);
          const isActive = activeMetricId === id;
          const isFocused = focusedMetric === id;

          return (
            <button
              key={id}
              type="button"
              onMouseEnter={() => setFocusedMetric(id)}
              onMouseLeave={() => setFocusedMetric(null)}
              onClick={() => {
                setActiveMetricId(id);
                setFocusedMetric(focusedMetric === id ? null : id);
              }}
              className={[
                "text-left rounded-2xl border p-3 shadow-sm transition",
                isActive && "ring-2 ring-white/30",
                isFocused ? "border-white/40 bg-white/10" : "bg-white/5 hover:bg-white/7",
                isActive && !isFocused ? "border-white/20" : isFocused ? "border-white/40" : "border-white/10",
              ].join(" ")}
              style={{ minHeight: 112 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] tracking-widest opacity-70">{def.label}</div>
                  {def.unit ? <div className="mt-1 text-[10px] opacity-45">{def.unit}</div> : null}
                </div>

                <div className="text-[10px] opacity-55">{missing ? "—" : trendLabel(trend)}</div>
              </div>

              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-lg font-semibold leading-none">
                  {missing ? <span className="opacity-40">—</span> : formatMetric(def, value)}
                </div>

                <div className="opacity-80">
                  <Sparkline data={spark.length ? spark : [0, 0]} />
                </div>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/40"
                  style={{
                    width: missing ? "10%" : `${10 + ((clamp(trend, -1, 1) + 1) / 2) * 90}%`,
                    opacity: missing ? 0.2 : 0.6,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
