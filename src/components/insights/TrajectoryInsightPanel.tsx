import React, { useMemo } from "react";
import { useTrajectoryStore } from "@/state/trajectoryStore";

function impactLabel(impact: string) {
  if (impact === "high") return "High Impact";
  if (impact === "medium") return "Medium Impact";
  return "Low Impact";
}

/**
 * TrajectoryInsightPanel displays detailed insight information
 * when a trajectory node is selected.
 *
 * Features:
 * - World-class institutional styling
 * - Dark glass background with cyan accents
 * - Structured content: What it means, Why it matters, Suggested action
 * - Right-side fixed panel overlay
 */
export default function TrajectoryInsightPanel() {
  const { insights, selectedInsightId, setSelectedInsightId } =
    useTrajectoryStore();

  const selected = useMemo(() => {
    if (!selectedInsightId) return null;
    return insights.find((i) => i.id === selectedInsightId) ?? null;
  }, [insights, selectedInsightId]);

  if (!selected) return null;

  return (
    <div
      style={{
        position: "absolute",
        right: 18,
        top: 88,
        width: 360,
        maxHeight: "calc(100vh - 140px)",
        overflow: "auto",
        borderRadius: 18,
        background: "rgba(6, 10, 14, 0.72)",
        border: "1px solid rgba(34, 211, 238, 0.22)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        backdropFilter: "blur(14px)",
        padding: 14,
        color: "rgba(235, 248, 255, 0.92)",
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.3 }}>
          {selected.title}
        </div>

        <button
          onClick={() => setSelectedInsightId(null)}
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "6px 10px",
            color: "rgba(235,248,255,0.9)",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            border: "1px solid rgba(34,211,238,0.22)",
            background: "rgba(34,211,238,0.06)",
            fontSize: 12,
          }}
        >
          {impactLabel(selected.impact)}
        </span>

        <span
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(148,163,184,0.06)",
            fontSize: 12,
          }}
        >
          Confidence {Math.round(selected.confidence * 100)}%
        </span>
      </div>

      <Section title="What this means">{selected.message}</Section>

      <Section title="Why it matters">
        This point represents a meaningful inflection along your operational
        journey. If left unaddressed, the slope ahead becomes steeper and your
        probability of achieving the target state drops.
      </Section>

      <Section title="Suggested action">
        Make one deliberate intervention linked to this insight and re-run the
        scenario. The goal is to flatten the upcoming gradient rather than "push
        harder" into a risk zone.
      </Section>

      <div
        style={{
          marginTop: 12,
          padding: 10,
          borderRadius: 14,
          border: "1px solid rgba(99,102,241,0.16)",
          background: "rgba(99,102,241,0.06)",
          fontSize: 12,
          lineHeight: 1.4,
          color: "rgba(235,248,255,0.86)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Next step</div>
        Click another node to compare how multiple factors compound along the
        path, then move into Studio to test levers that redirect the trajectory.
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{ fontSize: 12, fontWeight: 700, opacity: 0.9, marginBottom: 6 }}
      >
        {title}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, opacity: 0.88 }}>
        {children}
      </div>
    </div>
  );
}
