import React from "react";
import { useDemoRecorder } from "./useDemoRecorder";

export default function DemoRecorderControls() {
  const { state, error, blobUrl, start, stop, reset } = useDemoRecorder();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {state !== "recording" ? (
        <button
          onClick={start}
          style={{
            appearance: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.90)",
            borderRadius: 10,
            padding: "8px 10px",
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: 0.4,
            cursor: "pointer",
          }}
        >
          ● Record
        </button>
      ) : (
        <button
          onClick={stop}
          style={{
            appearance: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,59,48,0.14)",
            color: "rgba(255,255,255,0.92)",
            borderRadius: 10,
            padding: "8px 10px",
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: 0.4,
            cursor: "pointer",
          }}
        >
          ■ Stop
        </button>
      )}

      {state === "ready" && blobUrl && (
        <>
          <a
            href={blobUrl}
            download="stratfit-demo.webm"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,224,255,0.12)",
              color: "rgba(255,255,255,0.92)",
              borderRadius: 10,
              padding: "8px 10px",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: 0.4,
              textDecoration: "none",
            }}
          >
            Save
          </a>
          <button
            onClick={reset}
            style={{
              appearance: "none",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.86)",
              borderRadius: 10,
              padding: "8px 10px",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: 0.4,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </>
      )}

      {state === "error" && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
          {error ?? "Recording unavailable."}
        </div>
      )}
    </div>
  );
}
