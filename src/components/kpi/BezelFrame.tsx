// STRATFIT — KPI GROUP BEZEL FRAME (HARDWARE-GRADE, SVG/MASK)
// Layer stack (top → bottom):
// SVG frame (chamfer + notch) -> inner cavity -> header strip -> divider -> card rack -> bottom notch + glow bars

import React, { useId, useMemo } from "react";

type Accent = "cyan" | "emerald" | "indigo" | "red";
type Size = "wide" | "narrow" | "auto";

export type BezelFrameProps = {
  title: string;
  accent?: Accent;
  size?: Size;
  children: React.ReactNode;
  className?: string;
};

function accentToRgb(accent: Accent): string {
  switch (accent) {
    case "emerald":
      return "52,211,153";
    case "indigo":
      return "129,140,248";
    case "red":
      return "251,113,133";
    case "cyan":
    default:
      return "34,211,238";
  }
}

function sizeToClass(size: Size): string {
  if (size === "wide") return "min-w-0 flex-[1.15]";
  if (size === "narrow") return "min-w-0 flex-[0.9]";
  return "min-w-0 flex-1";
}

export default function BezelFrame({
  title,
  accent = "cyan",
  size = "auto",
  children,
  className,
}: BezelFrameProps) {
  const uid = useId().replace(/:/g, "");
  const rgb = useMemo(() => accentToRgb(accent), [accent]);

  const outerId = `sf-bezel-outer-${uid}`;
  const maskId = `sf-bezel-mask-${uid}`;
  const rimId = `sf-bezel-rim-${uid}`;
  const cavityId = `sf-bezel-cavity-${uid}`;

  // Hardware silhouette with chamfers + bottom-center notch cut-out (reference geometry target).
  // ViewBox: 1000 x 240
  const outerPath =
    // Bottom notch is a CONCAVE handle cut-out (goes up into the frame).
    "M60 18 H940 Q982 18 982 60 V178 Q982 206 952 206 H580 " +
    "Q560 206 550 198 Q540 190 520 190 H480 Q460 190 450 198 Q440 206 420 206 " +
    "H48 Q18 206 18 178 V60 Q18 18 60 18 Z";

  // Inner cavity inset (no notch, sits above notch basin)
  const cavityRect = { x: 44, y: 48, w: 912, h: 154, r: 18 };

  return (
    <section
      className={[
        "relative isolate",
        "h-[174px]", // bezel height (kept compact; group cards define internal density)
        sizeToClass(size),
        className ?? "",
      ].join(" ")}
      style={
        {
          ["--sf-accent" as string]: `rgba(${rgb},1)`,
          ["--sf-accentA" as string]: `rgba(${rgb},0.55)`,
          ["--sf-accentB" as string]: `rgba(${rgb},0.22)`,
        } as React.CSSProperties
      }
    >
      {/* SVG chassis (frame + cavity) */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 1000 240"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="22%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="52%" stopColor="rgba(0,0,0,0.32)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>

          <linearGradient id={cavityId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(8,10,14,0.92)" />
            <stop offset="55%" stopColor="rgba(6,8,12,0.94)" />
            <stop offset="100%" stopColor="rgba(4,6,10,0.98)" />
          </linearGradient>

          <filter id={outerId} x="-10%" y="-20%" width="120%" height="150%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="rgba(0,0,0,0.65)" />
            <feDropShadow dx="0" dy="-2" stdDeviation="10" floodColor="var(--sf-accentB)" />
          </filter>

          <mask id={maskId}>
            <rect width="100%" height="100%" fill="black" />
            <path d={outerPath} fill="white" />
            {/* punch out the inner cavity */}
            <rect
              x={cavityRect.x}
              y={cavityRect.y}
              width={cavityRect.w}
              height={cavityRect.h}
              rx={cavityRect.r}
              fill="black"
            />
          </mask>
        </defs>

        {/* Outer frame (masked so cavity is cut out) */}
        <rect
          x="0"
          y="0"
          width="1000"
          height="240"
          fill={`url(#${rimId})`}
          mask={`url(#${maskId})`}
          filter={`url(#${outerId})`}
        />

        {/* Accent rim (subtle, no hard edge) */}
        <path
          d={outerPath}
          fill="none"
          stroke="var(--sf-accentB)"
          strokeWidth="2"
          opacity="0.65"
        />

        {/* Inner cavity housing */}
        <rect
          x={cavityRect.x}
          y={cavityRect.y}
          width={cavityRect.w}
          height={cavityRect.h}
          rx={cavityRect.r}
          fill={`url(#${cavityId})`}
        />

        {/* Inner rim highlight */}
        <rect
          x={cavityRect.x + 1}
          y={cavityRect.y + 1}
          width={cavityRect.w - 2}
          height={cavityRect.h - 2}
          rx={cavityRect.r - 1}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
        />

        {/* Bottom notch “handle” inner lip */}
        <path
          d="M420 206 H580"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="2"
          opacity="0.55"
        />
      </svg>

      {/* Top light bar (short, centered; not full width) */}
      <div
        className="pointer-events-none absolute left-1/2 top-[10px] h-[3px] w-[34%] -translate-x-1/2 rounded-full"
        style={{
          background: "var(--sf-accentA)",
          boxShadow:
            "0 0 18px var(--sf-accentB), 0 0 34px rgba(0,0,0,0.12)",
          opacity: 0.75,
        }}
      />

      {/* Bottom light bar (short, centered above notch) */}
      <div
        className="pointer-events-none absolute left-1/2 bottom-[18px] h-[2px] w-[28%] -translate-x-1/2 rounded-full"
        style={{
          background: "var(--sf-accentB)",
          boxShadow:
            "0 0 16px var(--sf-accentB), 0 0 28px rgba(0,0,0,0.10)",
          opacity: 0.75,
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex h-full flex-col px-[18px] pt-[14px] pb-[18px]">
        {/* Header strip */}
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex flex-1 items-center justify-center">
            <div className="text-[11px] font-black tracking-[0.18em] uppercase text-white/90">
              {title}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <div className="flex flex-col gap-[3px] pr-[2px] opacity-60">
              <span className="h-[3px] w-[3px] rounded-full bg-[var(--sf-accent)]" />
              <span className="h-[3px] w-[3px] rounded-full bg-[var(--sf-accent)]" />
              <span className="h-[3px] w-[3px] rounded-full bg-[var(--sf-accent)]" />
            </div>
          </div>
        </div>

        {/* Divider line under header (thin) */}
        <div
          className="mt-[8px] h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(34,211,238,0.26), rgba(34,211,238,0.12), transparent)",
            opacity: 0.9,
          }}
        />

        {/* Card rack */}
        <div className="mt-[10px] flex-1">{children}</div>
      </div>
    </section>
  );
}


