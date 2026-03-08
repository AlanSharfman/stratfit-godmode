// src/components/ui/ComingSoonModule.tsx
// Shared premium "Coming Soon" module card used by Risk and Valuation pages.

import React from "react"

type ComingSoonModuleProps = {
  title: string
  subtitle: string
  bullets: string[]
}

export function ComingSoonModule({ title, subtitle, bullets }: ComingSoonModuleProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(11,31,54,0.72)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(33,212,253,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(110,91,255,0.12),transparent_35%)]" />
      <div className="relative z-10">
        <span className="inline-flex rounded-full border border-[rgba(110,91,255,0.35)] bg-[rgba(110,91,255,0.16)] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#EAF4FF]">
          COMING SOON
        </span>

        <h1 className="mt-4 text-3xl font-semibold text-[#EAF4FF]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#9DB7D1]">{subtitle}</p>

        <ul className="mt-6 space-y-3">
          {bullets.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[#EAF4FF]">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#21D4FD]" />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
