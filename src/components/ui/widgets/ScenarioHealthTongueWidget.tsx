import React from "react";

type Props = {
  value: number;     // we will pass a trend code here (not “health score”)
  isActive: boolean; // already supplied by KPICard
};

function trendFromValue(v: number): "strengthening" | "stable" | "weakening" {
  // Encode trend as: +1 strengthening, 0 stable, -1 weakening
  if (v > 0.25) return "strengthening";
  if (v < -0.25) return "weakening";
  return "stable";
}

function trendColor(t: "strengthening" | "stable" | "weakening") {
  if (t === "strengthening") return "#00E5FF";
  if (t === "weakening") return "#ef4444";
  return "#f59e0b";
}

function slabOffset(t: "strengthening" | "stable" | "weakening") {
  if (t === "strengthening") return -4;
  if (t === "weakening") return 6;
  return 0;
}

export default function ScenarioHealthTongueWidget({ value }: Props) {
  const trend = trendFromValue(value);
  const c = trendColor(trend);

  return (
    <div
      style={
        {
          height: "100%",
          width: "100%",
          position: "relative",
          borderRadius: 10,
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(2, 6, 12, 0.55)",
          ["--accent" as any]: c,
          ["--slabY" as any]: `${slabOffset(trend)}px`,
        } as React.CSSProperties
      }
    >
      {/* Grid tray */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
          background:
            "linear-gradient(to right, rgba(0,229,255,0.18) 1px, transparent 1px) 0 0 / 18px 18px," +
            "linear-gradient(to bottom, rgba(0,229,255,0.12) 1px, transparent 1px) 0 0 / 18px 18px",
          maskImage: "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))",
        }}
      />

      {/* Tongue slab */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 8,
          transform: "translateX(-50%)",
          width: "82%",
          height: 44,
          perspective: 700,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: "100%",
            height: 34,
            transform:
              "translateX(-50%) translateY(var(--slabY)) rotateX(58deg)",
            transformOrigin: "top center",
            clipPath: "polygon(14% 0%, 86% 0%, 100% 100%, 0% 100%)",
            background:
              "linear-gradient(180deg," +
              "color-mix(in srgb, var(--accent) 55%, rgba(255,255,255,0.12)) 0%," +
              "color-mix(in srgb, var(--accent) 18%, rgba(0,0,0,0.0)) 100%)",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.55), 0 0 0 1px color-mix(in srgb, var(--accent) 38%, rgba(255,255,255,0.05)) inset",
            opacity: 0.95,
          }}
        />
      </div>
    </div>
  );
}
