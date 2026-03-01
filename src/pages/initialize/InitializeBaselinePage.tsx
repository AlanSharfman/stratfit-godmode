import React, { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useBaselineStore } from "@/state/baselineStore"
import ConsoleFrame from "@/layout/ConsoleFrame"
import css from "./IngressConsole.module.css"

/* ═══════════════════════════════════════════════════════════════════
   FEATURE FLAG — V2 Dense Instrument Console
   Set localStorage key sf_initiate_v2 = "1" to enable V2.
   Default: legacy.
   ═══════════════════════════════════════════════════════════════════ */
const USE_INITIATE_V2 =
  typeof window !== "undefined" &&
  window.localStorage.getItem("sf_initiate_v2") === "1"

// Lazy-load V2 to keep legacy bundle untouched
const InitializeBaselineConsoleV2 = React.lazy(
  () => import("./InitializeBaselineV2"),
)

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

type AccessToCapital = "Moderate" | "Strong"
type HiringVelocity = "Low" | "Medium" | "High"
type BurnFlexibility = "Fixed" | "Variable"
type RiskTolerance = "Conservative" | "Balanced" | "Aggressive"
type WizardStep = 1 | 2 | 3 | 4

interface FormState {
  /* Step 1 — Identity & Context */
  companyName: string
  industry: string
  stage: string

  /* Step 2 — Financial Position */
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

  /* Customer Unit Economics */
  cac: number

  /* Step 3 — Operating Structure */
  hiringVelocity: HiringVelocity
  salesRampTime: number
  engineeringVelocity: number
  burnFlexibility: BurnFlexibility

  /* Step 4 — Strategic Intent */
  riskTolerance: RiskTolerance
  targetGrowthBand: number
  priorityBalance: number
}

/* ═══════════════════════════════════════════════════════════════════
   DEFAULTS
   ═══════════════════════════════════════════════════════════════════ */

const INITIAL: FormState = {
  companyName: "",
  industry: "",
  stage: "",

  cashOnHand: 500_000,
  monthlyNetBurn: 75_000,
  debtOutstanding: 0,
  debtInterestRate: 0,
  fundraisingWindow: 6,
  accessToCapital: "Moderate",

  currentARR: 1_200_000,
  monthlyGrowthPct: 8,
  grossMarginPct: 70,
  avgDealSize: 3_200,
  monthlyChurnPct: 3,
  salesEfficiency: 1.0,
  netRevenueRetentionPct: 110,

  headcount: 18,
  avgFullyLoadedCost: 140_000,
  salesMarketingSpend: 60_000,
  rdSpend: 80_000,
  gaSpend: 30_000,
  cogsPct: 45_000,
  cac: 8_000,

  hiringVelocity: "Medium",
  salesRampTime: 4,
  engineeringVelocity: 4,
  burnFlexibility: "Variable",

  riskTolerance: "Balanced",
  targetGrowthBand: 4,
  priorityBalance: 50,
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function fmtCurrency(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  return `$${Math.round(Math.abs(v)).toLocaleString()}`
}

function sliderFill(value: number, min: number, max: number): React.CSSProperties {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  return {
    background: `linear-gradient(90deg, #065f73 0%, #0e7490 ${pct * 0.3}%, #22d3ee ${pct * 0.7}%, #67e8f9 ${pct}%, rgba(255,255,255,0.04) ${pct}%, rgba(255,255,255,0.04) 100%)`,
    boxShadow: pct > 3
      ? `0 0 ${6 + pct * 0.12}px rgba(34,211,238,${0.18 + pct * 0.004}), 0 0 ${2 + pct * 0.06}px rgba(103,232,249,${0.10 + pct * 0.002}), inset 0 1px 2px rgba(0,0,0,0.35)`
      : 'inset 0 1px 2px rgba(0,0,0,0.35)',
  }
}

function computeMetrics(f: FormState) {
  const runway = f.monthlyNetBurn > 0 ? f.cashOnHand / f.monthlyNetBurn : 0
  const monthlyRevGrowth = (f.monthlyGrowthPct / 100) * (f.currentARR / 12)
  const burnMultiple =
    monthlyRevGrowth > 0 ? f.monthlyNetBurn / monthlyRevGrowth : 0

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

  return {
    runway: Number.isFinite(runway) ? runway : 0,
    burnMultiple: Number.isFinite(burnMultiple) ? burnMultiple : 0,
    monthlyBurn: f.monthlyNetBurn,
    survivalProbability: prob,
  }
}

/* ═══════════════════════════════════════════════════════════════════
   WIZARD CONFIG
   ═══════════════════════════════════════════════════════════════════ */

const WIZARD_STEPS: { num: WizardStep; label: string }[] = [
  { num: 1, label: "Identity & Context" },
  { num: 2, label: "Financial Position" },
  { num: 3, label: "Operating Structure" },
  { num: 4, label: "Strategic Intent" },
]

const STAGES = [
  "Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Bootstrapped",
]
const INDUSTRIES = [
  "SaaS", "Fintech", "HealthTech", "EdTech", "E-Commerce",
  "AI / ML", "DevTools", "Marketplace", "Hardware", "Other",
]

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  showScale?: boolean
}

