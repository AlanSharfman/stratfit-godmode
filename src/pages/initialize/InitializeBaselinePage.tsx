// src/pages/initialize/InitializeBaselinePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — System Calibration · God Mode Institutional Rebuild
// Capital-grade intake instrument · Two-column workflow
// Left: compact step rail (Company, Financial, Capital, Operations, Customer)
// Right: compact header + KPI instrument strip + section cards + sticky bar
// Data: useSystemBaseline() — single canonical provider. Always editable.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./InitializeBaselinePage.module.css"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { SystemBlueprintBackground } from "@/components/system/SystemBlueprintBackground"
import type { BaselineV1 } from "@/onboard/baseline"

// ═══════════════════════════════════════════════════════════════════════════
// 1D STRUCTURAL SIGNAL (Initialize preview)
// Simple moving "mountain line" that responds to baseline inputs.
// No WebGL. No toy glow. Institutional cyan line + subtle fill.
// ═══════════════════════════════════════════════════════════════════════════

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function buildSignalSeries(points: number[], samples = 64): number[] {
  const src = points.length > 0 ? points.map(clamp01) : [0.3, 0.5, 0.4, 0.6, 0.35, 0.45, 0.5]
  const n = src.length
  const out: number[] = []
  for (let i = 0; i < samples; i++) {
    const t = n === 1 ? 0 : (i / (samples - 1)) * (n - 1)
    const idx = Math.floor(t)
    const frac = t - idx
    const a = src[Math.max(0, Math.min(n - 1, idx))] ?? 0.5
    const b = src[Math.max(0, Math.min(n - 1, idx + 1))] ?? a
    out.push(lerp(a, b, frac))
  }
  return out
}

function seriesToPath(series: number[], w: number, h: number, pad = 10): string {
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  if (series.length <= 0) return `M ${pad} ${pad + innerH / 2}`

  const xFor = (i: number) => pad + (i / (series.length - 1)) * innerW
  const yFor = (v01: number) => pad + (1 - clamp01(v01)) * innerH

  // Smooth-ish polyline using quadratic mid-point segments
  const pts = series.map((v, i) => [xFor(i), yFor(v)] as const)
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    d += ` Q ${x0.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`
  }
  // finish to last point
  const last = pts[pts.length - 1]
  d += ` T ${last[0].toFixed(1)} ${last[1].toFixed(1)}`
  return d
}

