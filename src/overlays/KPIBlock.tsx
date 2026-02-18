import React from "react";

export default function KPIBlock({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 12,
        background: "rgba(2,6,12,0.55)",
        border: "1px solid rgba(34,211,238,0.10)",
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
        {value}
        {unit && (
          <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 4 }}>{unit}</span>
        )}
      </div>
    </div>
  );
}