function SliderRow({
  label, value, min, max, step, format, onChange, showScale = true,
}: SliderRowProps) {
  return (
    <div className={css.sliderRow}>
      <div className={css.sliderHeader}>
        <span className={css.sliderLabel}>{label}</span>
        <span className={css.sliderInfoIcon}>i</span>
      </div>
      <div className={css.sliderBody}>
        <div className={css.sliderControl}>
          <input
            type="range"
            className={css.sliderInput}
            min={min}
            max={max}
            step={step}
            value={value}
            style={sliderFill(value, min, max)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {showScale && (
            <div className={css.sliderScale}>
              <span>LOW</span>
              <span>NEUTRAL</span>
              <span>HIGH</span>
            </div>
          )}
        </div>
        <div className={css.sliderValueWrap}>
          <span className={css.sliderValue}>{format(value)}</span>
          <span className={css.sliderValueBar} />
        </div>
      </div>
    </div>
  )
}

interface InputRowProps {
  label: string
  value: number | string
  prefix?: string
  suffix?: string
  type?: string
  placeholder?: string
  onChange: (v: string) => void
}

function InputRow({
  label, value, prefix, suffix, type = "number", placeholder, onChange,
}: InputRowProps) {
  return (
    <div className={css.inputRow}>
      <span className={css.inputLabel}>{label}</span>
      <div className={css.inputFieldWrap}>
        {prefix && <span className={css.inputPrefix}>{prefix}</span>}
        <input
          className={css.inputField}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className={css.inputSuffix}>{suffix}</span>}
      </div>
    </div>
  )
}

interface ToggleGroupProps<T extends string> {
  options: T[]
  value: T
  onChange: (v: T) => void
}

