import React from "react"

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
        <Shimmer width={64} height={14} />
        <div style={{ display: "flex", gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Shimmer key={i} width={48 + Math.random() * 24} height={10} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", padding: 24, gap: 24 }}>
        {/* Main */}
        <div style={{ flex: 1 }}>
          <Shimmer width="60%" height={24} style={{ marginBottom: 16 }} />
          <Shimmer width="40%" height={14} style={{ marginBottom: 32 }} />
          <Shimmer width="100%" height={300} radius={12} />
        </div>
        {/* Sidebar */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <Shimmer width="100%" height={160} radius={8} style={{ marginBottom: 16 }} />
          <Shimmer width="100%" height={120} radius={8} style={{ marginBottom: 16 }} />
          <Shimmer width="100%" height={80} radius={8} />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </div>
  )
}

function Shimmer({ width, height, radius = 4, style }: { width: number | string; height: number; radius?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, rgba(200,220,240,0.03) 0%, rgba(200,220,240,0.06) 50%, rgba(200,220,240,0.03) 100%)",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.6s ease-in-out infinite",
        ...style,
      }}
    />
  )
}