function SignalMountainLine({
  points,
  width = 420,
  height = 120,
}: {
  points: number[]
  width?: number
  height?: number
}) {
  const target = useMemo(() => buildSignalSeries(points, 64), [points])
  const [display, setDisplay] = useState<number[]>(() => target)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number[]>(display)
  const t0Ref = useRef<number>(0)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = display
    t0Ref.current = performance.now()
    const D = 520 // ms

    const tick = () => {
      const t = clamp01((performance.now() - t0Ref.current) / D)
      const e = easeOutCubic(t)
      const next = target.map((v, i) => lerp(startRef.current[i] ?? v, v, e))
      setDisplay(next)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  const w = width
  const h = height
  const pad = 12
  const d = useMemo(() => seriesToPath(display, w, h, pad), [display, w, h])

  // Compute a simple "slope/angle" indicator from the last segment
  const slope = useMemo(() => {
    if (display.length < 2) return 0
    const a = display[display.length - 2] ?? 0.5
    const b = display[display.length - 1] ?? 0.5
    return b - a
  }, [display])

  return (
    <div className={styles.signalWrap}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sf-signal-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.18)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.00)" />
          </linearGradient>
          <linearGradient id="sf-signal-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(103,232,249,0.75)" />
            <stop offset="60%" stopColor="rgba(34,211,238,0.78)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.55)" />
          </linearGradient>
        </defs>

        {/* baseline grid */}
        <g opacity="0.22">
          {Array.from({ length: 5 }).map((_, i) => {
            const y = pad + (i / 4) * (h - pad * 2)
            return (
              <line
                key={i}
                x1={pad}
                y1={y}
                x2={w - pad}
                y2={y}
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1"
              />
            )
          })}
        </g>

        {/* fill under curve */}
        <path
          d={`${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`}
          fill="url(#sf-signal-fill)"
        />

        {/* cyan signal line */}
        <path
          d={d}
          fill="none"
          stroke="url(#sf-signal-stroke)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* head marker */}
        <circle
          cx={w - pad}
          cy={pad + (1 - clamp01(display[display.length - 1] ?? 0.5)) * (h - pad * 2)}
          r="3.5"
          fill="rgba(34,211,238,0.9)"
          opacity="0.8"
        />
      </svg>

      <div className={styles.signalMeta}>
        <span className={styles.signalMetaLabel}>Angle</span>
        <span className={styles.signalMetaValue}>
          {slope >= 0 ? "+" : ""}
          {(slope * 100).toFixed(0)}
        </span>
        <span className={styles.signalMetaLabel}>Drop</span>
        <span className={styles.signalMetaValue}>
          {(Math.max(0, (display[0] ?? 0.5) - (display[display.length - 1] ?? 0.5)) * 100).toFixed(0)}
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULTS & MIGRATION
// ═══════════════════════════════════════════════════════════════════════════

const FINANCIAL_DEFAULTS: BaselineV1["financial"] = {
  arr: 0,
  growthRatePct: 0,
  grossMarginPct: 0,
  revenueConcentrationPct: 0,
  monthlyBurn: 0,
  payroll: 0,
  headcount: 0,
  cashOnHand: 0,
  nrrPct: 0,
  avgFullyLoadedCost: 0,
  salesMarketingSpend: 0,
  rdSpend: 0,
  gaSpend: 0,
}

const COMPANY_DEFAULTS: BaselineV1["company"] = {
  legalName: "",
  industry: "SaaS",
  businessModel: "Subscription",
  primaryMarket: "North America",
  founderName: "",
  contactEmail: "",
  contactPhone: "",
  jurisdiction: "",
}

const CAPITAL_DEFAULTS: BaselineV1["capital"] = {
  totalDebt: 0,
  interestRatePct: 0,
  monthlyDebtService: 0,
  lastRaiseAmount: 0,
  lastRaiseDateISO: null,
  equityRaisedToDate: 0,
}

const OPERATING_DEFAULTS: BaselineV1["operating"] = {
  churnPct: 0,
  salesCycleMonths: 0,
  acv: 0,
  keyPersonDependency: "Medium",
  customerConcentrationRisk: "Medium",
  regulatoryExposure: "Low",
  activeCustomers: 0,
}

const CUSTOMER_ENGINE_DEFAULTS: BaselineV1["customerEngine"] = {
  cac: 0,
  ltv: 0,
  paybackPeriodMonths: 0,
  expansionRatePct: 0,
}

function createDefaultBaseline(): BaselineV1 {
  return {
    version: 1,
    company: { ...COMPANY_DEFAULTS },
    financial: { ...FINANCIAL_DEFAULTS },
    capital: { ...CAPITAL_DEFAULTS },
    operating: { ...OPERATING_DEFAULTS },
    customerEngine: { ...CUSTOMER_ENGINE_DEFAULTS },
    posture: {
      focus: "Growth",
      raiseIntent: "Uncertain",
      horizonMonths: 24,
      primaryConstraint: "Cash runway",
      fastestDownside: "Fixed cost rigidity",
    },
  }
}

/** Silent schema migration — ensures new fields exist on stored baselines. */
function migrateBaseline(stored: BaselineV1): BaselineV1 {
  return {
    ...stored,
    company: { ...COMPANY_DEFAULTS, ...stored.company },
    financial: { ...FINANCIAL_DEFAULTS, ...stored.financial },
    capital: { ...CAPITAL_DEFAULTS, ...stored.capital },
    operating: { ...OPERATING_DEFAULTS, ...stored.operating },
    customerEngine: { ...CUSTOMER_ENGINE_DEFAULTS, ...(stored.customerEngine ?? {}) },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M"
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(1) + "K"
  return "$" + Math.round(v).toLocaleString()
}

function fmtMonths(v: number): string {
  return v.toFixed(1) + "mo"
}

function fmtMultiple(v: number): string {
  return v.toFixed(1) + "x"
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE DEFINITIONS — Step Rail
// ═══════════════════════════════════════════════════════════════════════════

type ModuleId = "company" | "financial" | "capital" | "operations" | "customer" | "posture"

const MODULES: { id: ModuleId; num: string; label: string }[] = [
  { id: "company", num: "01", label: "Company" },
  { id: "financial", num: "02", label: "Financial" },
  { id: "capital", num: "03", label: "Capital" },
  { id: "operations", num: "04", label: "Operations" },
  { id: "customer", num: "05", label: "Customer" },
  { id: "posture", num: "06", label: "Posture" },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function InitializeBaselinePage() {
  // ── Router navigation ─────────────────────────────────────────────────
  const navigate = useNavigate()

  // ── Provider: canonical baseline source ───────────────────────────────
  const { baseline: storedBaseline, setBaseline: commitBaseline } =
    useSystemBaseline()

  // ── Local working state (initialised from provider or defaults) ──────
  const [baseline, setBaseline] = useState<BaselineV1>(() =>
    storedBaseline ? migrateBaseline(storedBaseline) : createDefaultBaseline()
  )
  const [activeModule, setActiveModule] = useState<ModuleId>("company")
  const [draftSaved, setDraftSaved] = useState(false)

  // ── Recalculation shimmer key ────────────────────────────────────────
  const [shimmerKey, setShimmerKey] = useState(0)
  const isFirstRender = useRef(true)

  // ── Sync provider → local state (for external updates) ───────────────
  useEffect(() => {
    if (storedBaseline) {
      setBaseline(migrateBaseline(storedBaseline))
    }
  }, [storedBaseline])

  // ── Sync local → provider on every mutation (auto-save) ──────────────
  useEffect(() => {
    commitBaseline(baseline)
    if (isFirstRender.current) {
      isFirstRender.current = false
    } else {
      setShimmerKey((k) => k + 1)
    }
  }, [baseline, commitBaseline])

  // ── Step navigation ──────────────────────────────────────────────────
  const currentIdx = MODULES.findIndex((m) => m.id === activeModule)
  const isFirst = currentIdx === 0
  const isLast = currentIdx === MODULES.length - 1

  // ── Derived KPIs ─────────────────────────────────────────────────────
  const runway = useMemo((): string => {
    const burn = baseline.financial.monthlyBurn
    const cash = baseline.financial.cashOnHand
    if (burn <= 0) return "—"
    return fmtMonths(cash / burn)
  }, [baseline.financial])

  const burnMultiple = useMemo((): string => {
    const burn = baseline.financial.monthlyBurn
    const arr = baseline.financial.arr
    if (arr <= 0 || burn <= 0) return "—"
    return fmtMultiple(burn / (arr / 12))
  }, [baseline.financial])

  const arrFormatted = useMemo((): string => {
    const arr = baseline.financial.arr
    if (arr <= 0) return "—"
    return fmtCurrency(arr)
  }, [baseline.financial])

  const grossMargin = useMemo((): string => {
    const gm = baseline.financial.grossMarginPct
    if (gm <= 0) return "—"
    return gm.toFixed(0) + "%"
  }, [baseline.financial])

  const interestBurden = useMemo((): string => {
    const debt = baseline.capital.totalDebt
    const rate = baseline.capital.interestRatePct
    if (debt <= 0 || rate <= 0) return "—"
    return fmtCurrency((debt * rate) / 100 / 12)
  }, [baseline.capital])

  const revPerEmployee = useMemo((): string => {
    const arr = baseline.financial.arr
    const hc = baseline.financial.headcount
    if (arr <= 0 || hc <= 0) return "—"
    return fmtCurrency(arr / hc)
  }, [baseline.financial])

  // ── Terrain preview data points ──────────────────────────────────────
  const terrainPoints = useMemo(() => {
    const fin = baseline.financial
    const op = baseline.operating
    const cap = baseline.capital
    return [
      clamp01(fin.arr / 10_000_000),
      clamp01(fin.growthRatePct / 100),
      clamp01(fin.grossMarginPct / 100),
      clamp01(1 - op.churnPct / 20),
      clamp01(fin.cashOnHand / 5_000_000),
      clamp01(1 - cap.totalDebt / 5_000_000),
      clamp01(fin.nrrPct / 150),
    ]
  }, [baseline.financial, baseline.operating, baseline.capital])

  // ── Field updaters ───────────────────────────────────────────────────
  const setCompanyStr = useCallback(
    (field: keyof BaselineV1["company"], value: string) => {
      setBaseline((prev) => ({
        ...prev,
        company: { ...prev.company, [field]: value },
      }))
    },
    []
  )

  const setFin = useCallback(
    (field: keyof BaselineV1["financial"], value: number) => {
      setBaseline((prev) => ({
        ...prev,
        financial: { ...prev.financial, [field]: value },
      }))
    },
    []
  )

  const setCap = useCallback(
    (field: keyof BaselineV1["capital"], value: number | string | null) => {
      setBaseline((prev) => ({
        ...prev,
        capital: { ...prev.capital, [field]: value },
      }))
    },
    []
  )

  const setOp = useCallback(
    (field: keyof BaselineV1["operating"], value: number) => {
      setBaseline((prev) => ({
        ...prev,
        operating: { ...prev.operating, [field]: value },
      }))
    },
    []
  )

  const setCe = useCallback(
    (field: keyof BaselineV1["customerEngine"], value: number) => {
      setBaseline((prev) => ({
        ...prev,
        customerEngine: { ...prev.customerEngine, [field]: value },
      }))
    },
    []
  )

  const setPosture = useCallback(
    (field: keyof BaselineV1["posture"], value: any) => {
      setBaseline((prev) => ({
        ...prev,
        posture: { ...prev.posture, [field]: value },
      }))
    },
    []
  )

  // ── Continue to platform ──────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    commitBaseline(baseline)
    navigate("/")
  }, [baseline, commitBaseline, navigate])

  // ── Step actions ──────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (isFirst) {
      navigate("/")
    } else {
      setActiveModule(MODULES[currentIdx - 1].id)
    }
  }, [isFirst, currentIdx, navigate])

  const handleNext = useCallback(() => {
    if (isLast) {
      handleContinue()
    } else {
      setActiveModule(MODULES[currentIdx + 1].id)
    }
  }, [isLast, currentIdx, handleContinue])

  const handleSaveDraft = useCallback(() => {
    commitBaseline(baseline)
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 1500)
  }, [baseline, commitBaseline])

  // ── Keyboard: Enter triggers Next when not in an input ────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const active = document.activeElement
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
          return // let input handle it (blur commits)
        }
        handleNext()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleNext])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className={styles.root}>
      {/* ── Background (reduced opacity) ─── */}
      <div className={styles.bgLayer}>
        <SystemBlueprintBackground />
      </div>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      {/* ── Left Step Rail ─────────────────────────────────────── */}
      <aside className={styles.rail}>
        <div className={styles.logoBlock}>
          <img src="/logo.svg" alt="STRATFIT Logo" width="34" height="34" />
          <div>
            <div className={styles.logoTitle}>STRATFIT</div>
            <div className={styles.logoSub}>System Calibration</div>
          </div>
        </div>

        <div className={styles.sectionDescriptor}>Baseline capture</div>

        <nav className={styles.railNav}>
          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={
                activeModule === m.id ? styles.railItemActive : styles.railItem
              }
              onClick={() => setActiveModule(m.id)}
            >
              <span className={styles.railNum}>{m.num}</span>
              <span className={styles.railLabel}>{m.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.draftBadge}>BASELINE&nbsp;&mdash;&nbsp;ALWAYS EDITABLE</div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className={styles.main}>
        {/* ─── Header ─── */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>System Calibration</h1>
            <p className={styles.subtitle}>
              Capture baseline inputs used to generate structural intelligence.
            </p>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.progress}>
              Step {currentIdx + 1} of {MODULES.length}
            </span>

            {/* Structural Preview — high-def mountain (WebGL w/ 2.5D fallback) */}
            <div className={styles.mountainCard} aria-label="Structural preview">
              <div className={styles.mountainCardHeader}>
                <span className={styles.mountainCardLabel}>Structural preview</span>
                <span className={styles.mountainCardMeta}>Updates as inputs change</span>
              </div>
              <div className={styles.mountainViewport}>
                <SignalMountainLine points={terrainPoints} />
              </div>
            </div>
          </div>
        </header>

        {/* ─── KPI Instrument Strip ─── */}
        <div className={styles.kpiStrip}>
          <div className={styles.shimmerBar} key={shimmerKey} />
          <KPITile label="Runway" value={runway} />
          <KPITile label="Burn Multiple" value={burnMultiple} />
          <KPITile label="ARR" value={arrFormatted} />
          <KPITile label="Gross Margin" value={grossMargin} />
        </div>

        {/* ─── Module Panel (section cards) ─── */}
        <div className={styles.modulePanel} key={activeModule}>
          {activeModule === "company" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Company Identity</h2>
              <div className={styles.fieldGrid}>
                <TextField
                  label="Founder Name"
                  value={baseline.company.founderName}
                  onCommit={(v) => setCompanyStr("founderName", v)}
                />
                <TextField
                  label="Company Name"
                  value={baseline.company.legalName}
                  helper="Legal entity name"
                  onCommit={(v) => setCompanyStr("legalName", v)}
                />
                <TextField
                  label="Email"
                  value={baseline.company.contactEmail}
                  placeholder="founder@company.com"
                  onCommit={(v) => setCompanyStr("contactEmail", v)}
                />
                <TextField
                  label="Phone"
                  value={baseline.company.contactPhone}
                  placeholder="+1 000 000 0000"
                  onCommit={(v) => setCompanyStr("contactPhone", v)}
                />
                <TextField
                  label="Industry"
                  value={baseline.company.industry}
                  helper="Primary industry or vertical"
                  onCommit={(v) => setCompanyStr("industry", v)}
                />
                <TextField
                  label="Jurisdiction"
                  value={baseline.company.jurisdiction}
                  placeholder="e.g. Delaware, USA"
                  helper="Where your company is incorporated"
                  onCommit={(v) => setCompanyStr("jurisdiction", v)}
                />
                <TextField
                  label="Business Model"
                  value={baseline.company.businessModel}
                  helper="e.g. Subscription, Marketplace, Usage-based"
                  onCommit={(v) => setCompanyStr("businessModel", v)}
                />
              </div>
            </div>
          )}

          {activeModule === "financial" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Financial Baseline</h2>
              <div className={styles.fieldGrid}>
                <NumericField
                  label="Cash on Hand"
                  value={baseline.financial.cashOnHand}
                  prefix="$"
                  helper="Total cash across all accounts"
                  onCommit={(v) => setFin("cashOnHand", v)}
                />
                <NumericField
                  label="Monthly Net Burn"
                  value={baseline.financial.monthlyBurn}
                  prefix="$"
                  helper="Monthly outflow minus revenue"
                  onCommit={(v) => setFin("monthlyBurn", v)}
                />
                <NumericField
                  label="Current ARR"
                  value={baseline.financial.arr}
                  prefix="$"
                  helper="Monthly recurring revenue × 12"
                  onCommit={(v) => setFin("arr", v)}
                />
                <NumericField
                  label="Monthly Growth"
                  value={baseline.financial.growthRatePct}
                  suffix="%"
                  helper="Month-over-month revenue growth"
                  onCommit={(v) => setFin("growthRatePct", v)}
                />
                <NumericField
                  label="Monthly Churn"
                  value={baseline.operating.churnPct}
                  suffix="%"
                  helper="Revenue lost per month"
                  onCommit={(v) => setOp("churnPct", v)}
                />
                <NumericField
                  label="Net Revenue Retention"
                  value={baseline.financial.nrrPct}
                  suffix="%"
                  helper="Including expansion revenue"
                  onCommit={(v) => setFin("nrrPct", v)}
                />
                <NumericField
                  label="Headcount"
                  value={baseline.financial.headcount}
                  helper="Full-time equivalent employees"
                  onCommit={(v) => setFin("headcount", v)}
                />
                <NumericField
                  label="Avg Fully Loaded Cost"
                  value={baseline.financial.avgFullyLoadedCost}
                  prefix="$"
                  helper="Total cost per employee"
                  onCommit={(v) => setFin("avgFullyLoadedCost", v)}
                />
                <NumericField
                  label="Sales &amp; Marketing"
                  value={baseline.financial.salesMarketingSpend}
                  prefix="$"
                  onCommit={(v) => setFin("salesMarketingSpend", v)}
                />
                <NumericField
                  label="R&amp;D Spend"
                  value={baseline.financial.rdSpend}
                  prefix="$"
                  onCommit={(v) => setFin("rdSpend", v)}
                />
                <NumericField
                  label="G&amp;A Spend"
                  value={baseline.financial.gaSpend}
                  prefix="$"
                  onCommit={(v) => setFin("gaSpend", v)}
                />
              </div>
              <div className={styles.derivedRow}>
                <DerivedKPI label="Runway" value={runway} />
                <DerivedKPI label="Burn Multiple" value={burnMultiple} />
                <DerivedKPI label="Rev / Employee" value={revPerEmployee} />
              </div>
            </div>
          )}

          {activeModule === "capital" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Capital Structure</h2>
              <div className={styles.fieldGrid}>
                <NumericField
                  label="Debt Outstanding"
                  value={baseline.capital.totalDebt}
                  prefix="$"
                  helper="Total outstanding debt"
                  onCommit={(v) => setCap("totalDebt", v)}
                />
                <NumericField
                  label="Interest Rate"
                  value={baseline.capital.interestRatePct}
                  suffix="%"
                  helper="Annual interest rate on debt"
                  onCommit={(v) => setCap("interestRatePct", v)}
                />
                <NumericField
                  label="Monthly Debt Service"
                  value={baseline.capital.monthlyDebtService}
                  prefix="$"
                  helper="Monthly debt payment obligation"
                  onCommit={(v) => setCap("monthlyDebtService", v)}
                />
                <NumericField
                  label="Equity Raised to Date"
                  value={baseline.capital.equityRaisedToDate}
                  prefix="$"
                  helper="Total equity capital raised"
                  onCommit={(v) => setCap("equityRaisedToDate", v)}
                />
                <NumericField
                  label="Last Raise Amount"
                  value={baseline.capital.lastRaiseAmount}
                  prefix="$"
                  helper="Most recent funding round amount"
                  onCommit={(v) => setCap("lastRaiseAmount", v)}
                />
                <DateField
                  label="Last Raise Date"
                  value={baseline.capital.lastRaiseDateISO}
                  helper="Date of most recent funding"
                  onCommit={(v) => setCap("lastRaiseDateISO", v)}
                />
              </div>
              <div className={styles.derivedRow}>
                <DerivedKPI label="Monthly Interest" value={interestBurden} />
              </div>
            </div>
          )}

          {activeModule === "operations" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Operations</h2>
              <div className={styles.fieldGrid}>
                <NumericField
                  label="Gross Margin"
                  value={baseline.financial.grossMarginPct}
                  suffix="%"
                  helper="Revenue minus direct costs"
                  onCommit={(v) => setFin("grossMarginPct", v)}
                />
                <NumericField
                  label="Sales Cycle Length"
                  value={baseline.operating.salesCycleMonths}
                  suffix=" mo"
                  helper="Average months to close a deal"
                  onCommit={(v) => setOp("salesCycleMonths", v)}
                />
                <NumericField
                  label="Active Customers"
                  value={baseline.operating.activeCustomers}
                  helper="Current paying customer count"
                  onCommit={(v) => setOp("activeCustomers", v)}
                />
                <NumericField
                  label="Avg Deal Size"
                  value={baseline.operating.acv}
                  prefix="$"
                  helper="Annual contract value per customer"
                  onCommit={(v) => setOp("acv", v)}
                />
                <NumericField
                  label="Customer Concentration"
                  value={baseline.financial.revenueConcentrationPct}
                  suffix="%"
                  helper="Revenue from top 3 customers"
                  onCommit={(v) => setFin("revenueConcentrationPct", v)}
                />
              </div>
            </div>
          )}

          {activeModule === "customer" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Customer Engine</h2>
              <div className={styles.fieldGrid}>
                <NumericField
                  label="CAC"
                  value={baseline.customerEngine.cac}
                  prefix="$"
                  helper="Cost to acquire one customer"
                  onCommit={(v) => setCe("cac", v)}
                />
                <NumericField
                  label="LTV"
                  value={baseline.customerEngine.ltv}
                  prefix="$"
                  helper="Lifetime revenue per customer"
                  onCommit={(v) => setCe("ltv", v)}
                />
                <NumericField
                  label="Payback Period"
                  value={baseline.customerEngine.paybackPeriodMonths}
                  suffix=" mo"
                  helper="Months to recoup acquisition cost"
                  onCommit={(v) => setCe("paybackPeriodMonths", v)}
                />
                <NumericField
                  label="Expansion Rate"
                  value={baseline.customerEngine.expansionRatePct}
                  suffix="%"
                  helper="Annual expansion revenue"
                  onCommit={(v) => setCe("expansionRatePct", v)}
                />
              </div>
            </div>
          )}

          {activeModule === "posture" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Strategic Posture</h2>
              <div className={styles.fieldGrid}>
                <SelectField
                  label="Strategic Focus"
                  value={baseline.posture.focus}
                  options={["Growth", "Profitability", "Stabilise"] as const}
                  helper="Primary strategic objective"
                  onCommit={(v) => setPosture("focus", v)}
                />
                <SelectField
                  label="Raise Intent"
                  value={baseline.posture.raiseIntent}
                  options={["Yes", "No", "Uncertain"] as const}
                  helper="Plan to raise capital"
                  onCommit={(v) => setPosture("raiseIntent", v)}
                />
                <SelectField
                  label="Planning Horizon"
                  value={baseline.posture.horizonMonths}
                  options={[12, 24, 36] as const}
                  helper="Strategic planning timeframe (months)"
                  onCommit={(v) => setPosture("horizonMonths", v)}
                />
                <SelectField
                  label="Primary Constraint"
                  value={baseline.posture.primaryConstraint}
                  options={[
                    "Cash runway",
                    "Debt servicing",
                    "Payroll commitments",
                    "Customer concentration",
                    "Nothing material"
                  ] as const}
                  helper="Most pressing limitation"
                  onCommit={(v) => setPosture("primaryConstraint", v)}
                />
                <SelectField
                  label="Fastest Downside"
                  value={baseline.posture.fastestDownside}
                  options={[
                    "Revenue volatility",
                    "Fixed cost rigidity",
                    "Capital structure",
                    "Customer churn",
                    "Regulatory exposure"
                  ] as const}
                  helper="Most immediate risk vector"
                  onCommit={(v) => setPosture("fastestDownside", v)}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── Sticky Action Bar ─── */}
        <div className={styles.actionBar}>
          {draftSaved && (
            <span className={styles.savedConfirm} key={Date.now()}>
              Draft saved
            </span>
          )}
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleBack}
          >
            {isFirst ? "\u2190 Exit" : "\u2190 Back"}
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleSaveDraft}
          >
            Save Draft
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleNext}
          >
            {isLast ? "Save \u0026 Continue" : "Next \u2192"}
          </button>
        </div>
      </main>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (file-private)
