// src/pages/coming-features/ComingFeaturesPage.tsx

import PageShell from "@/layout/PageShell"

export default function ComingFeaturesPage() {
  return (
    <PageShell
      title="Coming Features"
      subtitle="Near-term roadmap items in active development."
    >
      <ul style={{ color: "rgba(255, 255, 255, 0.72)", lineHeight: 1.8, paddingLeft: 18 }}>
        <li>Xero / MYOB / QuickBooks ingestion</li>
        <li>Multi-scenario compare grid</li>
        <li>AI narrated tours + export packs</li>
      </ul>
    </PageShell>
  )
}
