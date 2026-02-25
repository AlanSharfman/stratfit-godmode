// src/pages/coming-features/ComingFeaturesPage.tsx

export default function ComingFeaturesPage() {
  return (
    <div className="page-container" style={{ padding: "2rem" }}>
      <h1 style={{ color: "rgba(226, 232, 240, 0.9)", fontSize: "1.5rem", fontWeight: 600 }}>
        Coming Features
      </h1>
      <p style={{ color: "rgba(148, 163, 184, 0.8)", marginTop: "1rem", maxWidth: 860, lineHeight: 1.6 }}>
        A lightweight placeholder for near-term roadmap items.
      </p>

      <ul style={{ marginTop: "1rem", color: "rgba(148, 163, 184, 0.78)", lineHeight: 1.8 }}>
        <li>Xero / MYOB / QuickBooks ingestion</li>
        <li>Multi-scenario compare grid</li>
        <li>AI narrated tours + export packs</li>
      </ul>
    </div>
  )
}
