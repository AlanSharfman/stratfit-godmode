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
  const runway = f.monthlyNetBurn > 0 ? f.cashOnHand / f.monthlyNetBurn : 0
  const monthlyRevGrowth = (f.monthlyGrowthPct / 100) * (f.currentARR / 12)
  const burnMultiple = monthlyRevGrowth > 0 ? f.monthlyNetBurn / monthlyRevGrowth : 0
  let prob = 0
  if (runway >= 24) prob = 80
  else if (runway >= 18) prob = 65
  else if (runway >= 12) prob = 45
  else if (runway >= 6) prob = 25
  else prob = Math.max(0, Math.round((runway / 6) * 25))
  if (f.monthlyGrowthPct > 5) prob += 8
  if (f.netRevenueRetentionPct > 100) prob += 7
  if (f.monthlyChurnPct < 3) prob += 5
  prob = Math.min(100, prob)
  const totalCost = f.headcount * f.avgFullyLoadedCost + f.salesMarketingSpend + f.rdSpend + f.gaSpend
  const operatingProfit = f.currentARR - totalCost
  const revenuePerHead = f.headcount > 0 ? Math.round(f.currentARR / f.headcount) : 0
  return {
    runway: Number.isFinite(runway) ? runway : 0,
    burnMultiple: Number.isFinite(burnMultiple) ? burnMultiple : 0,
    monthlyBurn: f.monthlyNetBurn,
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
      background: "#07182A",
      border: "1px solid #1E3A5F",
      borderRadius: 14,
      boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      ...style,
    }}>
      <div style={{ height: 2, background: "#22D3EE", borderRadius: "14px 14px 0 0", flexShrink: 0 }} />
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
        background: active ? "#22D3EE" : "#0B243A",
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
          background: !active ? "#0B243A" : "transparent",
          color: !active ? "#8FB4D9" : "#8FB4D9",
        }}>No</button>
      </div>
    </div>
  )
}

