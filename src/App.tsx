import React from "react";
import MountainEngine from "./components/engine/MountainEngine";

const DEFAULT_POINTS: number[] = [40, 55, 70, 85, 65, 90, 75];

export default function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#050816",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <MountainEngine
          dataPoints={DEFAULT_POINTS}
          activeKPIIndex={3}
          scenario="base"
        />
      </div>
    </div>
  );
}