function ToggleGroup<T extends string>({
  options, value, onChange,
}: ToggleGroupProps<T>) {
  return (
    <div className={css.toggleGroup}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`${css.toggleOption} ${value === opt ? css.toggleOptionActive : ""}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   DEFAULT EXPORT — Feature Flag Router
   ═══════════════════════════════════════════════════════════════════ */

export default function InitializeBaselinePage() {
  if (USE_INITIATE_V2) {
    return (
      <React.Suspense
        fallback={
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#040710",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 13,
              letterSpacing: "0.08em",
            }}
          >
            LOADING CONSOLE…
          </div>
        }
      >
        <InitializeBaselineConsoleV2 />
      </React.Suspense>
    )
  }
  return <InitializeBaselineLegacy />
}

/* ═══════════════════════════════════════════════════════════════════
   LEGACY COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

function InitializeBaselineLegacy() {
  const navigate = useNavigate()
  const setBaseline = useBaselineStore((s) => s.setBaseline)

  const [form, setForm] = useState<FormState>({ ...INITIAL })
  const [activeStep, setActiveStep] = useState<WizardStep>(2)
  const [costExpanded, setCostExpanded] = useState(true)

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const metrics = useMemo(() => computeMetrics(form), [form])

  const revenuePerEmployee =
    form.headcount > 0 ? Math.round(form.currentARR / form.headcount) : 0
  const totalCost =
    form.headcount * form.avgFullyLoadedCost +
    form.salesMarketingSpend +
    form.rdSpend +
    form.gaSpend
  const operatingProfit = form.currentARR - totalCost

  /* ── Customer unit economics (derived) ── */
  const monthlyChurnDecimal = form.monthlyChurnPct / 100
  const ltv =
    monthlyChurnDecimal > 0
      ? (form.avgDealSize * (form.grossMarginPct / 100)) / monthlyChurnDecimal
      : 0
  const ltvCacRatio = form.cac > 0 ? ltv / form.cac : 0
  const cacPaybackMonths =
    form.avgDealSize > 0 && form.grossMarginPct > 0
      ? form.cac / ((form.avgDealSize / 12) * (form.grossMarginPct / 100))
      : 0
  const grossProfit = (form.currentARR / 12) * (form.grossMarginPct / 100)

  const handleLock = useCallback(() => {
    setBaseline({
      cash: form.cashOnHand,
      monthlyBurn: form.monthlyNetBurn,
      revenue: form.currentARR / 12,
      grossMargin: form.grossMarginPct / 100,
      growthRate: form.monthlyGrowthPct / 100,
      churnRate: form.monthlyChurnPct / 100,
      headcount: form.headcount,
      arpa: form.avgDealSize || 1500,
    })
    navigate("/decision", { replace: true })
  }, [form, navigate, setBaseline])

  const canGoNext = activeStep < 4
  const canGoBack = activeStep > 1

  /* ══════════════════ RENDER ══════════════════ */

  return (
    <ConsoleFrame>
      <div className={css.consoleLayout} data-sf-initiate="legacy">

        {/* ═══════════ LEFT SIDEBAR — System Nav Rail ═══════════ */}
        <aside className={css.sidebar}>
          <div className={css.sidebarHeader}>
            <div className={css.sidebarLogo}>
              <img
                src="/stratfit-logo.png"
                alt="STRATFIT"
                className={css.sidebarLogoImg}
              />
            </div>
          </div>

          <nav className={css.wizardNav}>
            {WIZARD_STEPS.map((step) => (
              <button
                key={step.num}
                type="button"
                className={`${css.wizardStep} ${activeStep === step.num ? css.wizardStepActive : ""} ${activeStep > step.num ? css.wizardStepDone : ""}`}
                onClick={() => setActiveStep(step.num)}
              >
                <span className={css.wizardStepNum}>
                  {activeStep > step.num ? "\u2713" : step.num}
                </span>
                <span className={css.wizardStepLabel}>{step.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ═══════════ MAIN INSTRUMENT AREA ═══════════ */}
        <main className={css.instrumentArea}>
          {/* ── Instrument Header ── */}
          <header className={css.instrumentHeader}>
            <h1 className={css.instrumentTitle}>INITIALIZE BASELINE</h1>
            <p className={css.instrumentSubtitle}>
              Enter your current financial truth to anchor scenario modeling.
            </p>
          </header>

          {/* ── Metrics Readout Strip ── */}
          <div className={css.metricsStrip}>
            <div className={css.metricItem}>
              <span className={css.metricIcon}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v5l3.5 2" stroke="rgba(34,211,238,0.65)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="7" cy="7" r="5.5" stroke="rgba(34,211,238,0.35)" strokeWidth="1.2" opacity="0.5"/>
                </svg>
              </span>
              <span
                className={css.metricValue}
                style={{
                  color:
                    metrics.runway < 6
                      ? "#f87171"
                      : metrics.runway < 12
                        ? "#fbbf24"
                        : "rgba(255,255,255,0.92)",
                }}
              >
                {metrics.runway.toFixed(1)}
              </span>
              <span className={css.metricUnit}>months</span>
            </div>

            <div className={css.metricItem}>
              <span className={css.metricLabel}>BURN MULTIPLE</span>
              <span className={css.metricValue}>
                {metrics.burnMultiple.toFixed(2)} x
              </span>
            </div>

            <div className={css.metricItem}>
              <span className={css.metricLabel}>$ MONTHLY BURN</span>
              <span className={css.metricValue}>
                {fmtCurrency(metrics.monthlyBurn)}
              </span>
            </div>

            <div className={css.metricItem}>
              <span className={css.metricLabel}>SURVIVAL PROBABILITY</span>
              <span className={css.metricValue}>
                {metrics.survivalProbability} %
              </span>
            </div>

            <div className={css.metricItem}>
              <span className={css.metricLabel}>GROSS MARGIN</span>
              <span className={css.metricValue}>
                {form.grossMarginPct.toFixed(0)} %
              </span>
            </div>

            <div className={css.metricItem}>
              <span className={css.metricLabel}>LTV / CAC</span>
              <span
                className={css.metricValue}
                style={{
                  color:
                    ltvCacRatio >= 3
                      ? "#34d399"
                      : ltvCacRatio >= 1
                        ? "#fbbf24"
                        : "#f87171",
                }}
              >
                {ltvCacRatio > 0 ? `${ltvCacRatio.toFixed(1)}x` : "—"}
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              STEP 1 — Identity & Context
              ═══════════════════════════════════════════════════════ */}
          {activeStep === 1 && (
            <div className={css.stepContent}>
              <div className={css.singlePanel}>
                <h3 className={css.panelTitle}>IDENTITY &amp; CONTEXT</h3>
                <div className={css.identityGrid}>
                  <label className={css.identityLabel}>
                    <span className={css.identityLabelText}>Company Name</span>
                    <input
                      className={css.identityInput}
                      type="text"
                      placeholder="e.g. Acme Inc."
                      value={form.companyName}
                      onChange={(e) => update("companyName", e.target.value)}
                    />
                  </label>
                  <label className={css.identityLabel}>
                    <span className={css.identityLabelText}>Industry</span>
                    <select
                      className={css.identitySelect}
                      value={form.industry}
                      onChange={(e) => update("industry", e.target.value)}
                    >
                      <option value="">Select industry…</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </label>
                  <label className={css.identityLabel}>
                    <span className={css.identityLabelText}>Stage</span>
                    <select
                      className={css.identitySelect}
                      value={form.stage}
                      onChange={(e) => update("stage", e.target.value)}
                    >
                      <option value="">Select stage…</option>
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 2 — Financial Position
              ═══════════════════════════════════════════════════════ */}
          {activeStep === 2 && (
            <div className={css.stepContent}>
              <div className={css.panelGrid}>

                {/* ── LIQUIDITY & CAPITAL STRUCTURE ── */}
                <div className={css.sectionPanel}>
                  <span className={css.panelStatusDot} />
                  <h3 className={css.panelTitle}>LIQUIDITY &amp; CAPITAL STRUCTURE</h3>

                  <SliderRow
                    label="Cash on Hand"
                    value={form.cashOnHand}
                    min={0} max={5_000_000} step={10_000}
                    format={fmtCurrency}
                    onChange={(v) => update("cashOnHand", v)}
                  />
                  <SliderRow
                    label="Monthly Net Burn"
                    value={form.monthlyNetBurn}
                    min={0} max={500_000} step={1_000}
                    format={fmtCurrency}
                    onChange={(v) => update("monthlyNetBurn", v)}
                  />

                  <div className={css.panelDivider} />

                  <InputRow
                    label="Debt Outstanding"
                    value={form.debtOutstanding}
                    prefix="$"
                    onChange={(v) => update("debtOutstanding", Number(v) || 0)}
                  />
                  <InputRow
                    label="Interest Rate"
                    value={form.debtInterestRate}
                    suffix="%"
                    onChange={(v) => update("debtInterestRate", Number(v) || 0)}
                  />

                  <div className={css.inputRow}>
                    <span className={css.inputLabel}>Fundraising Window</span>
                    <div className={css.incrGroup}>
                      <button
                        type="button"
                        className={css.incrBtn}
                        onClick={() =>
                          update(
                            "fundraisingWindow",
                            Math.max(0, form.fundraisingWindow - 1),
                          )
                        }
                      >
                        &minus;
                      </button>
                      <span className={css.incrValue}>
                        {form.fundraisingWindow} months
                      </span>
                      <button
                        type="button"
                        className={css.incrBtn}
                        onClick={() =>
                          update("fundraisingWindow", form.fundraisingWindow + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className={css.inputRow}>
                    <span className={css.inputLabel}>Access to Capital</span>
                    <ToggleGroup
                      options={["Moderate", "Strong"] as AccessToCapital[]}
                      value={form.accessToCapital}
                      onChange={(v) => update("accessToCapital", v)}
                    />
                  </div>

                  <div className={css.panelDivider} />
                  <div className={css.derivedRow}>
                    <span className={css.derivedLabel}>&#8901; Runway</span>
                    <span className={css.derivedValue}>
                      {metrics.runway.toFixed(1)} months
                      &nbsp;&nbsp;{metrics.burnMultiple.toFixed(1)}x
                    </span>
                  </div>
                  {form.debtOutstanding > 0 && (
                    <div className={css.derivedRow}>
                      <span className={css.derivedLabel}>
                        &#8901; Monthly Interest Burden
                      </span>
                      <span className={css.derivedValue}>
                        {fmtCurrency(
                          (form.debtOutstanding * (form.debtInterestRate / 100)) / 12,
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── REVENUE ENGINE ── */}
                <div className={css.sectionPanel}>
                  <span className={css.panelStatusDot} />
                  <h3 className={css.panelTitle}>REVENUE ENGINE</h3>

                  <SliderRow
                    label="Current ARR"
                    value={form.currentARR}
                    min={0} max={10_000_000} step={10_000}
                    format={fmtCurrency}
                    onChange={(v) => update("currentARR", v)}
                  />
                  <SliderRow
                    label="Monthly Growth %"
                    value={form.monthlyGrowthPct}
                    min={0} max={30} step={0.1}
                    format={(v) => `${v.toFixed(1)}%`}
                    onChange={(v) => update("monthlyGrowthPct", v)}
                  />
                  <SliderRow
                    label="Gross Margin %"
                    value={form.grossMarginPct}
                    min={0} max={100} step={0.5}
                    format={(v) => `${v.toFixed(1)}%`}
                    onChange={(v) => update("grossMarginPct", v)}
                  />
                  <InputRow
                    label="Average Deal Size (ACV)"
                    value={form.avgDealSize}
                    prefix="$"
                    onChange={(v) => update("avgDealSize", Number(v) || 0)}
                  />
                  <SliderRow
                    label="Monthly Churn %"
                    value={form.monthlyChurnPct}
                    min={0} max={15} step={0.1}
                    format={(v) => `${v.toFixed(1)}%`}
                    onChange={(v) => update("monthlyChurnPct", v)}
                  />
                  <SliderRow
                    label="Sales Efficiency"
                    value={form.salesEfficiency}
                    min={0} max={3} step={0.1}
                    format={(v) => `${v.toFixed(1)}x`}
                    onChange={(v) => update("salesEfficiency", v)}
                  />
                  <SliderRow
                    label="Net Revenue Retention %"
                    value={form.netRevenueRetentionPct}
                    min={50} max={200} step={1}
                    format={(v) => `${v}%`}
                    onChange={(v) => update("netRevenueRetentionPct", v)}
                  />
                </div>

                {/* ── COST STRUCTURE ── */}
                <div className={css.sectionPanel}>
                  <span className={css.panelStatusDot} />
                  <button
                    type="button"
                    className={css.panelTitleBtn}
                    onClick={() => setCostExpanded((p) => !p)}
                  >
                    <h3 className={css.panelTitle}>COST STRUCTURE</h3>
                    <span
                      className={css.expandChevron}
                      style={{
                        transform: costExpanded ? "rotate(180deg)" : "rotate(0)",
                      }}
                    >
                      &#9660;
                    </span>
                  </button>

                  {costExpanded && (
                    <>
                      <InputRow
                        label="Headcount"
                        value={form.headcount}
                        onChange={(v) => update("headcount", Number(v) || 0)}
                      />
                      <InputRow
                        label="Avg Fully Loaded Cost"
                        value={form.avgFullyLoadedCost}
                        prefix="$"
                        onChange={(v) =>
                          update("avgFullyLoadedCost", Number(v) || 0)
                        }
                      />
                      <InputRow
                        label="Sales & Marketing Spend"
                        value={form.salesMarketingSpend}
                        prefix="$"
                        onChange={(v) =>
                          update("salesMarketingSpend", Number(v) || 0)
                        }
                      />
                      <InputRow
                        label="R&D Spend"
                        value={form.rdSpend}
                        prefix="$"
                        onChange={(v) => update("rdSpend", Number(v) || 0)}
                      />
                      <InputRow
                        label="G&A Spend"
                        value={form.gaSpend}
                        prefix="$"
                        onChange={(v) => update("gaSpend", Number(v) || 0)}
                      />

                      <div className={css.panelDivider} />

                      <div className={css.derivedRow}>
                        <span className={css.derivedLabel}>
                          Revenue / Employee
                        </span>
                        <span className={css.derivedValue}>
                          {fmtCurrency(revenuePerEmployee)}
                        </span>
                      </div>
                      <div className={css.derivedRow}>
                        <span className={css.derivedLabel}>
                          Revenue and Operating Profit
                        </span>
                        <span
                          className={css.derivedValue}
                          style={{
                            color:
                              operatingProfit >= 0 ? "#34d399" : "#f87171",
                          }}
                        >
                          {operatingProfit < 0 ? "-" : ""}
                          {fmtCurrency(Math.abs(operatingProfit))}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* ── BURN METRICS ── */}
                <div className={css.sectionPanel}>
                  <span className={css.panelStatusDot} />
                  <h3 className={css.panelTitle}>BURN METRICS</h3>

                  <SliderRow
                    label="Revenue per Employee"
                    value={revenuePerEmployee}
                    min={0} max={200_000} step={1_000}
                    format={fmtCurrency}
                    onChange={() => {}}
                    showScale={false}
                  />

                  <div className={css.panelDivider} />

                  <div className={css.derivedRow}>
                    <span className={css.derivedLabel}>
                      &#8901; Burn Multiple
                    </span>
                    <span className={css.derivedValue}>
                      {metrics.burnMultiple.toFixed(1)}x
                    </span>
                  </div>
                  <div className={css.derivedRow}>
                    <span className={css.derivedLabel}>
                      &#8901; Derived Monthly Burn
                    </span>
                    <span className={css.derivedValue}>
                      {fmtCurrency(metrics.monthlyBurn)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 3 — Operating Structure
              ═══════════════════════════════════════════════════════ */}
          {activeStep === 3 && (
            <div className={css.stepContent}>
              <div className={css.panelGrid}>
                <div className={css.sectionPanel}>
                  <span className={css.panelStatusDot} />
                  <h3 className={css.panelTitle}>EXECUTION VELOCITY</h3>

                  <div className={css.inputRow}>
                    <span className={css.inputLabel}>Hiring Velocity</span>
                    <ToggleGroup
                      options={["Low", "Medium", "High"] as HiringVelocity[]}
                      value={form.hiringVelocity}
                      onChange={(v) => update("hiringVelocity", v)}
                    />
                  </div>
                  <SliderRow
                    label="Sales Ramp Time"
                    value={form.salesRampTime}
                    min={1} max={12} step={1}
                    format={(v) => `${v} months`}
                    onChange={(v) => update("salesRampTime", v)}
                    showScale={false}
                  />
                  <SliderRow
                    label="Engineering Velocity"
                    value={form.engineeringVelocity}
                    min={1} max={12} step={1}
                    format={(v) => `${v} months`}
                    onChange={(v) => update("engineeringVelocity", v)}
                    showScale={false}
                  />
                  <div className={css.inputRow}>
                    <span className={css.inputLabel}>Burn Flexibility</span>
                    <ToggleGroup
                      options={["Fixed", "Variable"] as BurnFlexibility[]}
                      value={form.burnFlexibility}
                      onChange={(v) => update("burnFlexibility", v)}
                    />
                  </div>
                </div>

                <div className={css.sectionPanel}>
                  <span className={css.panelStatusDot} />
                  <h3 className={css.panelTitle}>COST &amp; COGS</h3>

                  <InputRow
                    label="Headcount"
                    value={form.headcount}
                    onChange={(v) => update("headcount", Number(v) || 0)}
                  />
                  <InputRow
                    label="Avg Fully Loaded Cost"
                    value={form.avgFullyLoadedCost}
                    prefix="$"
                    onChange={(v) =>
                      update("avgFullyLoadedCost", Number(v) || 0)
                    }
                  />
                  <InputRow
                    label="G&A Spend"
                    value={form.gaSpend}
                    prefix="$"
                    onChange={(v) => update("gaSpend", Number(v) || 0)}
                  />
                  <InputRow
                    label="COGS"
                    value={form.cogsPct}
                    prefix="$"
                    onChange={(v) => update("cogsPct", Number(v) || 0)}
                  />

                  <div className={css.panelDivider} />
                  <SliderRow
                    label="Revenue per Employee"
                    value={revenuePerEmployee}
                    min={0} max={200_000} step={1_000}
                    format={fmtCurrency}
                    onChange={() => {}}
                    showScale={false}
                  />
                </div>

                {/* ── CUSTOMER UNIT ECONOMICS ── */}
                <div className={css.sectionPanel}>
                  <span className={css.panelStatusDot} />
                  <h3 className={css.panelTitle}>CUSTOMER UNIT ECONOMICS</h3>

                  <InputRow
                    label="CAC (Acquisition Cost)"
                    value={form.cac}
                    prefix="$"
                    onChange={(v) => update("cac", Number(v) || 0)}
                  />
                  <SliderRow
                    label="Gross Margin %"
                    value={form.grossMarginPct}
                    min={0} max={100} step={0.5}
                    format={(v) => `${v.toFixed(1)}%`}
                    onChange={(v) => update("grossMarginPct", v)}
                  />

                  <div className={css.panelDivider} />

                  <div className={css.derivedRow}>
                    <span className={css.derivedLabel}>
                      &#8901; Gross Profit / mo
                    </span>
                    <span className={css.derivedValue}>
                      {fmtCurrency(grossProfit)}
                    </span>
                  </div>
                  <div className={css.derivedRow}>
                    <span className={css.derivedLabel}>
                      &#8901; LTV
                    </span>
                    <span className={css.derivedValue}>
                      {ltv > 0 ? fmtCurrency(ltv) : "\u2014"}
                    </span>
                  </div>
                  <div className={css.derivedRow}>
                    <span className={css.derivedLabel}>
                      &#8901; LTV / CAC
                    </span>
                    <span
                      className={css.derivedValue}
                      style={{
                        color:
                          ltvCacRatio >= 3
                            ? "#34d399"
                            : ltvCacRatio >= 1
                              ? "#fbbf24"
                              : "#f87171",
                      }}
                    >
                      {ltvCacRatio > 0 ? `${ltvCacRatio.toFixed(1)}x` : "\u2014"}
                    </span>
                  </div>
                  <div className={css.derivedRow}>
                    <span className={css.derivedLabel}>
                      &#8901; CAC Payback
                    </span>
                    <span className={css.derivedValue}>
                      {cacPaybackMonths > 0
                        ? `${cacPaybackMonths.toFixed(1)} months`
                        : "\u2014"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 4 — Strategic Intent
              ═══════════════════════════════════════════════════════ */}
          {activeStep === 4 && (
            <div className={css.stepContent}>
              <div className={css.panelGrid}>
                <div className={css.sectionPanel}>
                  <span className={css.panelStatusDot} />
                  <h3 className={css.panelTitle}>STRATEGIC POSTURE</h3>

                  <div className={css.inputRow}>
                    <span className={css.inputLabel}>Risk Tolerance</span>
                    <ToggleGroup
                      options={
                        [
                          "Conservative",
                          "Balanced",
                          "Aggressive",
                        ] as RiskTolerance[]
                      }
                      value={form.riskTolerance}
                      onChange={(v) => update("riskTolerance", v)}
                    />
                  </div>
                  <SliderRow
                    label="Target Growth Band"
                    value={form.targetGrowthBand}
                    min={1} max={12} step={1}
                    format={(v) => `${v} months`}
                    onChange={(v) => update("targetGrowthBand", v)}
                    showScale={false}
                  />

                  <div className={css.priorityRow}>
                    <span className={css.priorityLabel}>Priority Balance</span>
                    <div className={css.priorityControl}>
                      <span className={css.priorityEnd}>Survival</span>
                      <input
                        type="range"
                        className={css.sliderInput}
                        min={0} max={100} step={1}
                        value={form.priorityBalance}
                        style={sliderFill(form.priorityBalance, 0, 100)}
                        onChange={(e) =>
                          update("priorityBalance", Number(e.target.value))
                        }
                      />
                      <span className={css.priorityEnd}>Expansion</span>
                    </div>
                  </div>
                </div>

                <div className={css.sectionPanel}>
                  <span className={css.panelStatusDot} />
                  <h3 className={css.panelTitle}>SUMMARY</h3>
                  <div className={css.summaryGrid}>
                    <div className={css.summaryItem}>
                      <span className={css.summaryItemLabel}>Runway</span>
                      <span className={css.summaryItemValue}>
                        {metrics.runway.toFixed(1)} months
                      </span>
                    </div>
                    <div className={css.summaryItem}>
                      <span className={css.summaryItemLabel}>Burn Multiple</span>
                      <span className={css.summaryItemValue}>
                        {metrics.burnMultiple.toFixed(2)}x
                      </span>
                    </div>
                    <div className={css.summaryItem}>
                      <span className={css.summaryItemLabel}>Monthly Burn</span>
                      <span className={css.summaryItemValue}>
                        {fmtCurrency(metrics.monthlyBurn)}
                      </span>
                    </div>
                    <div className={css.summaryItem}>
                      <span className={css.summaryItemLabel}>Survival</span>
                      <span className={css.summaryItemValue}>
                        {metrics.survivalProbability}%
                      </span>
                    </div>
                    <div className={css.summaryItem}>
                      <span className={css.summaryItemLabel}>
                        Revenue / Head
                      </span>
                      <span className={css.summaryItemValue}>
                        {fmtCurrency(revenuePerEmployee)}
                      </span>
                    </div>
                    <div className={css.summaryItem}>
                      <span className={css.summaryItemLabel}>Op. Profit</span>
                      <span
                        className={css.summaryItemValue}
                        style={{
                          color:
                            operatingProfit >= 0 ? "#34d399" : "#f87171",
                        }}
                      >
                        {fmtCurrency(operatingProfit)}
                      </span>
                    </div>
                    <div className={css.summaryItem}>
                      <span className={css.summaryItemLabel}>Gross Margin</span>
                      <span className={css.summaryItemValue}>
                        {form.grossMarginPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className={css.summaryItem}>
                      <span className={css.summaryItemLabel}>LTV / CAC</span>
                      <span
                        className={css.summaryItemValue}
                        style={{
                          color:
                            ltvCacRatio >= 3
                              ? "#34d399"
                              : ltvCacRatio >= 1
                                ? "#fbbf24"
                                : "#f87171",
                        }}
                      >
                        {ltvCacRatio > 0 ? `${ltvCacRatio.toFixed(1)}x` : "\u2014"}
                      </span>
                    </div>
                    <div className={css.summaryItem}>
                      <span className={css.summaryItemLabel}>CAC Payback</span>
                      <span className={css.summaryItemValue}>
                        {cacPaybackMonths > 0
                          ? `${cacPaybackMonths.toFixed(1)} mo`
                          : "\u2014"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ CONSOLE ACTION BAR ═══ */}
          <footer className={css.footer}>
            <div className={css.footerStatus}>
              <span className={css.footerDot} />
              DRAFT &mdash; NOT LOCKED
            </div>
            <div className={css.footerActions}>
              {canGoBack && (
                <button
                  type="button"
                  className={css.backBtn}
                  onClick={() =>
                    setActiveStep((activeStep - 1) as WizardStep)
                  }
                >
                  BACK
                </button>
              )}
              {canGoNext ? (
                <button
                  type="button"
                  className={css.lockBtn}
                  onClick={() =>
                    setActiveStep((activeStep + 1) as WizardStep)
                  }
                >
                  NEXT &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  className={css.lockBtn}
                  onClick={handleLock}
                >
                  LOCK BASELINE &amp; ENTER STRATFIT
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>
    </ConsoleFrame>
  )
}
