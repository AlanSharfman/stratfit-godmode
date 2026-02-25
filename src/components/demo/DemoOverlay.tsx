import React from "react";
import { useDemoController } from "@/demo/useDemoController";
import { useDemoNarration } from "@/demo/useDemoNarration";
import DemoExecutiveOverlay from "@/components/demo/DemoExecutiveOverlay";

export default function DemoOverlay() {
  const { step, isPlaying, play, pause, reset, next, prev } = useDemoController();
  useDemoNarration(step.stage, true);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        zIndex: 40,
      }}
    >
      {/* Top title */}
      <div
        style={{
          margin: "24px auto 0",
          padding: "10px 18px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(10px)",
          color: "white",
          fontWeight: 700,
          letterSpacing: 0.4,
        }}
      >
        {step.title}
      </div>

      {/* Center description */}
      <div
        style={{
          margin: "0 auto",
          maxWidth: 560,
          textAlign: "center",
          color: "rgba(255,255,255,0.85)",
          fontSize: 15,
          lineHeight: 1.4,
          padding: "12px 18px",
          background: "rgba(0,0,0,0.55)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {step.description}
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginBottom: 18,
          pointerEvents: "auto",
        }}
      >
        <button onClick={prev}>◀</button>
        {!isPlaying ? <button onClick={play}>Play</button> : <button onClick={pause}>Pause</button>}
        <button onClick={next}>▶</button>
        <button onClick={reset}>Reset</button>
      </div>

      <DemoExecutiveOverlay visible={step.stage === "EXEC_SUMMARY"} />
    </div>
  );
}
