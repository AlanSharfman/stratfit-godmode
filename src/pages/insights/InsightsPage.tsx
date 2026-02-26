// src/pages/insights/InsightsPage.tsx

import PageShell from "@/layout/PageShell"

export default function InsightsPage() {
  return (
    <PageShell
      title="Insights"
      subtitle="Summarise scenario outcomes and surface the highest-leverage moves."
    >
      <ul style={{ color: "rgba(255, 255, 255, 0.72)", lineHeight: 1.8, paddingLeft: 18 }}>
        <li>Executive summary of Scenario A/B deltas</li>
        <li>Key drivers + recommended actions</li>
        <li>Export-ready narrative pack (later)</li>
      </ul>
    </PageShell>
  )
}