// ═══════════════════════════════════════════════════════════════════════════
// FIELD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/** Compact KPI tile for the instrument strip. */
function KPITile({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className={styles.kpiTile}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>{value}</span>
      {helper && <span className={styles.kpiHelper}>{helper}</span>}
    </div>
  )
}

/** Premium text field — vertical layout with optional helper. */
function TextField({
  label,
  value,
  placeholder,
  helper,
  onCommit,
}: {
  label: string
  value: string
  placeholder?: string
  helper?: string
  onCommit: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState("")

  const display = editing ? raw : value

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        className={styles.fieldTextInput}
        type="text"
        value={display}
        placeholder={placeholder ?? "—"}
        onFocus={() => {
          setEditing(true)
          setRaw(value)
        }}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() => {
          setEditing(false)
          onCommit(raw)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLElement).blur()
        }}
      />
      {helper && <span className={styles.fieldHelper}>{helper}</span>}
    </div>
  )
}

/** Date field — vertical layout with optional helper. */
function DateField({
  label,
  value,
  helper,
  onCommit,
}: {
  label: string
  value: string | null
  helper?: string
  onCommit: (v: string | null) => void
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        className={styles.fieldTextInput}
        type="date"
        value={value ?? ""}
        onChange={(e) => onCommit(e.target.value || null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLElement).blur()
        }}
      />
      {helper && <span className={styles.fieldHelper}>{helper}</span>}
    </div>
  )
}

