import React from "react"
import { Link } from "react-router-dom"

const SECTIONS = [
  {
    title: "What Data We Collect",
    body: "STRATFIT collects the financial and operational data you enter into the platform (revenue, burn rate, headcount, etc.), scenario configurations, and usage analytics. We do not collect personal financial data, bank account information, or identity documents.",
  },
  {
    title: "How We Use It",
    body: "Your data is used exclusively to generate simulations, terrain visualisations, and AI commentary within the STRATFIT platform. We do not sell, share, or distribute your business data to third parties.",
  },
  {
    title: "AI Processing Notice",
    body: "When AI commentary features are enabled, anonymised simulation outputs may be sent to third-party AI providers (e.g. OpenAI) for natural language interpretation. No raw financial data or personally identifiable information is included in AI requests. AI-generated text is returned to the platform for display only.",
  },
  {
    title: "Cookies & Analytics",
    body: "STRATFIT may use essential cookies for session management and optional analytics cookies to understand platform usage. No advertising cookies are used. You can disable non-essential cookies through your browser settings.",
  },
  {
    title: "Data Retention",
    body: "Simulation data is stored locally in your browser (localStorage) and is not transmitted to external servers unless you explicitly use cloud save or export features. You can clear all local data at any time through your browser settings.",
  },
  {
    title: "Contact",
    body: "For questions about data privacy or to request data deletion, contact the STRATFIT team through the channels provided on the platform.",
  },
]

export default function PrivacyPage() {
  return (
    <div style={S.root}>
      <div style={S.container}>
        <Link to="/" style={S.backLink}>← Back to STRATFIT</Link>

        <h1 style={S.heading}>Privacy Policy</h1>
        <p style={S.updated}>Last updated: March 2026</p>

        {SECTIONS.map((s) => (
          <section key={s.title} style={S.section}>
            <h2 style={S.sectionTitle}>{s.title}</h2>
            <p style={S.sectionBody}>{s.body}</p>
          </section>
        ))}

        <div style={S.footer}>
          <Link to="/legal/terms" style={S.footerLink}>Terms of Use</Link>
        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#0B1520",
    color: "rgba(220,240,255,0.85)",
    fontFamily: "'Inter', system-ui, sans-serif",
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px 80px",
  },
  container: {
    maxWidth: 720,
    width: "100%",
  },
  backLink: {
    display: "inline-block",
    marginBottom: 32,
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(34,211,238,0.7)",
    textDecoration: "none",
    letterSpacing: "0.04em",
  },
  heading: {
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: "0.06em",
    color: "#dff8ff",
    marginBottom: 8,
  },
  updated: {
    fontSize: 12,
    color: "rgba(220,240,255,0.35)",
    marginBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#dff8ff",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(220,240,255,0.70)",
    margin: 0,
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: "1px solid rgba(54,226,255,0.1)",
  },
  footerLink: {
    fontSize: 12,
    color: "rgba(34,211,238,0.6)",
    textDecoration: "none",
  },
}
