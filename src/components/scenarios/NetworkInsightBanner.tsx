import React, { memo } from "react"
import type { NetworkInsight } from "@/stores/scenarioLibraryStore"

interface Props {
  insight: NetworkInsight | null
}

const NetworkInsightBanner: React.FC<Props> = memo(({ insight }) => {
  if (!insight) return null

  return (
    <div style={S.root}>
      <div style={S.header}>
        <span style={S.icon}>⚡</span>
        <span style={S.title}>NETWORK INTELLIGENCE</span>
        <span style={S.badge}>{insight.totalMatches} scenarios</span>
      </div>
      <div style={S.headline}>{insight.headline}</div>
      {insight.details.length > 0 && (
        <div style={S.detailList}>
          {insight.details.map((d, i) => (
            <div key={i} style={S.detail}>
              <span style={S.dot} />
              {d}
            </div>
          ))}
        </div>
      )}
      <div style={S.disclaimer}>
        Based on anonymised scenario data. Not financial advice.
      </div>
    </div>
  )
})

NetworkInsightBanner.displayName = "NetworkInsightBanner"
export default NetworkInsightBanner

const FONT = "'Inter', system-ui, sans-serif"

const S: Record<string, React.CSSProperties> = {
  root: {
    padding: "14px 18px 10px",
    background: "linear-gradient(135deg, rgba(16,38,60,0.88) 0%, rgba(8,24,44,0.92) 100%)",
    border: "1px solid rgba(168,85,247,0.15)",
    borderRadius: 10,
    fontFamily: FONT,
    marginTop: 10,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },

  icon: {
    fontSize: 11,
  },

  title: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(168,85,247,0.7)",
  },

  badge: {
    marginLeft: "auto",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "rgba(168,85,247,0.55)",
    padding: "2px 8px",
    border: "1px solid rgba(168,85,247,0.12)",
    borderRadius: 4,
  },

  headline: {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(230,241,255,0.88)",
    lineHeight: 1.45,
    marginBottom: 6,
  },

  detailList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },

  detail: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: "rgba(200,220,240,0.55)",
    lineHeight: 1.4,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: "rgba(168,85,247,0.45)",
    flexShrink: 0,
  },

  disclaimer: {
    marginTop: 8,
    fontSize: 8,
    letterSpacing: "0.04em",
    color: "rgba(200,220,240,0.18)",
  },
}
