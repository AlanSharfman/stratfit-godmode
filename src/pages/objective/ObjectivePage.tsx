import React from "react";

function severityColor(severity: number): string {
  if (severity >= 80) return "#EF4444"; // red
  if (severity >= 60) return "#F59E0B"; // amber
  if (severity >= 40) return "#06B6D4"; // cyan
  return "#84CC16"; // lime
}

export default function ObjectivePage() {
  // Temporary safe stub to unblock Vite parsing.
  // Replace with real Objective implementation after build stability is restored.
  return (
    <div style={{ padding: 24, color: "#F1F5F9" }}>
      <h1 style={{ margin: 0, fontSize: 18, letterSpacing: "0.08em" }}>
        OBJECTIVE (RECOVERY MODE)
      </h1>
      <p style={{ opacity: 0.7, marginTop: 10, maxWidth: 720 }}>
        ObjectivePage.tsx was truncated (EOF). This stub restores compilation so we can
        fix rendering + mountain duplication safely.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(15,23,42,0.55)",
          maxWidth: 420,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: "0.06em" }}>
          Severity color demo
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          {[20, 45, 65, 85].map((s) => (
            <div
              key={s}
              style={{
                width: 64,
                height: 28,
                borderRadius: 8,
                background: severityColor(s),
                opacity: 0.85,
                display: "grid",
                placeItems: "center",
                color: "#0B1220",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