function GaugeKnob({ angle }: { angle: number }) {
  const SIZE = 140
  const CX = SIZE / 2
  const CY = SIZE / 2
  const R_OUTER = 62
  const R_INNER = 48
  const R_NEEDLE = 42

  const arcStart = -135
  const arcEnd = 135
  const arcRange = arcEnd - arcStart

  const normalised = (angle + 45) / 90
  const sweepAngle = arcStart + normalised * arcRange
  const sweepRad = (sweepAngle * Math.PI) / 180
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

  const ticks = []
  for (let i = 0; i <= 10; i++) {
    const deg = arcStart + (i / 10) * arcRange
    const rad = (deg * Math.PI) / 180
    const isMajor = i % 5 === 0
    const r1 = isMajor ? R_OUTER - 2 : R_OUTER - 1
    const r2 = isMajor ? R_OUTER - 10 : R_OUTER - 6
    ticks.push(
      <line key={i}
        x1={CX + r1 * Math.cos(rad)} y1={CY + r1 * Math.sin(rad)}
        x2={CX + r2 * Math.cos(rad)} y2={CY + r2 * Math.sin(rad)}
        stroke={isMajor ? "#8FB4D9" : "#1E3A5F"} strokeWidth={isMajor ? 1.5 : 1} strokeLinecap="round"
      />
    )
  }

  const needleTipX = CX + R_NEEDLE * Math.cos(needleRad)
  const needleTipY = CY + R_NEEDLE * Math.sin(needleRad)
  const dotX = CX + (R_OUTER - 5) * Math.cos(sweepRad)
  const dotY = CY + (R_OUTER - 5) * Math.sin(sweepRad)

  const pctText = `${Math.round(normalised * 100)}%`

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="knobBg" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#0F2035" />
          <stop offset="100%" stopColor="#060D18" />
        </radialGradient>
        <filter id="knobGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <circle cx={CX} cy={CY} r={R_OUTER + 4} fill="none" stroke="#1E3A5F" strokeWidth={1.5} />
      <circle cx={CX} cy={CY} r={R_OUTER} fill="#0A1620" />
      <circle cx={CX} cy={CY} r={R_INNER} fill="url(#knobBg)" stroke="#1E3A5F" strokeWidth={1} />

      <path d={arcPath(arcStart, arcEnd, R_OUTER - 5)} fill="none" stroke="#1E3A5F" strokeWidth={3} strokeLinecap="round" />
      <path d={arcPath(arcStart, sweepAngle, R_OUTER - 5)} fill="none" stroke="#22D3EE" strokeWidth={3} strokeLinecap="round" filter="url(#knobGlow)" />

      {ticks}

      <line x1={CX} y1={CY} x2={needleTipX} y2={needleTipY}
        stroke="#22D3EE" strokeWidth={2.5} strokeLinecap="round" filter="url(#knobGlow)" />
      <circle cx={CX} cy={CY} r={5} fill="#0A1620" stroke="#22D3EE" strokeWidth={1.5} />
      <circle cx={dotX} cy={dotY} r={3} fill="#22D3EE" filter="url(#knobGlow)" />

      <text x={CX} y={CY + 22} textAnchor="middle" fontSize={11} fontWeight={700}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        fill="#22D3EE" style={{ textShadow: "0 0 8px rgba(34,211,238,0.5)" }}>
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
    }

    setBaseline(baseline)
    setTimeout(() => navigate("/position", { replace: true }), 800)
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

      {/* ═══ TACTICAL GRID ═══ */}
      <main style={SC.grid} className="gm-scrollbar">

        {/* ── COLUMN 1: Identity, Data Input, Execution Velocity ── */}
        <div style={SC.col1}>
          <Module title="MODULE A: IDENTITY & CONTACT">
            <div style={SC.modBody}>
              <TacticalInput label="Your Name" value={form.contactName} placeholder="Your Name"
                onChange={(v) => update("contactName", v)} />
              <TacticalInput label="Email Address" value={form.contactEmail} placeholder="Email Address"
                onChange={(v) => update("contactEmail", v)} />
              <TacticalInput label="Company Name" value={form.companyName} placeholder="Company Name"
                onChange={(v) => update("companyName", v)} />
            </div>
          </Module>

          <Module title="MODULE B: DATA INPUT METHOD">
            <div style={SC.modBody}>
              {(["manual", "xero", "excel"] as InputPath[]).map((p) => (
                <button
                  key={p} type="button"
                  onClick={() => { setInputPath(p); if (p === "xero") setShowXeroModal(true) }}
                  style={{
                    width: "100%",
                    padding: "14px 12px",
                    borderRadius: 8,
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                    fontFamily: FONT, cursor: "pointer", transition: "all 0.15s",
                    border: inputPath === p ? "1px solid #22D3EE" : "1px solid #1E3A5F",
                    background: inputPath === p ? "#22D3EE" : "#0B243A",
                    color: inputPath === p ? "#04121F" : "#8FB4D9",
                    boxShadow: inputPath === p ? "0 0 12px rgba(34,211,238,0.25)" : "none",
                  }}
                >
                  {p === "manual" ? "Manual Entry" : p === "xero" ? "Connect Bank" : "Import Excel"}
                </button>
              ))}

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

          <Module title="MODULE D: EXECUTION VELOCITY">
            <div style={SC.modBody}>
              <ToggleRow label="Hiring Velocity" options={["Low", "Medium", "High"] as HiringVelocity[]}
                value={form.hiringVelocity} onChange={(v) => update("hiringVelocity", v)} />
              <PowerBar label="Sales Ramp" value={form.salesRampTime} max={12} unit=" mo" color="cyan"
                onChange={(v) => update("salesRampTime", Math.round(v))} />
              <PowerBar label="Engineering Velocity" value={form.engineeringVelocity} max={12} unit=" mo" color="cyan"
                onChange={(v) => update("engineeringVelocity", Math.round(v))} />
              <ToggleRow label="Burn Flexibility" options={["Fixed", "Variable"] as BurnFlexibility[]}
                value={form.burnFlexibility} onChange={(v) => update("burnFlexibility", v)} />
            </div>
          </Module>
        </div>

        {/* ── COLUMN 2: Stage & Industry, Liquidity, Cost Structure ── */}
        <div style={SC.col2}>
          <Module title="MODULE C: STAGE & INDUSTRY">
            <div style={SC.modBody}>
              <div>
                <span style={SC.inputLabel}>Stage</span>
                <div style={SC.pillGrid}>
                  {STAGES.map((s) => (
                    <StatusToggle key={s} label={s} active={form.stage === s} onClick={() => update("stage", s)} />
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={SC.inputLabel}>Industry</span>
                <div style={SC.pillGrid}>
                  {INDUSTRIES.map((ind) => (
                    <StatusToggle key={ind} label={ind} active={form.industry === ind} onClick={() => update("industry", ind)} />
                  ))}
                </div>
              </div>
            </div>
          </Module>

          <Module title="MODULE E: LIQUIDITY & FUNDING">
            <div style={SC.modBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <PowerBar label="Cash on Hand" value={form.cashOnHand} max={5_000_000} color="cyan"
                  onChange={(v) => update("cashOnHand", Math.round(v))} />
                <PowerBar label="Monthly Net Burn" value={form.monthlyNetBurn} max={500_000} color="amber"
                  onChange={(v) => update("monthlyNetBurn", Math.round(v))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <TacticalInput label="Funding Amount" value={form.debtOutstanding} prefix="$"
                  onChange={(v) => update("debtOutstanding", Number(v) || 0)} />
                <TacticalInput label="Interest Rate" value={form.debtInterestRate} suffix="%"
                  onChange={(v) => update("debtInterestRate", Number(v) || 0)} />
                <TacticalInput label="Fundraising Window" value={form.fundraisingWindow} suffix="months"
                  onChange={(v) => update("fundraisingWindow", Number(v) || 0)} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={SC.inputLabel}>Debt Facility</span>
                  <ToggleRow label="" options={["Fixed", "Variable"] as BurnFlexibility[]}
                    value={form.burnFlexibility} onChange={(v) => update("burnFlexibility", v)} />
                </div>
              </div>
            </div>
          </Module>

          <Module title="MODULE G: COST STRUCTURE">
            <div style={{ ...SC.modBody, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <TacticalInput label="Headcount" value={form.headcount}
                onChange={(v) => update("headcount", Number(v) || 0)} />
              <TacticalInput label="Avg Fully Loaded Cost" value={form.avgFullyLoadedCost} prefix="$"
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
        </div>

        {/* ── COLUMN 3: Revenue Engine, Strategic Posture, Outcome Rail ── */}
        <div style={SC.col3}>
          <Module title="MODULE F: REVENUE ENGINE">
            <div style={SC.modBody}>
              <PowerBar label="Current ARR" value={form.currentARR} max={10_000_000} color="cyan"
                onChange={(v) => update("currentARR", Math.round(v))} />
              <PowerBar label="Monthly Growth %" value={form.monthlyGrowthPct} max={30} unit="%" color="cyan"
                onChange={(v) => update("monthlyGrowthPct", Math.round(v * 10) / 10)} />
              <PowerBar label="Gross Margin %" value={form.grossMarginPct} max={100} unit="%" color="cyan"
                onChange={(v) => update("grossMarginPct", Math.round(v * 10) / 10)} />
              <TacticalInput label="Avg Contract (Years)" value={form.avgDealSize} prefix="$"
                onChange={(v) => update("avgDealSize", Number(v) || 0)} />
              <PowerBar label="Monthly Churn %" value={form.monthlyChurnPct} max={15} unit="%" color="amber"
                onChange={(v) => update("monthlyChurnPct", Math.round(v * 10) / 10)} />
              <PowerBar label="Sales Efficiency" value={form.salesEfficiency} max={3} unit="x" color="cyan"
                onChange={(v) => update("salesEfficiency", Math.round(v * 10) / 10)} />
              <PowerBar label="Net Revenue Retention" value={form.netRevenueRetentionPct} max={200} unit="%" color="cyan"
                onChange={(v) => update("netRevenueRetentionPct", Math.round(v))} />
            </div>
          </Module>

          <Module title="MODULE H: STRATEGIC POSTURE">
            <div style={{ ...SC.modBody, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#E6F1FF", letterSpacing: "0.08em", textTransform: "uppercase" }}>Risk Tolerance</span>

              <GaugeKnob angle={needleAngle} />

              <div style={{ display: "flex", gap: 0, width: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid #1E3A5F" }}>
                {(["Conservative", "Balanced", "Aggressive"] as RiskTolerance[]).map((r) => (
                  <button key={r} type="button" onClick={() => update("riskTolerance", r)} style={{
                    flex: 1, padding: "8px 0", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em",
                    textTransform: "uppercase", fontFamily: FONT, cursor: "pointer", transition: "all 0.15s",
                    border: "none",
                    background: form.riskTolerance === r ? "#22D3EE" : "#0B243A",
                    color: form.riskTolerance === r ? "#04121F" : "#8FB4D9",
                  }}>{r}</button>
                ))}
              </div>

              <div style={{ width: "100%", marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#22D3EE", letterSpacing: "0.04em" }}>Your suggestions:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  <BinarySwitch label="External Capital Required?" active={form.accessToCapital === "Strong"} onToggle={() => update("accessToCapital", form.accessToCapital === "Strong" ? "Moderate" : "Strong")} />
                  <BinarySwitch label="Focus on Runway?" active={form.priorityBalance < 40} onToggle={() => update("priorityBalance", form.priorityBalance < 40 ? 60 : 20)} />
                  <BinarySwitch label="Survival vs Expansion?" active={form.priorityBalance > 50} onToggle={() => update("priorityBalance", form.priorityBalance > 50 ? 30 : 70)} />
                  <BinarySwitch label="Growth-at-all-Costs?" active={form.priorityBalance > 75} onToggle={() => update("priorityBalance", form.priorityBalance > 75 ? 50 : 90)} />
                </div>
              </div>
            </div>
          </Module>

          <Module title="DYNAMIC OUTCOME RAIL" style={{ flex: 1 }}>
            <div style={{ ...SC.modBody, display: "flex", flexDirection: "column", gap: 8 }} className="gm-scrollbar">
              <OutcomeCard label="ARR" value={fmtCurrency(form.currentARR)} color="#22D3EE" />
              <OutcomeCard label="Growth" value={`${form.monthlyGrowthPct.toFixed(1)}%`} color="#22D3EE" />
              <OutcomeCard label="Avg Contract" value={fmtCurrency(form.avgDealSize)} color="#22D3EE" />
              <OutcomeCard label="Gross Margin" value={`${form.grossMarginPct.toFixed(1)}%`} color="#34d399" />
              <OutcomeCard label="Churn" value={`${form.monthlyChurnPct.toFixed(1)}%`} color="#f59e0b" />
              <OutcomeCard label="NRR" value={`${form.netRevenueRetentionPct}%`} color={form.netRevenueRetentionPct >= 100 ? "#34d399" : "#f87171"} />
              <OutcomeCard label="Rev/Employee" value={fmtCurrency(metrics.revenuePerHead)} color="#a78bfa" />
              <OutcomeCard label="Op. Profit" value={`${metrics.operatingProfit < 0 ? "-" : ""}${fmtCurrency(Math.abs(metrics.operatingProfit))}`}
                color={metrics.operatingProfit >= 0 ? "#34d399" : "#f87171"} />
            </div>
          </Module>
        </div>
      </main>

      {/* ═══ LOCK BUTTON — FIXED BOTTOM ═══ */}
      <div style={{ padding: "12px 24px", flexShrink: 0, display: "flex", justifyContent: "flex-end", maxWidth: 1600, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <button
          type="button"
          onClick={handleLock}
          disabled={!canLock || isLocking}
          style={{
            height: 46,
            padding: "0 40px",
            borderRadius: 10,
            border: "none",
            background: isLocking ? "#f87171" : "#22D3EE",
            color: "#04121F",
            fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            fontFamily: FONT, cursor: canLock ? "pointer" : "default",
            opacity: canLock ? 1 : 0.35,
            transition: "all 0.2s",
            boxShadow: "0 0 20px rgba(34,211,238,0.3), 0 4px 12px rgba(0,0,0,0.3)",
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

        .gm-range-cyan::-webkit-slider-thumb,
        .gm-range-amber::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
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
          width: 14px;
          height: 14px;
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
      background: "#0A1C2E",
      border: "1px solid #1E3A5F",
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8FB4D9" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "ui-monospace, 'JetBrains Mono', monospace", color, textShadow: `0 0 10px ${color}` }}>{value}</span>
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
    background: "#07182A",
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
    flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    gap: 24, padding: "18px 24px", minHeight: 0, overflow: "auto",
    maxWidth: 1600, margin: "0 auto", width: "100%", boxSizing: "border-box",
    zIndex: 1,
  },
  col1: { display: "flex", flexDirection: "column", gap: 20, minHeight: 0, overflow: "auto" },
  col2: { display: "flex", flexDirection: "column", gap: 20, minHeight: 0, overflow: "auto" },
  col3: { display: "flex", flexDirection: "column", gap: 20, minHeight: 0 },

  moduleHeader: {
    position: "relative",
    padding: "10px 20px", fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
    color: "#8FB4D9",
    background: "transparent",
    borderBottom: "1px solid rgba(31,74,117,0.3)",
    marginBottom: 0,
  },
  modBody: {
    padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14,
  },

  powerLabel: {
    fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8FB4D9",
  },
  powerValue: {
    fontSize: 13, fontWeight: 700, fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
    textShadow: "0 0 10px currentColor",
  },
  powerTrack: {
    height: 6, borderRadius: 3, overflow: "hidden",
    background: "#0F2A44",
  },
  powerFill: {
    height: "100%", borderRadius: 3, minWidth: 2,
  },
  rangeInput: {
    position: "absolute" as const, top: -4, left: 0,
    width: "100%", height: 14,
    appearance: "none", WebkitAppearance: "none",
    background: "transparent", borderRadius: 3, outline: "none", cursor: "pointer",
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
    color: "#8FB4D9", background: "#0B243A", border: "none",
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
    border: "1px solid #1E3A5F", background: "#0B243A", color: "#22D3EE",
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
    background: "#07182A", border: "1px solid #1E3A5F", borderRadius: 14,
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
    background: "#07182A",
    border: "1px solid #1E3A5F", borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
    animation: "sfInitToastIn 300ms ease-out",
  },
}