/** Select field — vertical layout with optional helper. */
function SelectField<T extends string>({
  label,
  value,
  options,
  helper,
  onCommit,
}: {
  label: string
  value: T
  options: readonly T[]
  helper?: string
  onCommit: (v: T) => void
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <select
        className={styles.fieldTextInput}
        value={value}
        onChange={(e) => onCommit(e.target.value as T)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {helper && <span className={styles.fieldHelper}>{helper}</span>}
    </div>
  )
}

/**
 * Premium numeric field — vertical layout.
 * Focus: raw number editing. Blur: formatted + commit.
 */
function NumericField({
  label,
  value,
  prefix,
  suffix,
  helper,
  onCommit,
}: {
  label: string
  value: number
  prefix?: string
  suffix?: string
  helper?: string
  onCommit: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState("")

  const display = editing ? raw : value !== 0 ? value.toLocaleString() : ""

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldInputWrap}>
        {prefix ? <span className={styles.fieldAffix}>{prefix}</span> : null}
        <input
          className={styles.fieldNumInput}
          type="text"
          inputMode="decimal"
          value={display}
          placeholder="—"
          onFocus={() => {
            setEditing(true)
            setRaw(value !== 0 ? String(value) : "")
          }}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={() => {
            setEditing(false)
            const parsed = parseFloat(raw.replace(/,/g, ""))
            onCommit(Number.isFinite(parsed) ? parsed : 0)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLElement).blur()
          }}
        />
        {suffix ? <span className={styles.fieldAffix}>{suffix}</span> : null}
      </div>
      {helper && <span className={styles.fieldHelper}>{helper}</span>}
    </div>
  )
}

/** Derived metric badge — read-only, cyan accent. */
function DerivedKPI({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.derivedMetric}>
      <span className={styles.derivedLabel}>{label}</span>
      <span className={styles.derivedValue}>{value}</span>
    </div>
  )
}
