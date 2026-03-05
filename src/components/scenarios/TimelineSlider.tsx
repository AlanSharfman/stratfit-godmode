import React, { useCallback, useMemo } from "react"
import type { TimelineState, TippingPoint } from "@/engine/timeSimulation"

interface Props {
  timeline: TimelineState[]
  currentMonth: number
  onMonthChange: (month: number) => void
}

const S: Record<string, React.CSSProperties> = {
  root: {
    position: "relative",
    padding: "12px 24px 20px",
    background: "linear-gradient(180deg, rgba(4,8,16,0.9) 0%, rgba(6,12,24,0.95) 100%)",
    borderTop: "1px solid rgba(34,211,238,0.08)",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(34,211,238,0.5)",
    whiteSpace: "nowrap" as const,
    minWidth: 48,
  },
  sliderWrap: {
    flex: 1,
    position: "relative" as const,
    height: 32,
    display: "flex",
    alignItems: "center",
  },
  slider: {
    width: "100%",
    accentColor: "#22d3ee",
    cursor: "pointer",
    height: 4,
    position: "relative" as const,
    zIndex: 2,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(200,220,240,0.8)",
    fontVariantNumeric: "tabular-nums",
    minWidth: 64,
    textAlign: "right" as const,
  },
  ticksContainer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none" as const,
    display: "flex",
    alignItems: "center",
  },
  tippingMarker: {
    position: "absolute" as const,
    width: 3,
    height: 20,
    borderRadius: 1,
    transform: "translateX(-50%)",
    zIndex: 1,
  },
  warningLabel: {
    marginTop: 8,
    fontSize: 11,
    color: "#f87171",
    textAlign: "center" as const,
    fontWeight: 500,
    letterSpacing: "0.04em",
  },
}

export default function TimelineSlider({ timeline, currentMonth, onMonthChange }: Props) {
  const maxMonth = timeline.length > 0 ? timeline[timeline.length - 1].month : 24

  const allTippingPoints = useMemo(() => {
    const seen = new Set<string>()
    const pts: (TippingPoint & { pct: number })[] = []
    for (const state of timeline) {
      for (const tp of state.tippingPoints) {
        const key = `${tp.kpi}-${tp.threshold}`
        if (!seen.has(key)) {
          seen.add(key)
          pts.push({ ...tp, pct: (tp.month / maxMonth) * 100 })
        }
      }
    }
    return pts
  }, [timeline, maxMonth])

  const firstCliff = allTippingPoints.find((tp) => tp.threshold === "critical")

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onMonthChange(parseInt(e.target.value, 10))
  }, [onMonthChange])

  if (timeline.length === 0) return null

  return (
    <div style={S.root}>
      <div style={S.row}>
        <span style={S.label}>TIMELINE</span>
        <div style={S.sliderWrap}>
          <input
            type="range"
            min={0}
            max={maxMonth}
            step={1}
            value={currentMonth}
            onChange={handleChange}
            style={S.slider}
          />
          <div style={S.ticksContainer}>
            {allTippingPoints.map((tp, i) => (
              <div
                key={i}
                style={{
                  ...S.tippingMarker,
                  left: `${tp.pct}%`,
                  background: tp.threshold === "critical" ? "#f87171" : "#fbbf24",
                }}
                title={`${tp.kpi} ${tp.threshold} at month ${tp.month}`}
              />
            ))}
          </div>
        </div>
        <span style={S.monthLabel}>
          Month {currentMonth}
        </span>
      </div>
      {firstCliff && (
        <div style={S.warningLabel}>
          ⚠ Tipping point: {firstCliff.kpi} reaches critical at month {firstCliff.month}
        </div>
      )}
    </div>
  )
}
