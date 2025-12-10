// src/components/ui/KPISparkline.tsx
import { useMemo } from "react";

interface SparkProps {
  values: number[];
  active?: boolean;
  color?: string;
}

export default function KPISparkline({
  values = [],
  active = false,
  color = "#22d3d3",
}: SparkProps) {
  // fallback so chart doesn't explode if values missing
  if (!values || values.length === 0) values = [0.2, 0.4];

  // normalize
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  // generate smooth coordinates
  const points = useMemo(() => {
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 100 - ((v - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");
  }, [values]);

  // glow + stroke widths based on active mode
  const mainStroke = active ? 2.6 : 2;
  const glowStroke = active ? 5 : 3;

  const glowColor = active ? `${color}66` : "#1e293b";

  return (
    <svg
      width="100%"
      height="40"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="transition-all duration-300"
    >
      {/* --- Glow layer --- */}
      <polyline
        points={points}
        fill="none"
        stroke={glowColor}
        strokeWidth={glowStroke}
        strokeLinecap="round"
        className="blur-[2px]"
      />

      {/* --- Gradient trail (premium) --- */}
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={`${color}00`} />
          <stop offset="45%" stopColor={`${color}66`} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>

      <polyline
        points={points}
        fill="none"
        stroke="url(#sparkGrad)"
        strokeWidth={mainStroke}
        strokeLinecap="round"
      />

      {/* --- Pulse dot on last data point --- */}
      {active && (
        <circle
          cx="100"
          cy={100 - ((values[values.length - 1] - min) / range) * 100}
          r="2.8"
          fill={color}
          className="animate-ping"
        />
      )}
    </svg>
  );
}
