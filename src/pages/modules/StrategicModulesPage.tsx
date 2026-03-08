import PageShell from "@/components/nav/PageShell"
import SimulationDisclaimerBar from "@/components/legal/SimulationDisclaimerBar"

const MODULES = [
  {
    title: "Risk Intelligence",
    description:
      "Stress test business resilience across thousands of probabilistic scenarios.",
    status: "Coming Soon",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path
          d="M16 4L28 26H4L16 4Z"
          stroke="#22d3ee"
          strokeWidth="1.5"
          fill="rgba(34,211,238,0.08)"
        />
        <line x1="16" y1="12" x2="16" y2="19" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="22" r="1" fill="#22d3ee" />
      </svg>
    ),
  },
  {
    title: "Valuation Engine",
    description:
      "Understand how strategic decisions impact enterprise value.",
    status: "Coming Soon",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="18" rx="3" stroke="#22d3ee" strokeWidth="1.5" fill="rgba(34,211,238,0.08)" />
        <polyline points="8,22 13,16 18,19 24,12" stroke="#22d3ee" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Strategic AI Advisor",
    description:
      "AI-generated strategic insights based on scenario outcomes.",
    status: "Coming Soon",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="11" stroke="#22d3ee" strokeWidth="1.5" fill="rgba(34,211,238,0.08)" />
        <circle cx="16" cy="16" r="4" stroke="#22d3ee" strokeWidth="1.5" fill="rgba(34,211,238,0.15)" />
        <line x1="16" y1="5" x2="16" y2="9" stroke="#22d3ee" strokeWidth="1" />
        <line x1="16" y1="23" x2="16" y2="27" stroke="#22d3ee" strokeWidth="1" />
        <line x1="5" y1="16" x2="9" y2="16" stroke="#22d3ee" strokeWidth="1" />
        <line x1="23" y1="16" x2="27" y2="16" stroke="#22d3ee" strokeWidth="1" />
      </svg>
    ),
  },
] as const

export default function StrategicModulesPage() {
  return (
    <PageShell>
      <div style={S.root}>
        <header style={S.header}>
          <h1 style={S.title}>Strategic Intelligence Modules</h1>
          <p style={S.subtitle}>
            Advanced STRATFIT capabilities currently being activated.
          </p>
        </header>

        <div style={S.grid}>
          {MODULES.map((mod) => (
            <div key={mod.title} style={S.card}>
              <div style={S.cardIcon}>{mod.icon}</div>
              <div style={S.cardBody}>
                <div style={S.cardTitle}>{mod.title}</div>
                <p style={S.cardDesc}>{mod.description}</p>
              </div>
              <span style={S.badge}>{mod.status}</span>
            </div>
          ))}
        </div>

        <p style={S.footer}>
          These modules extend the STRATFIT terrain intelligence system with
          deeper probabilistic analysis. They will be activated progressively.
        </p>

        <div style={{ width: "100%", maxWidth: 960, marginTop: 24 }}>
          <SimulationDisclaimerBar variant="compact" />
        </div>
      </div>
    </PageShell>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px 24px",
    color: "#E6F1FF",
    fontFamily: "'Inter', system-ui, sans-serif",
    overflow: "auto",
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#ffffff",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(200,220,240,0.4)",
    margin: 0,
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    width: "100%",
    maxWidth: 960,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "24px 22px",
    background: "rgba(8,20,38,0.8)",
    border: "1px solid rgba(54,226,255,0.25)",
    borderRadius: 14,
    backdropFilter: "blur(12px)",
    boxShadow: "0 4px 28px rgba(0,0,0,0.35), 0 0 12px rgba(0,180,255,0.05)",
    transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
    cursor: "default",
  },
  cardIcon: {
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    background: "rgba(34,211,238,0.06)",
    border: "1px solid rgba(34,211,238,0.12)",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.04em",
    color: "#ffffff",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: "rgba(200,220,240,0.5)",
    lineHeight: 1.6,
    margin: 0,
  },
  badge: {
    alignSelf: "flex-start",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "4px 12px",
    borderRadius: 20,
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.2)",
    color: "rgba(34,211,238,0.7)",
  },
  footer: {
    marginTop: 40,
    fontSize: 11,
    color: "rgba(200,220,240,0.2)",
    textAlign: "center",
    maxWidth: 480,
    lineHeight: 1.6,
  },
}
