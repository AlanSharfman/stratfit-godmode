import React from "react";

export default function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" height="32" viewBox="0 0 100 100">
      <polyline fill="none" stroke="#38bdf8" strokeWidth="2" points={points} />
    </svg>
  );
}
