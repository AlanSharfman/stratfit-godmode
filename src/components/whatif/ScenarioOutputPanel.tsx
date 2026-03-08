// src/components/whatif/ScenarioOutputPanel.tsx
// Scenario Output panel — right column of the What-If 2-column layout.
// Props receive pre-formatted strings from the page so the component stays
// presentation-only. Formatting lives in WhatIfPage (formatMetricString).

import React from "react"

export interface ScenarioMetrics {
  revenue?:         string
  ebitda?:          string
  liquidity?:       string
  runway?:          string
  enterpriseValue?: string
}

export function ScenarioOutputPanel({
  title,
  summary,
  metrics,
  loading = false,
  children,
}: {
  title?:    string
  summary?:  string
  metrics?:  ScenarioMetrics
  /** True while runSimulation() is in flight — shows a loading indicator. */
  loading?:  boolean
  /** Optional rich content (AI follow-ups, disclaimers) below the metric grid. */
  children?: React.ReactNode
}) {
  const hasContent =
    !!title ||
    !!summary ||
    !!metrics?.revenue ||
    !!metrics?.ebitda ||
    !!metrics?.liquidity ||
    !!metrics?.runway ||
    !!metrics?.enterpriseValue

  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(11,31,54,0.72)] p-7 backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.45)] relative overflow-hidden">

      {/* Corner atmospheric haze */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_left,rgba(33,212,253,0.07),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(110,91,255,0.06),transparent_40%)]" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-semibold text-[#EAF4FF]">Scenario Output</h2>
          {loading && (
            <span className="inline-block h-2 w-2 rounded-full bg-[#21D4FD] animate-pulse shrink-0" />
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <p className="mt-2 text-sm italic text-[rgba(33,212,253,0.55)]">
            Running simulation…
          </p>
        )}

        {!loading && !hasContent && (
          <p className="mt-3 text-sm text-[#9DB7D1]">
            Run a scenario to see how your strategic choice could impact
            revenue, profitability, liquidity, and enterprise value.
          </p>
        )}

        {!loading && hasContent && (
          <div className="mt-4 space-y-4">
            {title && (
              <div className="text-sm font-semibold text-[#EAF4FF]">{title}</div>
            )}

            {summary && (
              <p className="text-sm leading-relaxed text-[#9DB7D1]">{summary}</p>
            )}

            <div className="grid grid-cols-1 gap-3">
              {metrics?.revenue && (
                <MetricCard label="Revenue" value={metrics.revenue} />
              )}
              {metrics?.ebitda && (
                <MetricCard label="EBITDA" value={metrics.ebitda} />
              )}
              {metrics?.liquidity && (
                <MetricCard label="Liquidity" value={metrics.liquidity} />
              )}
              {metrics?.runway && (
                <MetricCard label="Runway" value={metrics.runway} />
              )}
              {metrics?.enterpriseValue && (
                <MetricCard label="Enterprise Value" value={metrics.enterpriseValue} />
              )}
            </div>

            {children && (
              <div className="pt-2 border-t border-white/[0.06] space-y-3">
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Internal metric card ──────────────────────────────────────────────────
// Splits "label: value (delta)" convention so delta can be coloured.
// Expects value strings like "$1.2M (+15.3%)" or "14 mos (-2 mos)".

function MetricCard({ label, value }: { label: string; value: string }) {
  // Extract an optional trailing delta token: (+x%) or (-x) etc.
  const deltaMatch = value.match(/(\([^)]+\))\s*$/)
  const deltaStr  = deltaMatch ? deltaMatch[1] : null
  const baseStr   = deltaStr ? value.slice(0, value.lastIndexOf(deltaStr)).trim() : value

  const isPositive = deltaStr ? deltaStr.startsWith("(+") : null
  const deltaColor =
    isPositive === null
      ? "text-[#9DB7D1]"
      : isPositive
        ? "text-[#B7FF3C]"
        : "text-[#6E5BFF]"

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
      <span className="text-xs font-semibold tracking-[0.08em] uppercase text-[rgba(157,183,209,0.55)]">
        {label}
      </span>
      <div className="flex items-center gap-2 text-right">
        <span className="text-sm font-semibold text-[#EAF4FF] tabular-nums">{baseStr}</span>
        {deltaStr && (
          <span className={`text-xs font-semibold tabular-nums ${deltaColor}`}>
            {deltaStr}
          </span>
        )}
      </div>
    </div>
  )
}
