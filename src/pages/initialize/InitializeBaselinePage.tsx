import React, { useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import type { BaselineV1 } from "@/onboard/baseline"
import PortalNav from "@/components/nav/PortalNav"

/* ═══════════════════════════════════════════════════════════════════
   STRATFIT — Initiate Command Center (God Mode Single-Page HUD)

   Single-page tactical grid. Machined bezel modules.
   All 8 data modules visible at once with live outcome rail.
   ═══════════════════════════════════════════════════════════════════ */

type AccessToCapital = "Moderate" | "Strong"
type HiringVelocity = "Low" | "Medium" | "High"
type BurnFlexibility = "Fixed" | "Variable"
type RiskTolerance = "Conservative" | "Balanced" | "Aggressive"
type InputPath = "manual" | "xero" | "excel"

interface FormState {
  contactName: string
  contactEmail: string
  companyName: string
  industry: string
  stage: string
  cashOnHand: number
  monthlyNetBurn: number
  debtOutstanding: number
  debtInterestRate: number
  fundraisingWindow: number
  accessToCapital: AccessToCapital
  currentARR: number
  monthlyGrowthPct: number
  grossMarginPct: number
  avgDealSize: number
  monthlyChurnPct: number
  salesEfficiency: number
  netRevenueRetentionPct: number
  headcount: number
  avgFullyLoadedCost: number
  salesMarketingSpend: number
  rdSpend: number
  gaSpend: number
  cogsPct: number
  cac: number
  hiringVelocity: HiringVelocity
  salesRampTime: number
  engineeringVelocity: number
  burnFlexibility: BurnFlexibility
  riskTolerance: RiskTolerance
  targetGrowthBand: number
  priorityBalance: number
  annualCapex: number
  capexIntensityPct: number
  arDays: number
  apDays: number
}

const INITIAL: FormState = {
  contactName: "", contactEmail: "", companyName: "", industry: "", stage: "",
  cashOnHand: 500_000, monthlyNetBurn: 75_000, debtOutstanding: 0, debtInterestRate: 0,
  fundraisingWindow: 6, accessToCapital: "Moderate",
  currentARR: 1_200_000, monthlyGrowthPct: 8, grossMarginPct: 70, avgDealSize: 3_200,
  monthlyChurnPct: 3, salesEfficiency: 1.0, netRevenueRetentionPct: 110,
  headcount: 18, avgFullyLoadedCost: 140_000, salesMarketingSpend: 60_000,
  rdSpend: 80_000, gaSpend: 30_000, cogsPct: 45_000, cac: 8_000,
  hiringVelocity: "Medium", salesRampTime: 4, engineeringVelocity: 4, burnFlexibility: "Variable",
  riskTolerance: "Balanced", targetGrowthBand: 4, priorityBalance: 50,
  annualCapex: 120_000, capexIntensityPct: 10, arDays: 45, apDays: 30,
}

const STAGES = ["Ideation", "Startup", "Early Growth", "Growth", "High Growth", "Scale", "Exit Ready"]
const INDUSTRIES = ["SaaS", "Fintech", "HealthTech", "EdTech", "E-Commerce", "AI / ML", "DevTools", "Marketplace", "Hardware", "Other"]

/* ── Helpers ── */

function fmtCurrency(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(Math.abs(v) / 1_000).toFixed(0)}K`
  return `$${Math.round(Math.abs(v)).toLocaleString()}`
}

function computeMetrics(f: FormState) {
  const monthlyCapex = f.annualCapex / 12
  const effectiveBurn = f.monthlyNetBurn + monthlyCapex
  const monthlyRevenue = f.currentARR / 12
  const wcCashTied = Math.max(0, f.arDays - f.apDays) / 30 * monthlyRevenue
  const effectiveCash = Math.max(0, f.cashOnHand - wcCashTied)
  const runway = effectiveBurn > 0 ? effectiveCash / effectiveBurn : 0
  const monthlyRevGrowth = (f.monthlyGrowthPct / 100) * monthlyRevenue
  const burnMultiple = monthlyRevGrowth > 0 ? effectiveBurn / monthlyRevGrowth : 0
  let prob = 0
  if (runway >= 24) prob = 80
  else if (runway >= 18) prob = 65
  else if (runway >= 12) prob = 45
  else if (runway >= 6) prob = 25
  else prob = Math.max(0, Math.round((runway / 6) * 25))
  if (f.monthlyGrowthPct > 5) prob += 8
  if (f.netRevenueRetentionPct > 100) prob += 7
  if (f.monthlyChurnPct < 3) prob += 5
  if (f.capexIntensityPct > 25) prob -= 5
  if ((f.arDays - f.apDays) > 60) prob -= 4
  prob = Math.min(100, Math.max(0, prob))
  const totalCost = f.headcount * f.avgFullyLoadedCost + f.salesMarketingSpend + f.rdSpend + f.gaSpend + f.annualCapex
  const operatingProfit = f.currentARR - totalCost
  const revenuePerHead = f.headcount > 0 ? Math.round(f.currentARR / f.headcount) : 0
  return {
    runway: Number.isFinite(runway) ? runway : 0,
    burnMultiple: Number.isFinite(burnMultiple) ? burnMultiple : 0,
    monthlyBurn: effectiveBurn,
    survivalProbability: prob,
    operatingProfit,
    revenuePerHead,
  }
}

/* ── CSV helpers ── */

const CSV_FIELD_MAP: Array<{ key: keyof FormState; label: string; example: string }> = [
  { key: "contactName", label: "Contact Name", example: "Jane Doe" },
  { key: "contactEmail", label: "Email", example: "jane@acme.com" },
  { key: "companyName", label: "Company Name", example: "Acme Inc" },
  { key: "industry", label: "Industry", example: "SaaS" },
  { key: "stage", label: "Stage", example: "Early Growth" },
  { key: "cashOnHand", label: "Cash on Hand ($)", example: "500000" },
  { key: "monthlyNetBurn", label: "Monthly Net Burn ($)", example: "75000" },
  { key: "debtOutstanding", label: "Debt Outstanding ($)", example: "0" },
  { key: "debtInterestRate", label: "Debt Interest Rate (%)", example: "0" },
  { key: "fundraisingWindow", label: "Fundraising Window (months)", example: "6" },
  { key: "accessToCapital", label: "Access to Capital (Moderate/Strong)", example: "Moderate" },
  { key: "currentARR", label: "Current ARR ($)", example: "1200000" },
  { key: "monthlyGrowthPct", label: "Monthly Growth (%)", example: "8" },
  { key: "grossMarginPct", label: "Gross Margin (%)", example: "70" },
  { key: "avgDealSize", label: "Average Deal Size / ACV ($)", example: "3200" },
  { key: "monthlyChurnPct", label: "Monthly Churn (%)", example: "3" },
  { key: "salesEfficiency", label: "Sales Efficiency (x)", example: "1.0" },
  { key: "netRevenueRetentionPct", label: "Net Revenue Retention (%)", example: "110" },
  { key: "headcount", label: "Headcount", example: "18" },
  { key: "avgFullyLoadedCost", label: "Avg Fully Loaded Cost ($)", example: "140000" },
  { key: "salesMarketingSpend", label: "Sales & Marketing Spend ($)", example: "60000" },
  { key: "rdSpend", label: "R&D Spend ($)", example: "80000" },
  { key: "gaSpend", label: "G&A Spend ($)", example: "30000" },
  { key: "cogsPct", label: "COGS ($)", example: "45000" },
  { key: "cac", label: "CAC ($)", example: "8000" },
  { key: "hiringVelocity", label: "Hiring Velocity (Low/Medium/High)", example: "Medium" },
  { key: "salesRampTime", label: "Sales Ramp Time (months)", example: "4" },
  { key: "engineeringVelocity", label: "Engineering Velocity (months)", example: "4" },
  { key: "burnFlexibility", label: "Burn Flexibility (Fixed/Variable)", example: "Variable" },
  { key: "riskTolerance", label: "Risk Tolerance (Conservative/Balanced/Aggressive)", example: "Balanced" },
  { key: "targetGrowthBand", label: "Target Growth Band (months)", example: "4" },
  { key: "priorityBalance", label: "Priority Balance (0=Survival, 100=Expansion)", example: "50" },
  { key: "annualCapex", label: "Annual CAPEX ($)", example: "120000" },
  { key: "capexIntensityPct", label: "CAPEX Intensity (% of Revenue)", example: "10" },
  { key: "arDays", label: "Accounts Receivable Days", example: "45" },
  { key: "apDays", label: "Accounts Payable Days", example: "30" },
]

function generateCSVTemplate(): string {
  return CSV_FIELD_MAP.map((f) => f.label).join(",") + "\n" + CSV_FIELD_MAP.map((f) => f.example).join(",")
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function parseCSVToForm(text: string): Partial<FormState> | null {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return null
  const headers = lines[0].split(",").map((h) => h.trim())
  const values = lines[1].split(",").map((v) => v.trim())
  const result: Record<string, unknown> = {}
  const numericKeys: Array<keyof FormState> = [
    "cashOnHand", "monthlyNetBurn", "debtOutstanding", "debtInterestRate",
    "fundraisingWindow", "currentARR", "monthlyGrowthPct", "grossMarginPct",
    "avgDealSize", "monthlyChurnPct", "salesEfficiency", "netRevenueRetentionPct",
    "headcount", "avgFullyLoadedCost", "salesMarketingSpend", "rdSpend",
    "gaSpend", "cogsPct", "cac", "salesRampTime", "engineeringVelocity",
    "targetGrowthBand", "priorityBalance",
    "annualCapex", "capexIntensityPct", "arDays", "apDays",
  ]
  for (const field of CSV_FIELD_MAP) {
    const idx = headers.findIndex((h) => h.toLowerCase() === field.label.toLowerCase())
    if (idx === -1 || !values[idx]) continue
    const raw = values[idx]
    if (numericKeys.includes(field.key)) {
      const n = Number(raw.replace(/[$,%]/g, ""))
      if (!Number.isNaN(n)) result[field.key] = n
    } else {
      result[field.key] = raw
    }
  }
  return result as Partial<FormState>
}

/* ═══════════════════════════════════════════════════════════════════
   TACTICAL SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function Module({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{
      display: "flex", flexDirection: "column", overflow: "hidden",
      background: "linear-gradient(145deg, rgba(14,34,56,0.95), rgba(10,28,46,0.98))",
      border: "1px solid rgba(34,211,238,0.12)",
      borderRadius: 12,
      boxShadow: "0 1px 0 rgba(34,211,238,0.06) inset, 0 -1px 0 rgba(0,0,0,0.3) inset, 0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(34,211,238,0.15)",
      backdropFilter: "blur(8px)",
      ...style,
    }}>
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, #22D3EE 30%, #22D3EE 70%, transparent 100%)", borderRadius: "12px 12px 0 0", flexShrink: 0 }} />
      <header style={SC.moduleHeader}>{title}</header>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </section>
  )
}

function PowerBar({ label, value, max, unit = "", color = "cyan", onChange }: {
  label: string; value: number; max: number; unit?: string; color?: "cyan" | "amber"; onChange?: (v: number) => void
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const isCyan = color === "cyan"
  const display = unit === "%" ? `${value.toFixed(1)}${unit}`
    : unit === "x" ? `${value.toFixed(1)}${unit}`
    : unit ? `${value.toLocaleString()}${unit}`
    : value >= 1_000_000 ? `$${(value / 1e6).toFixed(1)}M`
    : value >= 1_000 ? `$${(value / 1e3).toFixed(0)}K`
    : `${value.toLocaleString()}`

  const trackColor = isCyan ? "#22D3EE" : "#f59e0b"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={SC.powerLabel}>{label}</span>
        <span style={{ ...SC.powerValue, color: trackColor }}>{display}</span>
      </div>
      <div style={{ ...SC.powerTrack, position: "relative" }}>
        <div
          style={{ ...SC.powerFill, width: `${pct}%`, background: trackColor, boxShadow: `0 0 8px ${trackColor}66` }}
        />
        {onChange && (
          <input
            type="range"
            min={0} max={max} step={max > 100 ? max / 200 : 0.1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={isCyan ? "gm-range-cyan" : "gm-range-amber"}
            style={SC.rangeInput}
          />
        )}
      </div>
    </div>
  )
}

function TacticalInput({ label, value, prefix, suffix, placeholder, onChange }: {
  label: string; value?: string | number; prefix?: string; suffix?: string
  placeholder?: string; onChange?: (v: string) => void
}) {
  const display = typeof value === "number" ? value.toLocaleString() : value ?? ""
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={SC.inputLabel}>{label}</label>
      <div className="bezel-carved" style={SC.inputWrap}>
        {prefix && <span style={SC.inputAffix}>{prefix}</span>}
        <input
          style={SC.inputInner}
          type="text"
          inputMode="numeric"
          value={display}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value.replace(/,/g, ""))}
        />
        {suffix && <span style={SC.inputAffix}>{suffix}</span>}
      </div>
    </div>
  )
}

function StatusToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 0",
        borderRadius: 8,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontFamily: FONT,
        cursor: "pointer",
        transition: "all 0.15s",
        border: active ? "1px solid #22D3EE" : "1px solid #1E3A5F",
        background: active ? "#22D3EE" : "#122E48",
        color: active ? "#04121F" : "#8FB4D9",
        boxShadow: active ? "0 0 10px rgba(34,211,238,0.3)" : "none",
      }}
    >
      {label}
    </button>
  )
}

function ToggleRow<T extends string>({ label, options, value, onChange }: {
  label: string; options: T[]; value: T; onChange: (v: T) => void
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={SC.toggleLabel}>{label}</span>
      <div style={SC.toggleGroup}>
        {options.map((opt) => (
          <button
            key={opt} type="button"
            onClick={() => onChange(opt)}
            style={{
              ...SC.toggleBtn,
              ...(value === opt ? SC.toggleBtnActive : {}),
            }}
          >{opt}</button>
        ))}
      </div>
    </div>
  )
}

function BinarySwitch({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 500, color: "#E6F1FF", letterSpacing: "0.02em" }}>{label}</span>
      <div style={{ display: "flex", padding: 2, background: "#0A1C2E", borderRadius: 6, border: "1px solid #1E3A5F" }}>
        <button type="button" onClick={() => { if (!active) onToggle() }} style={{
          padding: "4px 12px", fontSize: 9, fontWeight: 700, borderRadius: 4, border: "none", fontFamily: FONT,
          cursor: "pointer", transition: "all 0.15s",
          background: active ? "#22D3EE" : "transparent",
          color: active ? "#04121F" : "#8FB4D9",
          boxShadow: active ? "0 0 8px rgba(34,211,238,0.3)" : "none",
        }}>Yes</button>
        <button type="button" onClick={() => { if (active) onToggle() }} style={{
          padding: "4px 12px", fontSize: 9, fontWeight: 700, borderRadius: 4, border: "none", fontFamily: FONT,
          cursor: "pointer", transition: "all 0.15s",
          background: !active ? "#122E48" : "transparent",
          color: !active ? "#8FB4D9" : "#8FB4D9",
        }}>No</button>
      </div>
    </div>
  )
}

function GaugeKnob({ angle }: { angle: number }) {
  const SIZE = 180
  const CX = SIZE / 2
  const CY = SIZE / 2

  const R_PLATE = 82
  const R_CHROME = 68
  const R_GRIP = 60
  const R_CAP = 34
  const R_INDICATOR = 52

  const arcStart = -135
  const arcEnd = 135
  const arcRange = arcEnd - arcStart

  const normalised = (angle + 45) / 90
  const sweepAngle = arcStart + normalised * arcRange
  const needleRad = (sweepAngle * Math.PI) / 180

  const arcPath = (startDeg: number, endDeg: number, r: number) => {
    const s = (startDeg * Math.PI) / 180
    const e = (endDeg * Math.PI) / 180
    const x1 = CX + r * Math.cos(s)
    const y1 = CY + r * Math.sin(s)
    const x2 = CX + r * Math.cos(e)
    const y2 = CY + r * Math.sin(e)
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  const KNURL_COUNT = 48
  const knurls = []
  for (let i = 0; i < KNURL_COUNT; i++) {
    const deg = (i / KNURL_COUNT) * 360
    const rad = (deg * Math.PI) / 180
    const r1 = R_GRIP + 1
    const r2 = R_GRIP - 3
    knurls.push(
      <line key={`k${i}`}
        x1={CX + r1 * Math.cos(rad)} y1={CY + r1 * Math.sin(rad)}
        x2={CX + r2 * Math.cos(rad)} y2={CY + r2 * Math.sin(rad)}
        stroke="rgba(140,175,210,0.12)" strokeWidth={1} strokeLinecap="round"
      />
    )
  }

  const TICK_COUNT = 21
  const ticks = []
  const labels: React.ReactNode[] = []
  for (let i = 0; i <= TICK_COUNT; i++) {
    const deg = arcStart + (i / TICK_COUNT) * arcRange
    const rad = (deg * Math.PI) / 180
    const isMajor = i % 7 === 0
    const isMid = i % 7 !== 0 && i % 3 === 0
    const r1 = R_PLATE - 2
    const r2 = isMajor ? R_PLATE - 14 : isMid ? R_PLATE - 10 : R_PLATE - 7
    const color = isMajor ? "#8FB4D9" : isMid ? "#4A6A8A" : "#1E3A5F"
    const w = isMajor ? 2 : 1
    ticks.push(
      <line key={`t${i}`}
        x1={CX + r1 * Math.cos(rad)} y1={CY + r1 * Math.sin(rad)}
        x2={CX + r2 * Math.cos(rad)} y2={CY + r2 * Math.sin(rad)}
        stroke={color} strokeWidth={w} strokeLinecap="round"
      />
    )
    if (isMajor) {
      const lr = R_PLATE + 8
      const val = Math.round((i / TICK_COUNT) * 100)
      labels.push(
        <text key={`l${i}`}
          x={CX + lr * Math.cos(rad)} y={CY + lr * Math.sin(rad) + 3}
          textAnchor="middle" fontSize={8} fontWeight={600}
          fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          fill="#4A6A8A"
        >
          {val}
        </text>
      )
    }
  }

  const indicatorTipX = CX + R_INDICATOR * Math.cos(needleRad)
  const indicatorTipY = CY + R_INDICATOR * Math.sin(needleRad)
  const indicatorBaseX1 = CX + 3 * Math.cos(needleRad + Math.PI / 2)
  const indicatorBaseY1 = CY + 3 * Math.sin(needleRad + Math.PI / 2)
  const indicatorBaseX2 = CX + 3 * Math.cos(needleRad - Math.PI / 2)
  const indicatorBaseY2 = CY + 3 * Math.sin(needleRad - Math.PI / 2)

  const dotR = R_GRIP - 5
  const dotX = CX + dotR * Math.cos(needleRad)
  const dotY = CY + dotR * Math.sin(needleRad)

  const pctText = `${Math.round(normalised * 100)}%`

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0 }}>
      <defs>
        {/* Backplate metallic gradient */}
        <radialGradient id="gk-plate" cx="42%" cy="38%">
          <stop offset="0%" stopColor="#1A2A3E" />
          <stop offset="60%" stopColor="#0C1824" />
          <stop offset="100%" stopColor="#060C14" />
        </radialGradient>

        {/* Chrome bezel ring gradient */}
        <linearGradient id="gk-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5A7A9A" />
          <stop offset="25%" stopColor="#2A3E52" />
          <stop offset="50%" stopColor="#1A2A3E" />
          <stop offset="75%" stopColor="#2A3E52" />
          <stop offset="100%" stopColor="#4A6A8A" />
        </linearGradient>

        {/* Brushed-metal knob body */}
        <radialGradient id="gk-body" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#2A4058" />
          <stop offset="40%" stopColor="#1A2E44" />
          <stop offset="80%" stopColor="#0E1C2C" />
          <stop offset="100%" stopColor="#081420" />
        </radialGradient>

        {/* Cap dome highlight */}
        <radialGradient id="gk-cap" cx="40%" cy="32%">
          <stop offset="0%" stopColor="#2E4A64" />
          <stop offset="50%" stopColor="#162838" />
          <stop offset="100%" stopColor="#0A1620" />
        </radialGradient>

        {/* Specular highlight on the cap */}
        <radialGradient id="gk-spec" cx="38%" cy="28%">
          <stop offset="0%" stopColor="rgba(180,210,240,0.30)" />
          <stop offset="100%" stopColor="rgba(180,210,240,0)" />
        </radialGradient>

        {/* Cyan glow filter */}
        <filter id="gk-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Soft shadow under the knob */}
        <filter id="gk-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        {/* Active arc glow */}
        <filter id="gk-arc-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Drop shadow */}
      <circle cx={CX} cy={CY + 3} r={R_PLATE + 2} fill="rgba(0,0,0,0.5)" filter="url(#gk-shadow)" />

      {/* Scale labels */}
      {labels}

      {/* Backplate */}
      <circle cx={CX} cy={CY} r={R_PLATE} fill="url(#gk-plate)" />
      <circle cx={CX} cy={CY} r={R_PLATE} fill="none" stroke="#1A2A3E" strokeWidth={2} />
      <circle cx={CX} cy={CY} r={R_PLATE - 1} fill="none" stroke="rgba(100,140,180,0.08)" strokeWidth={0.5} />

      {/* Scale arc — background track */}
      <path d={arcPath(arcStart, arcEnd, R_PLATE - 8)} fill="none" stroke="#0C1824" strokeWidth={5} strokeLinecap="round" />
      <path d={arcPath(arcStart, arcEnd, R_PLATE - 8)} fill="none" stroke="#1A2A3E" strokeWidth={3} strokeLinecap="round" />

      {/* Scale arc — active sweep (cyan) */}
      <path d={arcPath(arcStart, sweepAngle, R_PLATE - 8)} fill="none" stroke="#22D3EE" strokeWidth={3} strokeLinecap="round" opacity={0.4} filter="url(#gk-arc-glow)" />
      <path d={arcPath(arcStart, sweepAngle, R_PLATE - 8)} fill="none" stroke="#22D3EE" strokeWidth={2} strokeLinecap="round" />

      {/* Tick marks */}
      {ticks}

      {/* Chrome bezel ring */}
      <circle cx={CX} cy={CY} r={R_CHROME} fill="none" stroke="url(#gk-chrome)" strokeWidth={3} />
      <circle cx={CX} cy={CY} r={R_CHROME - 1.5} fill="none" stroke="rgba(100,140,180,0.06)" strokeWidth={0.5} />
      <circle cx={CX} cy={CY} r={R_CHROME + 1.5} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={0.5} />

      {/* Knob body — brushed metal */}
      <circle cx={CX} cy={CY} r={R_GRIP} fill="url(#gk-body)" />

      {/* Knurling texture */}
      {knurls}

      {/* Inner groove rings for machined look */}
      <circle cx={CX} cy={CY} r={R_GRIP - 6} fill="none" stroke="rgba(80,120,160,0.07)" strokeWidth={0.5} />
      <circle cx={CX} cy={CY} r={R_GRIP - 8} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />

      {/* Cap dome */}
      <circle cx={CX} cy={CY} r={R_CAP} fill="url(#gk-cap)" />
      <circle cx={CX} cy={CY} r={R_CAP} fill="none" stroke="rgba(80,120,160,0.15)" strokeWidth={1} />

      {/* Specular highlight on cap */}
      <ellipse cx={CX - 6} cy={CY - 8} rx={18} ry={12} fill="url(#gk-spec)" />

      {/* Indicator line — triangular pointer */}
      <polygon
        points={`${indicatorTipX},${indicatorTipY} ${indicatorBaseX1},${indicatorBaseY1} ${indicatorBaseX2},${indicatorBaseY2}`}
        fill="#22D3EE" filter="url(#gk-glow)"
      />

      {/* Indicator dot on knob body edge */}
      <circle cx={dotX} cy={dotY} r={3} fill="#22D3EE" filter="url(#gk-glow)" />

      {/* Center hub screw */}
      <circle cx={CX} cy={CY} r={6} fill="#0C1824" stroke="rgba(80,120,160,0.18)" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={3} fill="rgba(30,58,95,0.5)" />
      {/* Cross-head screw slot */}
      <line x1={CX - 2.5} y1={CY} x2={CX + 2.5} y2={CY} stroke="rgba(0,0,0,0.4)" strokeWidth={1} strokeLinecap="round" />
      <line x1={CX} y1={CY - 2.5} x2={CX} y2={CY + 2.5} stroke="rgba(0,0,0,0.4)" strokeWidth={1} strokeLinecap="round" />

      {/* Percentage readout */}
      <text x={CX} y={CY + R_CAP + 14} textAnchor="middle" fontSize={12} fontWeight={700}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        fill="#22D3EE" filter="url(#gk-glow)">
        {pctText}
      </text>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

const FORM_STORAGE_KEY = "stratfit:initiate-form"

function saveFormToStorage(f: FormState): void {
  try { window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(f)) } catch { /* quota */ }
}

function loadFormFromStorage(): FormState | null {
  try {
    const raw = window.localStorage.getItem(FORM_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<FormState>
    return { ...INITIAL, ...parsed }
  } catch { return null }
}

function hydrateFormFromBaseline(b: BaselineV1): FormState {
  return {
    ...INITIAL,
    contactName: b.company.founderName ?? "",
    contactEmail: b.company.contactEmail ?? "",
    companyName: b.company.legalName ?? "",
    industry: b.company.industry ?? "",
    stage: "",
    cashOnHand: b.financial.cashOnHand,
    monthlyNetBurn: b.financial.monthlyBurn,
    debtOutstanding: b.capital.totalDebt,
    debtInterestRate: b.capital.interestRatePct,
    currentARR: b.financial.arr,
    monthlyGrowthPct: b.financial.growthRatePct,
    grossMarginPct: b.financial.grossMarginPct,
    avgDealSize: b.operating.acv,
    monthlyChurnPct: b.operating.churnPct,
    netRevenueRetentionPct: b.financial.nrrPct,
    headcount: b.financial.headcount,
    avgFullyLoadedCost: b.financial.avgFullyLoadedCost,
    salesMarketingSpend: b.financial.salesMarketingSpend,
    rdSpend: b.financial.rdSpend,
    gaSpend: b.financial.gaSpend,
    cac: b.customerEngine.cac,
    salesRampTime: b.operating.salesCycleMonths,
    accessToCapital: b.posture.raiseIntent === "Yes" ? "Strong" : "Moderate",
    priorityBalance: b.posture.focus === "Growth" ? 70 : 40,
    annualCapex: b.investment?.annualCapex ?? INITIAL.annualCapex,
    capexIntensityPct: b.investment?.capexIntensityPct ?? INITIAL.capexIntensityPct,
    arDays: b.investment?.arDays ?? INITIAL.arDays,
    apDays: b.investment?.apDays ?? INITIAL.apDays,
  }
}

function loadInitialForm(baseline: BaselineV1 | null): FormState {
  const fromStorage = loadFormFromStorage()
  if (fromStorage) return fromStorage
  if (baseline) return hydrateFormFromBaseline(baseline)
  return { ...INITIAL }
}

export default function InitializeBaselinePage() {
  const navigate = useNavigate()
  const { baseline, setBaseline } = useSystemBaseline()

  const [form, setForm] = useState<FormState>(() => loadInitialForm(baseline))
  const [inputPath, setInputPath] = useState<InputPath>("manual")
  const [showXeroModal, setShowXeroModal] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [isLocking, setIsLocking] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value }
        saveFormToStorage(next)
        return next
      })
    }, [],
  )

  const metrics = useMemo(() => computeMetrics(form), [form])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const canLock = form.companyName.trim().length > 0 && form.cashOnHand > 0

  const handleLock = useCallback(() => {
    setIsLocking(true)

    const baseline: BaselineV1 = {
      version: 1,
      company: {
        legalName: form.companyName.trim() || "My Company",
        industry: form.industry || "SaaS",
        businessModel: "SaaS",
        primaryMarket: "B2B",
        founderName: form.contactName || "",
        contactEmail: form.contactEmail || "",
        contactPhone: "",
        jurisdiction: "",
      },
      financial: {
        arr: form.currentARR,
        growthRatePct: form.monthlyGrowthPct,
        grossMarginPct: form.grossMarginPct,
        revenueConcentrationPct: 0,
        monthlyBurn: form.monthlyNetBurn,
        payroll: form.headcount * (form.avgFullyLoadedCost / 12),
        headcount: form.headcount,
        cashOnHand: form.cashOnHand,
        nrrPct: form.netRevenueRetentionPct,
        avgFullyLoadedCost: form.avgFullyLoadedCost,
        salesMarketingSpend: form.salesMarketingSpend,
        rdSpend: form.rdSpend,
        gaSpend: form.gaSpend,
      },
      capital: {
        totalDebt: form.debtOutstanding,
        interestRatePct: form.debtInterestRate,
        monthlyDebtService: 0,
        lastRaiseAmount: 0,
        lastRaiseDateISO: null,
        equityRaisedToDate: 0,
      },
      operating: {
        churnPct: form.monthlyChurnPct,
        salesCycleMonths: form.salesRampTime,
        acv: form.avgDealSize,
        keyPersonDependency: "Medium",
        customerConcentrationRisk: "Medium",
        regulatoryExposure: "Low",
        activeCustomers: form.currentARR > 0 && form.avgDealSize > 0
          ? Math.round(form.currentARR / form.avgDealSize)
          : 0,
      },
      customerEngine: {
        cac: form.cac,
        ltv: form.avgDealSize > 0 && form.monthlyChurnPct > 0
          ? form.avgDealSize / (form.monthlyChurnPct / 100)
          : 0,
        paybackPeriodMonths: form.cac > 0 && form.avgDealSize > 0
          ? Math.round(form.cac / (form.avgDealSize / 12))
          : 0,
        expansionRatePct: form.netRevenueRetentionPct > 100
          ? form.netRevenueRetentionPct - 100
          : 0,
      },
      posture: {
        focus: form.priorityBalance > 60 ? "Growth" : "Stabilise",
        raiseIntent: form.accessToCapital === "Strong" ? "Yes" : "Uncertain",
        horizonMonths: 24,
        primaryConstraint: "Cash runway",
        fastestDownside: "Customer churn",
      },
      investment: {
        annualCapex: form.annualCapex,
        capexIntensityPct: form.capexIntensityPct,
        arDays: form.arDays,
        apDays: form.apDays,
      },
    }

    setBaseline(baseline)
    navigate("/position", { replace: true })
  }, [form, setBaseline, navigate])

  const handleDownloadTemplate = useCallback(() => {
    downloadCSV("stratfit-baseline-template.csv", generateCSVTemplate())
    setToast("Template downloaded — fill in your data and upload it back.")
  }, [])

  const handleFileUpload = useCallback((file: File) => {
    setUploadMsg(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== "string") { setUploadMsg({ type: "error", text: "Could not read file." }); return }
      const parsed = parseCSVToForm(text)
      if (!parsed || Object.keys(parsed).length === 0) { setUploadMsg({ type: "error", text: "No matching columns found." }); return }
      setForm((prev) => {
        const next = { ...prev, ...parsed }
        saveFormToStorage(next)
        return next
      })
      setUploadMsg({ type: "success", text: `Imported ${Object.keys(parsed).length} fields.` })
      setToast("Data imported successfully.")
    }
    reader.onerror = () => setUploadMsg({ type: "error", text: "File read error." })
    reader.readAsText(file)
  }, [])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    e.target.value = ""
  }, [handleFileUpload])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const runwayColor = metrics.runway < 6 ? "#f87171" : metrics.runway < 12 ? "#fbbf24" : "#34d399"
  const survivalColor = metrics.survivalProbability >= 60 ? "#34d399" : metrics.survivalProbability >= 30 ? "#fbbf24" : "#f87171"

  const needleAngle = form.riskTolerance === "Conservative" ? -45 : form.riskTolerance === "Aggressive" ? 45 : 0

  return (
    <div className="bg-hex-grid bg-grain bg-vignette" style={SC.page}>
      <PortalNav />

      {/* ═══ POWER RAIL — TOP BAR ═══ */}
      <header className="glow-cyan" style={SC.powerRail}>
        <div style={SC.powerRailLeft}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={SC.sysLabel}>INIT_SYSTEM</span>
            <span style={SC.sysTitle}>STRATFIT GOD MODE</span>
          </div>
          <span style={SC.railDivider} />
          <div style={SC.railTitle}>Initialize Baseline</div>
          <span style={{ fontSize: 11, color: "#8FB4D9", letterSpacing: "0.02em" }}>Enter your current financial truth to anchor scenario modelling.</span>
        </div>
        <div style={SC.metricsRow}>
          <div style={SC.metricBlock}>
            <span style={SC.metricLabel}>RUNWAY</span>
            <span style={{ ...SC.metricValue, color: runwayColor }}>{metrics.runway.toFixed(1)} MO</span>
          </div>
          <div style={SC.metricBlock}>
            <span style={SC.metricLabel}>BURN_MULT</span>
            <span style={{ ...SC.metricValue, color: "#22d3ee" }}>{metrics.burnMultiple.toFixed(2)}x</span>
          </div>
          <div style={SC.metricBlock}>
            <span style={SC.metricLabel}>$ BURN</span>
            <span style={{ ...SC.metricValue, color: "#f59e0b" }}>{fmtCurrency(metrics.monthlyBurn)}</span>
          </div>
          <div style={SC.metricBlock}>
            <span style={SC.metricLabel}>SURVIVAL</span>
            <span style={{ ...SC.metricValue, color: survivalColor }}>{metrics.survivalProbability}%</span>
          </div>
          <div style={SC.metricBlock}>
            <span style={SC.metricLabel}>SIMULATIONS</span>
            <span style={{ ...SC.metricValue, color: "rgba(167,139,250,0.9)" }}>10,000</span>
          </div>
        </div>
      </header>

      {/* ═══ INSTRUMENT PANEL GRID ═══ */}
      <main style={SC.grid} className="gm-scrollbar">
        <div style={SC.panelGrid} className="gm-scrollbar">

          {/* ═══ ROW 1 ═══ */}

          {/* ── IDENTITY PANEL ── */}
          <Module title="IDENTITY & CONTACT">
            <div style={SC.modBody}>
              <TacticalInput label="Your Name" value={form.contactName} placeholder="Your Name"
                onChange={(v) => update("contactName", v)} />
              <TacticalInput label="Email Address" value={form.contactEmail} placeholder="Email Address"
                onChange={(v) => update("contactEmail", v)} />
              <TacticalInput label="Company Name" value={form.companyName} placeholder="Company Name"
                onChange={(v) => update("companyName", v)} />
              <div>
                <span style={SC.inputLabel}>Stage</span>
                <div style={SC.pillGrid}>
                  {STAGES.map((s) => (
                    <StatusToggle key={s} label={s} active={form.stage === s} onClick={() => update("stage", s)} />
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={SC.inputLabel}>Industry</span>
                <div style={SC.pillGrid}>
                  {INDUSTRIES.map((ind) => (
                    <StatusToggle key={ind} label={ind} active={form.industry === ind} onClick={() => update("industry", ind)} />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {(["manual", "xero", "excel"] as InputPath[]).map((p) => (
                  <button key={p} type="button"
                    onClick={() => { setInputPath(p); if (p === "xero") setShowXeroModal(true) }}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: 8,
                      fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                      fontFamily: FONT, cursor: "pointer", transition: "all 0.15s",
                      border: inputPath === p ? "1px solid #22D3EE" : "1px solid #1E3A5F",
                      background: inputPath === p ? "#22D3EE" : "#122E48",
                      color: inputPath === p ? "#04121F" : "#8FB4D9",
                      boxShadow: inputPath === p ? "0 0 12px rgba(34,211,238,0.25)" : "none",
                    }}
                  >
                    {p === "manual" ? "Manual" : p === "xero" ? "Xero" : "Excel"}
                  </button>
                ))}
              </div>

              {inputPath === "excel" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={handleDownloadTemplate} style={SC.smallBtn}>Download Template</button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={SC.smallBtn}>Upload File</button>
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={onFileChange} />
                  </div>
                  <div
                    style={{ ...SC.dropZone, borderColor: dragOver ? "#22D3EE" : "#1E3A5F" }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span style={{ fontSize: 10, color: "#8FB4D9" }}>
                      {dragOver ? "Drop file here" : "Or drag CSV here"}
                    </span>
                  </div>
                  {uploadMsg && (
                    <span style={{ fontSize: 10, color: uploadMsg.type === "success" ? "#34d399" : "#ef4444" }}>{uploadMsg.text}</span>
                  )}
                </div>
              )}
            </div>
          </Module>

          {/* ── LIQUIDITY PANEL ── */}
          <Module title="LIQUIDITY & FUNDING">
            <div style={SC.modBody}>
              <PowerBar label="Cash on Hand" value={form.cashOnHand} max={5_000_000} color="cyan"
                onChange={(v) => update("cashOnHand", Math.round(v))} />
              <PowerBar label="Monthly Net Burn" value={form.monthlyNetBurn} max={500_000} color="amber"
                onChange={(v) => update("monthlyNetBurn", Math.round(v))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <TacticalInput label="Funding / Debt" value={form.debtOutstanding} prefix="$"
                  onChange={(v) => update("debtOutstanding", Number(v) || 0)} />
                <TacticalInput label="Interest Rate" value={form.debtInterestRate} suffix="%"
                  onChange={(v) => update("debtInterestRate", Number(v) || 0)} />
                <TacticalInput label="Fundraising Window" value={form.fundraisingWindow} suffix="months"
                  onChange={(v) => update("fundraisingWindow", Number(v) || 0)} />
              </div>
              <PowerBar label="Annual CAPEX" value={form.annualCapex} max={2_000_000} color="amber"
                onChange={(v) => update("annualCapex", Math.round(v))} />
              <PowerBar label="CAPEX as % of Revenue" value={form.capexIntensityPct} max={50} unit="%" color="amber"
                onChange={(v) => update("capexIntensityPct", Math.round(v * 10) / 10)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <TacticalInput label="AR Days" value={form.arDays} suffix="days"
                  onChange={(v) => update("arDays", Number(v) || 0)} />
                <TacticalInput label="AP Days" value={form.apDays} suffix="days"
                  onChange={(v) => update("apDays", Number(v) || 0)} />
              </div>
            </div>
          </Module>

          {/* ── REVENUE PANEL ── */}
          <Module title="REVENUE ENGINE">
            <div style={SC.modBody}>
              <PowerBar label="Current ARR" value={form.currentARR} max={10_000_000} color="cyan"
                onChange={(v) => update("currentARR", Math.round(v))} />
              <PowerBar label="Monthly Growth %" value={form.monthlyGrowthPct} max={30} unit="%" color="cyan"
                onChange={(v) => update("monthlyGrowthPct", Math.round(v * 10) / 10)} />
              <PowerBar label="Gross Margin %" value={form.grossMarginPct} max={100} unit="%" color="cyan"
                onChange={(v) => update("grossMarginPct", Math.round(v * 10) / 10)} />
              <TacticalInput label="Avg Contract Value" value={form.avgDealSize} prefix="$"
                onChange={(v) => update("avgDealSize", Number(v) || 0)} />
              <PowerBar label="Monthly Churn %" value={form.monthlyChurnPct} max={15} unit="%" color="amber"
                onChange={(v) => update("monthlyChurnPct", Math.round(v * 10) / 10)} />
              <PowerBar label="Sales Efficiency" value={form.salesEfficiency} max={3} unit="x" color="cyan"
                onChange={(v) => update("salesEfficiency", Math.round(v * 10) / 10)} />
              <PowerBar label="Net Revenue Retention" value={form.netRevenueRetentionPct} max={200} unit="%" color="cyan"
                onChange={(v) => update("netRevenueRetentionPct", Math.round(v))} />
            </div>
          </Module>

          {/* ═══ ROW 2 ═══ */}

          {/* ── OPERATING PANEL ── */}
          <Module title="OPERATING & VELOCITY">
            <div style={SC.modBody}>
              <ToggleRow label="Hiring Velocity" options={["Low", "Medium", "High"] as HiringVelocity[]}
                value={form.hiringVelocity} onChange={(v) => update("hiringVelocity", v)} />
              <PowerBar label="Sales Ramp Time" value={form.salesRampTime} max={12} unit=" mo" color="cyan"
                onChange={(v) => update("salesRampTime", Math.round(v))} />
              <PowerBar label="Engineering Velocity" value={form.engineeringVelocity} max={12} unit=" mo" color="cyan"
                onChange={(v) => update("engineeringVelocity", Math.round(v))} />
              <ToggleRow label="Burn Flexibility" options={["Fixed", "Variable"] as BurnFlexibility[]}
                value={form.burnFlexibility} onChange={(v) => update("burnFlexibility", v)} />
            </div>
          </Module>

          {/* ── COST PANEL ── */}
          <Module title="COST STRUCTURE">
            <div style={{ ...SC.modBody, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <TacticalInput label="Headcount" value={form.headcount}
                onChange={(v) => update("headcount", Number(v) || 0)} />
              <TacticalInput label="Fully Loaded Cost" value={form.avgFullyLoadedCost} prefix="$"
                onChange={(v) => update("avgFullyLoadedCost", Number(v) || 0)} />
              <TacticalInput label="Sales & Marketing" value={form.salesMarketingSpend} prefix="$"
                onChange={(v) => update("salesMarketingSpend", Number(v) || 0)} />
              <TacticalInput label="R&D Spend" value={form.rdSpend} prefix="$"
                onChange={(v) => update("rdSpend", Number(v) || 0)} />
              <TacticalInput label="G&A Spend" value={form.gaSpend} prefix="$"
                onChange={(v) => update("gaSpend", Number(v) || 0)} />
              <TacticalInput label="COGS" value={form.cogsPct} prefix="$"
                onChange={(v) => update("cogsPct", Number(v) || 0)} />
              <TacticalInput label="CAC" value={form.cac} prefix="$"
                onChange={(v) => update("cac", Number(v) || 0)} />
            </div>
          </Module>

          {/* ── STRATEGY PANEL ── */}
          <Module title="STRATEGIC POSTURE">
            <div style={{ ...SC.modBody, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#E6F1FF", letterSpacing: "0.08em", textTransform: "uppercase" }}>Risk Tolerance</span>

              <GaugeKnob angle={needleAngle} />

              <div style={{ display: "flex", gap: 0, width: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid #1E3A5F" }}>
                {(["Conservative", "Balanced", "Aggressive"] as RiskTolerance[]).map((r) => (
                  <button key={r} type="button" onClick={() => update("riskTolerance", r)} style={{
                    flex: 1, padding: "8px 0", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em",
                    textTransform: "uppercase", fontFamily: FONT, cursor: "pointer", transition: "all 0.15s",
                    border: "none",
                    background: form.riskTolerance === r ? "#22D3EE" : "#122E48",
                    color: form.riskTolerance === r ? "#04121F" : "#8FB4D9",
                  }}>{r}</button>
                ))}
              </div>

              <div style={{ width: "100%", marginTop: 4 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <BinarySwitch label="External Capital Required?" active={form.accessToCapital === "Strong"} onToggle={() => update("accessToCapital", form.accessToCapital === "Strong" ? "Moderate" : "Strong")} />
                  <BinarySwitch label="Focus on Runway?" active={form.priorityBalance < 40} onToggle={() => update("priorityBalance", form.priorityBalance < 40 ? 60 : 20)} />
                  <BinarySwitch label="Survival vs Expansion?" active={form.priorityBalance > 50} onToggle={() => update("priorityBalance", form.priorityBalance > 50 ? 30 : 70)} />
                  <BinarySwitch label="Growth-at-all-Costs?" active={form.priorityBalance > 75} onToggle={() => update("priorityBalance", form.priorityBalance > 75 ? 50 : 90)} />
                </div>
              </div>
            </div>
          </Module>

        </div>

        {/* ═══ DYNAMIC OUTCOME RAIL ═══ */}
        <div style={SC.outcomeRail} className="gm-scrollbar">
          <div style={{ padding: "0 20px 12px", borderBottom: "1px solid rgba(31,74,117,0.3)" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, #a78bfa 50%, transparent 100%)", borderRadius: 2, marginBottom: 10 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa" }}>Dynamic Outcome Rail</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", flex: 1, overflow: "auto" }}>
            <OutcomeCard label="Runway" value={`${metrics.runway.toFixed(1)} mo`} color={runwayColor} />
            <OutcomeCard label="ARR" value={fmtCurrency(form.currentARR)} color="#22D3EE" />
            <OutcomeCard label="Growth" value={`${form.monthlyGrowthPct.toFixed(1)}%`} color="#22D3EE" />
            <OutcomeCard label="Burn Multiple" value={`${metrics.burnMultiple.toFixed(2)}x`} color="#22D3EE" />
            <OutcomeCard label="Survival Prob." value={`${metrics.survivalProbability}%`} color={survivalColor} />
            <div style={{ height: 1, background: "rgba(31,74,117,0.3)", margin: "4px 0" }} />
            <OutcomeCard label="Gross Margin" value={`${form.grossMarginPct.toFixed(1)}%`} color="#34d399" />
            <OutcomeCard label="NRR" value={`${form.netRevenueRetentionPct}%`} color={form.netRevenueRetentionPct >= 100 ? "#34d399" : "#f87171"} />
            <OutcomeCard label="Churn" value={`${form.monthlyChurnPct.toFixed(1)}%`} color="#f59e0b" />
            <OutcomeCard label="Rev/Employee" value={fmtCurrency(metrics.revenuePerHead)} color="#a78bfa" />
            <OutcomeCard label="Op. Profit" value={`${metrics.operatingProfit < 0 ? "-" : ""}${fmtCurrency(Math.abs(metrics.operatingProfit))}`}
              color={metrics.operatingProfit >= 0 ? "#34d399" : "#f87171"} />
          </div>
        </div>
      </main>

      {/* ═══ CTA — LOCK BASELINE ═══ */}
      <div style={{ padding: "16px 28px 22px", flexShrink: 0, display: "flex", justifyContent: "center", maxWidth: 1800, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <button
          type="button"
          onClick={handleLock}
          disabled={!canLock || isLocking}
          className="sf-cta-glow"
          style={{
            width: "100%",
            maxWidth: 620,
            height: 60,
            padding: "0 56px",
            borderRadius: 12,
            border: "1px solid rgba(34,211,238,0.3)",
            background: isLocking
              ? "linear-gradient(90deg, #b91c1c 0%, #f87171 50%, #b91c1c 100%)"
              : "linear-gradient(90deg, #0891B2 0%, #22D3EE 35%, #67E8F9 50%, #22D3EE 65%, #0891B2 100%)",
            color: "#04121F",
            fontSize: 16, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase",
            fontFamily: FONT, cursor: canLock ? "pointer" : "default",
            opacity: canLock ? 1 : 0.35,
            transition: "all 0.25s",
            boxShadow: "0 0 40px rgba(34,211,238,0.4), 0 0 80px rgba(34,211,238,0.15), 0 4px 20px rgba(0,0,0,0.4)",
            whiteSpace: "nowrap",
          }}
        >
          {isLocking ? "CALCULATING VECTORS..." : "LOCK BASELINE & ENTER STRATFIT"}
        </button>
      </div>

      {/* ═══ XERO MODAL ═══ */}
      {showXeroModal && (
        <div style={SC.modalBackdrop} onClick={() => setShowXeroModal(false)}>
          <div style={SC.modalCard} onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: 36 }}>&#9741;</span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#E6F1FF" }}>Connect Your Xero Account</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#8FB4D9", lineHeight: 1.55 }}>
              Automatically import P&amp;L, balance sheet, and cash flow data from Xero.
            </p>
            <button type="button" style={SC.modalBtn}
              onClick={() => { setShowXeroModal(false); setToast("Xero integration coming soon.") }}>
              Authorize with Xero
            </button>
            <button type="button" style={SC.modalClose} onClick={() => setShowXeroModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && <div style={SC.toast}>{toast}</div>}

      <style>{`
        @keyframes sfInitToastIn { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes sfCtaPulse { 0%,100% { box-shadow: 0 0 40px rgba(34,211,238,0.4), 0 0 80px rgba(34,211,238,0.15), 0 4px 20px rgba(0,0,0,0.4); } 50% { box-shadow: 0 0 50px rgba(34,211,238,0.55), 0 0 100px rgba(34,211,238,0.2), 0 4px 24px rgba(0,0,0,0.4); } }
        .sf-cta-glow:not(:disabled):hover { animation: sfCtaPulse 1.5s ease-in-out infinite; }

        .gm-range-cyan::-webkit-slider-thumb,
        .gm-range-amber::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: box-shadow 0.15s;
        }
        .gm-range-cyan::-webkit-slider-thumb {
          background: #22D3EE;
          box-shadow: 0 0 10px rgba(34,211,238,0.6);
        }
        .gm-range-amber::-webkit-slider-thumb {
          background: #f59e0b;
          box-shadow: 0 0 10px rgba(245,158,11,0.6);
        }
        .gm-range-cyan::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px rgba(34,211,238,0.8);
          transform: scale(1.2);
        }
        .gm-range-amber::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px rgba(245,158,11,0.8);
          transform: scale(1.2);
        }

        .gm-range-cyan::-moz-range-thumb,
        .gm-range-amber::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }
        .gm-range-cyan::-moz-range-thumb {
          background: #22D3EE;
          box-shadow: 0 0 10px rgba(34,211,238,0.6);
        }
        .gm-range-amber::-moz-range-thumb {
          background: #f59e0b;
          box-shadow: 0 0 10px rgba(245,158,11,0.6);
        }

        .gm-range-cyan::-webkit-slider-runnable-track,
        .gm-range-amber::-webkit-slider-runnable-track {
          background: transparent;
          height: 100%;
        }
        .gm-range-cyan::-moz-range-track,
        .gm-range-amber::-moz-range-track {
          background: transparent;
          height: 100%;
        }
      `}</style>
    </div>
  )
}

function OutcomeCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: 8,
      background: "rgba(10,28,46,0.7)",
      border: "1px solid rgba(30,58,95,0.6)",
      boxShadow: `0 0 1px ${color}22 inset, 0 2px 8px rgba(0,0,0,0.25)`,
      transition: "box-shadow 0.2s, border-color 0.2s",
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8FB4D9" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "ui-monospace, 'JetBrains Mono', monospace", color, textShadow: `0 0 12px ${color}88` }}>{value}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"

const SC: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
    color: "#E6F1FF", fontFamily: FONT,
    background: "#020617",
  },
  powerRail: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: 56, padding: "0 28px", flexShrink: 0,
    background: "#0E2238",
    borderBottom: "1px solid #1E3A5F",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    zIndex: 5,
  },
  powerRailLeft: {
    display: "flex", alignItems: "center", gap: 18, minWidth: 0,
  },
  sysLabel: {
    fontSize: 8, fontWeight: 700, color: "#22D3EE", letterSpacing: "0.18em", textTransform: "uppercase",
  },
  sysTitle: {
    fontSize: 14, fontWeight: 800, fontStyle: "italic", color: "#22D3EE", letterSpacing: "0.06em",
    textShadow: "0 0 14px rgba(34,211,238,0.3)",
  },
  railDivider: {
    width: 1, height: 28, background: "#1E3A5F", flexShrink: 0,
  },
  railTitle: {
    fontSize: 16, fontWeight: 700, color: "#E6F1FF", whiteSpace: "nowrap", letterSpacing: "0.02em",
  },
  metricsRow: {
    display: "flex", alignItems: "center", gap: 24, flexShrink: 0,
  },
  metricBlock: {
    display: "flex", flexDirection: "column", alignItems: "flex-end",
    padding: "6px 14px",
    borderRadius: 8,
    background: "#0A1C2E",
    border: "1px solid #1E3A5F",
  },
  metricLabel: {
    fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8FB4D9",
  },
  metricValue: {
    fontSize: 15, fontWeight: 800, fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
    textShadow: "0 0 12px currentColor",
  },

  grid: {
    flex: 1, display: "grid", gridTemplateColumns: "1fr 280px",
    gap: 0, padding: "0 28px 0", minHeight: 0, overflow: "hidden",
    maxWidth: 1800, margin: "0 auto", width: "100%", boxSizing: "border-box",
    zIndex: 1,
  },
  panelGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    gap: 40, padding: "36px 40px 28px 0", minHeight: 0, overflow: "auto",
  },
  outcomeRail: {
    display: "flex", flexDirection: "column", gap: 0,
    padding: "36px 0 28px 0", minHeight: 0, overflow: "auto",
    borderLeft: "1px solid #1E3A5F",
  },

  moduleHeader: {
    position: "relative",
    padding: "12px 32px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#8FB4D9",
    background: "rgba(6,18,31,0.4)",
    borderBottom: "1px solid rgba(31,74,117,0.25)",
    marginBottom: 0,
  },
  modBody: {
    padding: "24px 32px 28px", display: "flex", flexDirection: "column", gap: 16,
  },

  powerLabel: {
    fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8FB4D9",
  },
  powerValue: {
    fontSize: 13, fontWeight: 700, fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
    textShadow: "0 0 10px currentColor",
  },
  powerTrack: {
    height: 8, borderRadius: 4, overflow: "hidden",
    background: "#0F2A44",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4) inset",
  },
  powerFill: {
    height: "100%", borderRadius: 4, minWidth: 2,
  },
  rangeInput: {
    position: "absolute" as const, top: -4, left: 0,
    width: "100%", height: 16,
    appearance: "none", WebkitAppearance: "none",
    background: "transparent", borderRadius: 4, outline: "none", cursor: "pointer",
    margin: 0, padding: 0, zIndex: 2,
  },

  inputLabel: {
    fontSize: 10, fontWeight: 600, color: "#8FB4D9", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2,
  },
  inputWrap: {
    display: "flex", alignItems: "center", overflow: "hidden",
    background: "#0A1C2E",
    borderRadius: 8,
    border: "1px solid #1E3A5F",
    transition: "border-color 160ms ease, box-shadow 160ms ease",
  },
  inputInner: {
    flex: 1, height: 36, padding: "0 10px", fontSize: 13, fontWeight: 500, fontFamily: FONT,
    color: "#E6F1FF", background: "transparent", border: "none", outline: "none", minWidth: 0,
  },
  inputAffix: {
    padding: "0 10px", fontSize: 11, color: "#8FB4D9", flexShrink: 0, fontWeight: 500,
  },

  pillGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6,
  },

  toggleLabel: {
    fontSize: 10, fontWeight: 600, color: "#8FB4D9", letterSpacing: "0.02em",
  },
  toggleGroup: {
    display: "inline-flex", borderRadius: 8, overflow: "hidden",
    border: "1px solid #1E3A5F",
  },
  toggleBtn: {
    padding: "7px 14px", fontSize: 10, fontWeight: 600, fontFamily: FONT,
    color: "#8FB4D9", background: "#122E48", border: "none",
    cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.04em",
    borderRight: "1px solid #1E3A5F",
  },
  toggleBtnActive: {
    color: "#04121F", background: "#22D3EE",
    fontWeight: 700,
  },


  smallBtn: {
    flex: 1, padding: "8px 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
    fontFamily: FONT, borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
    border: "1px solid #1E3A5F", background: "#122E48", color: "#22D3EE",
  },
  dropZone: {
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: 52, border: "2px dashed #1E3A5F", borderRadius: 8,
    background: "#0A1C2E", cursor: "pointer", transition: "all 0.2s",
  },

  modalBackdrop: {
    position: "fixed", inset: 0, zIndex: 300,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(2,6,23,0.9)", backdropFilter: "blur(8px)",
  },
  modalCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
    padding: "40px 44px", maxWidth: 420, width: "90%", textAlign: "center",
    background: "#0E2238", border: "1px solid #1E3A5F", borderRadius: 14,
    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
  },
  modalBtn: {
    padding: "11px 30px", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
    fontFamily: FONT, borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
    border: "none",
    background: "#22D3EE",
    color: "#04121F",
    boxShadow: "0 0 14px rgba(34,211,238,0.3)",
  },
  modalClose: {
    fontSize: 11, color: "#8FB4D9", background: "none", border: "none",
    cursor: "pointer", fontFamily: FONT, padding: "6px 10px",
  },
  toast: {
    position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 400,
    padding: "12px 28px", fontSize: 12, fontWeight: 600, fontFamily: FONT,
    color: "#E6F1FF",
    background: "#0E2238",
    border: "1px solid #1E3A5F", borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
    animation: "sfInitToastIn 300ms ease-out",
  },
}
