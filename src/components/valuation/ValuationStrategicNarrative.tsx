// src/components/valuation/ValuationStrategicNarrative.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — AI Strategic Narrative (Phase V-5)
//
// Board-ready valuation narrative panel. Deterministic text generation
// from selector output — no LLM calls, no store access.
//
// Sections:
//   1. Valuation Summary
//   2. Key Driver Attribution
//   3. Risk Profile
//   4. Probability Assessment
//   5. Board Context
//
// Palette: dark institutional, cyan accents, emerald/red tone indicators.
// ═══════════════════════════════════════════════════════════════════════════

import type { ValuationNarrativePayload, NarrativeSection } from "@/valuation/valuationTypes";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  narrative: ValuationNarrativePayload | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TONE_COLORS: Record<NarrativeSection["tone"], string> = {
  positive: "#34d399",
  negative: "#f87171",
  neutral: "rgba(255, 255, 255, 0.5)",
  caution: "#fbbf24",
};

const TONE_BG: Record<NarrativeSection["tone"], string> = {
  positive: "rgba(52, 211, 153, 0.06)",
  negative: "rgba(248, 113, 113, 0.06)",
  neutral: "rgba(255, 255, 255, 0.02)",
  caution: "rgba(251, 191, 36, 0.06)",
};

const TONE_BORDER: Record<NarrativeSection["tone"], string> = {
  positive: "rgba(52, 211, 153, 0.15)",
  negative: "rgba(248, 113, 113, 0.15)",
  neutral: "rgba(255, 255, 255, 0.06)",
  caution: "rgba(251, 191, 36, 0.12)",
};

const TONE_ICON: Record<NarrativeSection["tone"], string> = {
  positive: "▲",
  negative: "▼",
  neutral: "●",
  caution: "◆",
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ValuationStrategicNarrative({ narrative }: Props) {
  // ── Empty state ──
  if (!narrative) {
    return (
      <div style={S.empty}>
        <p style={S.emptyTitle}>—</p>
        <p style={S.emptyHint}>
          Run baseline + scenario to generate strategic valuation narrative.
        </p>
      </div>
    );
  }

  return (
    <div style={S.wrapper}>
      {/* ── Headline ── */}
      <div style={S.headline}>{narrative.headline}</div>

      {/* ── Sections ── */}
      <div style={S.sections}>
        {narrative.sections.map((section) => (
          <div
            key={section.id}
            style={{
              ...S.section,
              background: TONE_BG[section.tone],
              borderLeftColor: TONE_BORDER[section.tone],
            }}
          >
            <div style={S.sectionHeader}>
              <span
                style={{
                  ...S.toneIcon,
                  color: TONE_COLORS[section.tone],
                }}
              >
                {TONE_ICON[section.tone]}
              </span>
              <span style={S.sectionTitle}>{section.title}</span>
            </div>
            <p style={S.sectionBody}>{section.body}</p>
          </div>
        ))}
      </div>

      {/* ── Disclaimer ── */}
      <div style={S.disclaimer}>{narrative.disclaimer}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE STYLES — institutional dark palette
// ═══════════════════════════════════════════════════════════════════════════

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    width: "100%",
  },

  // ── Headline ──
  headline: {
    fontSize: 14,
    fontWeight: 600,
    color: "#22d3ee",
    lineHeight: 1.5,
    letterSpacing: "-0.01em",
    padding: "0 2px",
  },

  // ── Sections ──
  sections: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  section: {
    borderRadius: 6,
    borderLeft: "3px solid",
    padding: "10px 14px",
    transition: "background 0.2s",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  toneIcon: {
    fontSize: 8,
    lineHeight: 1,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "rgba(255, 255, 255, 0.7)",
  },

  sectionBody: {
    fontSize: 12,
    lineHeight: 1.65,
    color: "rgba(255, 255, 255, 0.65)",
    margin: 0,
    letterSpacing: "0.01em",
  },

  // ── Disclaimer ──
  disclaimer: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "rgba(255, 255, 255, 0.25)",
    padding: "8px 0 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.04)",
    letterSpacing: "0.01em",
  },

  // ── Empty state ──
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 300,
    color: "rgba(255, 255, 255, 0.2)",
    margin: 0,
  },
  emptyHint: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.35)",
    margin: 0,
    textAlign: "center",
  },
};
