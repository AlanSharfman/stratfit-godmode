import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { studioSessionStore, type StudioRuntime } from "@/state/studioSessionStore";

export default function ComparePage() {
  const navigate = useNavigate();
  const [rt, setRt] = useState<StudioRuntime | null>(() => studioSessionStore.get());

  useEffect(() => {
    const unsub = studioSessionStore.subscribe((next) => setRt(next));
    return () => { unsub(); };
  }, []);

  const guard = useMemo(() => {
    if (!rt) return "NO_RUNTIME";
    if (!rt.scenarios || rt.scenarios.length < 2) return "NOT_READY";
    return "OK";
  }, [rt]);

  useEffect(() => {
    if (guard === "NO_RUNTIME") navigate("/position");
    if (guard === "NOT_READY") navigate("/studio");
  }, [guard, navigate]);

  if (!rt || guard !== "OK") return null;

  const a = rt.scenarios[0];
  const b = rt.scenarios[1];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 10, opacity: 0.9 }}>
        <strong>COMPARE</strong> — Scenario A vs Scenario B
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, opacity: 0.85 }}>
        <strong>Question:</strong> {rt.questionContext.question}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(120,180,255,0.25)",
            background: "rgba(12,18,28,0.65)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
            {a.name}
          </div>

          <div style={{ fontSize: 13, opacity: 0.85 }}>
            <div><strong>ID:</strong> {a.id}</div>
            <div><strong>Created:</strong> {a.createdAtISO}</div>
            <div style={{ marginTop: 8, opacity: 0.7 }}>
              Outputs will render here next (risk/valuation optional).
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(120,180,255,0.25)",
            background: "rgba(12,18,28,0.65)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
            {b.name}
          </div>

          <div style={{ fontSize: 13, opacity: 0.85 }}>
            <div><strong>ID:</strong> {b.id}</div>
            <div><strong>Created:</strong> {b.createdAtISO}</div>
            <div style={{ marginTop: 8, opacity: 0.7 }}>
              Outputs will render here next (risk/valuation optional).
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <button
          onClick={() => navigate("/studio")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(120,180,255,0.25)",
            background: "rgba(12,18,28,0.65)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Back to Studio
        </button>

        <button
          onClick={() => navigate("/position")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(120,180,255,0.25)",
            background: "rgba(12,18,28,0.65)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Back to Position
        </button>
      </div>
    </div>
  );
}
