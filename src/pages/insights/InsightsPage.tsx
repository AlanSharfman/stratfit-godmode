// src/pages/insights/InsightsPage.tsx

export default function InsightsPage() {
  return (
    <div className="page-container" style={{ padding: "2rem" }}>
      <h1 style={{ color: "rgba(226, 232, 240, 0.9)", fontSize: "1.5rem", fontWeight: 600 }}>
        Insights
      </h1>
      <p style={{ color: "rgba(148, 163, 184, 0.8)", marginTop: "1rem", maxWidth: 860, lineHeight: 1.6 }}>
        Insights is coming soon. This page will summarize scenario outcomes and surface the highest-leverage moves.
      </p>

      <ul style={{ marginTop: "1rem", color: "rgba(148, 163, 184, 0.78)", lineHeight: 1.8 }}>
        <li>Executive summary of Scenario A/B deltas</li>
        <li>Key drivers + recommended actions</li>
        <li>Export-ready narrative pack (later)</li>
      </ul>
    </div>
  )
}
