import React from "react";

type Props = {
  enabled: boolean;
  onToggle: () => void;
};

export default function EnableDemoModeButton({ enabled, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: "absolute",
        left: 22,
        bottom: 22,
        zIndex: 50,
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(140,170,220,0.20)",
        background: enabled ? "rgba(47,191,113,0.16)" : "rgba(10,12,16,0.72)",
        color: "rgba(230,240,255,0.92)",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        letterSpacing: 0.3,
      }}
    >
      {enabled ? "Demo Mode: ON" : "Demo Mode: OFF"}
    </button>
  );
}
