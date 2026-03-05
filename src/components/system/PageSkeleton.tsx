import React from "react"

const NAV_WIDTHS = [52, 48, 56, 42, 62, 38, 54, 50]

export default function PageSkeleton() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#040810",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Nav skeleton */}
      <div style={{
        height: 52,
        background: "linear-gradient(180deg, rgba(10,18,32,0.95), rgba(6,12,24,0.98))",
        borderBottom: "1px solid rgba(34,211,238,0.06)",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 32,
      }}>
        <Shimmer width={64} height={14} delay={0} />
        <div style={{ display: "flex", gap: 16 }}>
          {NAV_WIDTHS.map((w, i) => (
            <Shimmer key={i} width={w} height={10} delay={i * 0.04} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", padding: 24, gap: 24 }}>
        {/* Main area — terrain placeholder */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Shimmer width={180} height={22} delay={0.1} />
            <Shimmer width={100} height={14} delay={0.15} />
          </div>
          <Shimmer width="100%" height={360} radius={12} delay={0.2} />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {[100, 80, 120, 90].map((w, i) => (
              <Shimmer key={i} width={w} height={32} radius={6} delay={0.3 + i * 0.05} />
            ))}
          </div>
        </div>
        {/* Sidebar */}
        <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <Shimmer width="100%" height={140} radius={10} delay={0.25} />
          <Shimmer width="100%" height={100} radius={10} delay={0.3} />
          <Shimmer width="100%" height={80} radius={10} delay={0.35} />
          <Shimmer width="60%" height={12} delay={0.4} />
        </div>
      </div>

      {/* Cinematic loading indicator */}
      <div style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        opacity: 0.3,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#22d3ee",
          animation: "pulse-dot 1.4s ease-in-out infinite",
        }} />
        <span style={{
          fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "rgba(34,211,238,0.5)", fontWeight: 600,
        }}>
          Loading terrain
        </span>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

function Shimmer({ width, height, radius = 4, delay = 0, style }: {
  width: number | string; height: number; radius?: number; delay?: number; style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, rgba(200,220,240,0.02) 0%, rgba(200,220,240,0.06) 50%, rgba(200,220,240,0.02) 100%)",
        backgroundSize: "800px 100%",
        animation: `shimmer 1.6s ease-in-out ${delay}s infinite`,
        opacity: 0,
        animationFillMode: "both",
        ...style,
      }}
    />
  )
}
