import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useBaselineStore } from "@/state/baselineStore"
import styles from "./IngressConsoleV2.module.css"

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
    background: `linear-gradient(90deg, #065f73 0%, #0e7490 ${pct * 0.3}%, #22d3ee ${pct * 0.7}%, #67e8f9 ${pct}%, rgba(255,255,255,0.035) ${pct}%, rgba(255,255,255,0.035) 100%)`,
    boxShadow: pct > 3
      ? `0 0 ${4 + pct * 0.08}px rgba(34,211,238,${0.14 + pct * 0.003}), inset 0 1px 2px rgba(0,0,0,0.30)`
      : 'inset 0 1px 2px rgba(0,0,0,0.30)',
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
   SUB-COMPONENTS — Compact Inline Variants
   ═══════════════════════════════════════════════════════════════════ */

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}

/** V2 Compact Inline Slider: Label LEFT · Track MID · Value RIGHT */
function SliderRow({
  label, value, min, max, step, format, onChange,
}: SliderRowProps) {
  return (
    <div className={styles.sliderRow}>
      <span className={styles.sliderLabel}>{label}</span>
      <div className={styles.sliderControl}>
        <input
          type="range"
          className={styles.sliderInput}
          min={min}
          max={max}
          step={step}
          value={value}
          style={sliderFill(value, min, max)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <span className={styles.sliderValue}>{format(value)}</span>
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
  const displayValue =
    type === "number" && typeof value === "number"
      ? value.toLocaleString()
      : value
  return (
    <div className={styles.inputRow}>
      <span className={styles.inputLabel}>{label}</span>
      <div className={styles.inputFieldWrap}>
        {prefix && <span className={styles.inputPrefix}>{prefix}</span>}
        <input
          className={styles.inputField}
          type="text"
          inputMode={type === "number" ? "numeric" : undefined}
          value={displayValue}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, "")
            onChange(raw)
          }}
        />
        {suffix && <span className={styles.inputSuffix}>{suffix}</span>}
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
    <div className={styles.toggleGroup}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`${styles.toggleOption} ${value === opt ? styles.toggleOptionActive : ""}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — V2 Dense Instrument Console
   ═══════════════════════════════════════════════════════════════════ */

export default function InitializeBaselineConsoleV2() {
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
  }, [form, setBaseline, navigate])

  const canGoNext = activeStep < 4
  const canGoBack = activeStep > 1

  /* ══════════════════ RENDER ══════════════════ */

  return (
    <>
    <div className={styles.outerChassis}>
      <div className={styles.bezelFrame} data-sf-chassis>
        <div className={styles.glassSurface}>
          <div className={styles.backdrop} aria-hidden="true" />
          <div data-sf-initiate="v2" className={styles.consoleLayout}>

            {/* ── V2 debug badge ── */}
            <div
              style={{
                position: "fixed",
                top: 12,
                right: 12,
                zIndex: 99999,
                background: "rgba(0, 220, 255, 0.16)",
                border: "1px solid rgba(120, 220, 255, 0.35)",
                padding: "8px 10px",
                borderRadius: 10,
                color: "#67e8f9",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                pointerEvents: "none" as const,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              INITIATE V2
            </div>

        {/* ═══════════ LEFT SIDEBAR — System Nav Rail ═══════════ */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarLogo}>
              <img
                src="/stratfit-logo.png"
                alt="STRATFIT"
                className={styles.sidebarLogoImg}
              />
            </div>
          </div>

          <nav className={styles.wizardNav}>
            {WIZARD_STEPS.map((step) => (
              <button
                key={step.num}
                type="button"
                className={`${styles.wizardStep} ${activeStep === step.num ? styles.wizardStepActive : ""} ${activeStep > step.num ? styles.wizardStepDone : ""}`}
                onClick={() => setActiveStep(step.num)}
              >
                <span className={styles.wizardStepNum}>
                  {activeStep > step.num ? "\u2713" : step.num}
                </span>
                <span className={styles.wizardStepLabel}>{step.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ═══════════ MAIN INSTRUMENT AREA ═══════════ */}
        <main className={styles.instrumentArea}>
          {/* ── Phase 2.0: Inner Platform shelf ── */}
          <div className={styles.innerPlatform}>

          {/* ── Instrument Header ── */}
          <header className={styles.instrumentHeader}>
            <h1 className={styles.instrumentTitle}>INITIALIZE BASELINE</h1>
            <p className={styles.instrumentSubtitle}>
              Enter your current financial truth to anchor scenario modeling.
            </p>
          </header>

          {/* ── Metrics Readout Strip ── */}
          <div className={styles.metricsStrip}>
            <div className={styles.metricItem}>
              <span className={styles.metricIcon}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v5l3.5 2" stroke="rgba(34,211,238,0.65)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="7" cy="7" r="5.5" stroke="rgba(34,211,238,0.35)" strokeWidth="1.2" opacity="0.5"/>
                </svg>
              </span>
              <span
                className={styles.metricValue}
                style={{
                  color:
                    metrics.runway < 6
                      ? "#f87171"
                      : metrics.runway < 12
                        ? "#fbbf24"
                        : "rgba(255,255,255,0.90)",
                }}
              >
                {metrics.runway.toFixed(1)}
              </span>
              <span className={styles.metricUnit}>months</span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>BURN MULTIPLE</span>
              <span className={styles.metricValue}>
                {metrics.burnMultiple.toFixed(2)} x
              </span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>$ MONTHLY BURN</span>
              <span className={styles.metricValue}>
                {fmtCurrency(metrics.monthlyBurn)}
              </span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>SURVIVAL PROBABILITY</span>
              <span className={styles.metricValue}>
                {metrics.survivalProbability} %
              </span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>GROSS MARGIN</span>
              <span className={styles.metricValue}>
                {form.grossMarginPct.toFixed(0)} %
              </span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>LTV / CAC</span>
              <span
                className={styles.metricValue}
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
          </div>

          {/* ── Phase 2.0: Zone Separator ── */}
          <div className={styles.zoneSeparator} />

          {/* ═══════════════════════════════════════════════════════
              STEP 1 — Identity & Context
              ═══════════════════════════════════════════════════════ */}
          {activeStep === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.singlePanel}>
                <h3 className={styles.panelTitle}>IDENTITY &amp; CONTEXT</h3>
                <div className={styles.panelBody}>
                <div className={styles.identityGrid}>
                  <label className={styles.identityLabel}>
                    <span className={styles.identityLabelText}>Company Name</span>
                    <input
                      className={styles.identityInput}
                      type="text"
                      placeholder="e.g. Acme Inc."
                      value={form.companyName}
                      onChange={(e) => update("companyName", e.target.value)}
                    />
                  </label>
                  <label className={styles.identityLabel}>
                    <span className={styles.identityLabelText}>Industry</span>
                    <select
                      className={styles.identitySelect}
                      value={form.industry}
                      onChange={(e) => update("industry", e.target.value)}
                    >
                      <option value="">Select industry…</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.identityLabel}>
                    <span className={styles.identityLabelText}>Stage</span>
                    <select
                      className={styles.identitySelect}
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
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 2 — Financial Position
              ═══════════════════════════════════════════════════════ */}
          {activeStep === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.panelGrid}>

                {/* ── LIQUIDITY & CAPITAL STRUCTURE ── */}
                <div className={styles.sectionPanel}>
                  <span className={styles.panelStatusDot} />
                  <h3 className={styles.panelTitle}>LIQUIDITY &amp; CAPITAL STRUCTURE</h3>
                  <div className={styles.panelBody}>

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

                  <div className={styles.panelDivider} />

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

                  <div className={styles.inputRow}>
                    <span className={styles.inputLabel}>Fundraising Window</span>
                    <div className={styles.incrGroup}>
                      <button
                        type="button"
                        className={styles.incrBtn}
                        onClick={() =>
                          update(
                            "fundraisingWindow",
                            Math.max(0, form.fundraisingWindow - 1),
                          )
                        }
                      >
                        &minus;
                      </button>
                      <span className={styles.incrValue}>
                        {form.fundraisingWindow} months
                      </span>
                      <button
                        type="button"
                        className={styles.incrBtn}
                        onClick={() =>
                          update("fundraisingWindow", form.fundraisingWindow + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputRow}>
                    <span className={styles.inputLabel}>Access to Capital</span>
                    <ToggleGroup
                      options={["Moderate", "Strong"] as AccessToCapital[]}
                      value={form.accessToCapital}
                      onChange={(v) => update("accessToCapital", v)}
                    />
                  </div>

                  <div className={styles.panelDivider} />
                  <div className={styles.derivedRow}>
                    <span className={styles.derivedLabel}>&#8901; Runway</span>
                    <span className={styles.derivedValue}>
                      {metrics.runway.toFixed(1)} months
                      &nbsp;&nbsp;{metrics.burnMultiple.toFixed(1)}x
                    </span>
                  </div>
                  {form.debtOutstanding > 0 && (
                    <div className={styles.derivedRow}>
                      <span className={styles.derivedLabel}>
                        &#8901; Monthly Interest Burden
                      </span>
                      <span className={styles.derivedValue}>
                        {fmtCurrency(
                          (form.debtOutstanding * (form.debtInterestRate / 100)) / 12,
                        )}
                      </span>
                    </div>
                  )}
                  </div>
                </div>

                {/* ── REVENUE ENGINE ── */}
                <div className={styles.sectionPanel}>
                  <span className={styles.panelStatusDot} />
                  <h3 className={styles.panelTitle}>REVENUE ENGINE</h3>
                  <div className={styles.panelBody}>

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
                    label="NRR %"
                    value={form.netRevenueRetentionPct}
                    min={50} max={200} step={1}
                    format={(v) => `${v}%`}
                    onChange={(v) => update("netRevenueRetentionPct", v)}
                  />
                  </div>
                </div>

                {/* ── COST STRUCTURE ── */}
                <div className={styles.sectionPanel}>
                  <span className={styles.panelStatusDot} />
                  <button
                    type="button"
                    className={styles.panelTitleBtn}
                    onClick={() => setCostExpanded((p) => !p)}
                  >
                    <h3 className={styles.panelTitle}>COST STRUCTURE</h3>
                    <span
                      className={styles.expandChevron}
                      style={{
                        transform: costExpanded ? "rotate(180deg)" : "rotate(0)",
                      }}
                    >
                      &#9660;
                    </span>
                  </button>
                  <div className={styles.panelBody}>

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
                        label="Sales & Marketing"
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

                      <div className={styles.panelDivider} />

                      <div className={styles.derivedRow}>
                        <span className={styles.derivedLabel}>
                          Revenue / Employee
                        </span>
                        <span className={styles.derivedValue}>
                          {fmtCurrency(revenuePerEmployee)}
                        </span>
                      </div>
                      <div className={styles.derivedRow}>
                        <span className={styles.derivedLabel}>
                          Operating Profit
                        </span>
                        <span
                          className={styles.derivedValue}
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
                </div>

                {/* ── BURN METRICS ── */}
                <div className={styles.sectionPanel}>
                  <span className={styles.panelStatusDot} />
                  <h3 className={styles.panelTitle}>BURN METRICS</h3>
                  <div className={styles.panelBody}>

                  <SliderRow
                    label="Revenue / Head"
                    value={revenuePerEmployee}
                    min={0} max={200_000} step={1_000}
                    format={fmtCurrency}
                    onChange={() => {}}
                  />

                  <div className={styles.panelDivider} />

                  <div className={styles.derivedRow}>
                    <span className={styles.derivedLabel}>
                      &#8901; Burn Multiple
                    </span>
                    <span className={styles.derivedValue}>
                      {metrics.burnMultiple.toFixed(1)}x
                    </span>
                  </div>
                  <div className={styles.derivedRow}>
                    <span className={styles.derivedLabel}>
                      &#8901; Monthly Burn
                    </span>
                    <span className={styles.derivedValue}>
                      {fmtCurrency(metrics.monthlyBurn)}
                    </span>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 3 — Operating Structure
              ═══════════════════════════════════════════════════════ */}
          {activeStep === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.panelGrid}>
                <div className={styles.sectionPanel}>
                  <span className={styles.panelStatusDot} />
                  <h3 className={styles.panelTitle}>EXECUTION VELOCITY</h3>
                  <div className={styles.panelBody}>

                  <div className={styles.inputRow}>
                    <span className={styles.inputLabel}>Hiring Velocity</span>
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
                    format={(v) => `${v} mo`}
                    onChange={(v) => update("salesRampTime", v)}
                  />
                  <SliderRow
                    label="Eng Velocity"
                    value={form.engineeringVelocity}
                    min={1} max={12} step={1}
                    format={(v) => `${v} mo`}
                    onChange={(v) => update("engineeringVelocity", v)}
                  />
                  <div className={styles.inputRow}>
                    <span className={styles.inputLabel}>Burn Flexibility</span>
                    <ToggleGroup
                      options={["Fixed", "Variable"] as BurnFlexibility[]}
                      value={form.burnFlexibility}
                      onChange={(v) => update("burnFlexibility", v)}
                    />
                  </div>
                  </div>
                </div>

                <div className={styles.sectionPanel}>
                  <span className={styles.panelStatusDot} />
                  <h3 className={styles.panelTitle}>COST &amp; COGS</h3>
                  <div className={styles.panelBody}>

                  <InputRow
                    label="Headcount"
                    value={form.headcount}
                    onChange={(v) => update("headcount", Number(v) || 0)}
                  />
                  <InputRow
                    label="Avg Loaded Cost"
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

                  <div className={styles.panelDivider} />
                  <SliderRow
                    label="Revenue / Head"
                    value={revenuePerEmployee}
                    min={0} max={200_000} step={1_000}
                    format={fmtCurrency}
                    onChange={() => {}}
                  />
                  </div>
                </div>

                {/* ── CUSTOMER UNIT ECONOMICS ── */}
                <div className={styles.sectionPanel}>
                  <span className={styles.panelStatusDot} />
                  <h3 className={styles.panelTitle}>CUSTOMER UNIT ECONOMICS</h3>
                  <div className={styles.panelBody}>

                  <InputRow
                    label="CAC (Cost)"
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

                  <div className={styles.panelDivider} />

                  <div className={styles.derivedRow}>
                    <span className={styles.derivedLabel}>
                      &#8901; Gross Profit / mo
                    </span>
                    <span className={styles.derivedValue}>
                      {fmtCurrency(grossProfit)}
                    </span>
                  </div>
                  <div className={styles.derivedRow}>
                    <span className={styles.derivedLabel}>&#8901; LTV</span>
                    <span className={styles.derivedValue}>
                      {ltv > 0 ? fmtCurrency(ltv) : "\u2014"}
                    </span>
                  </div>
                  <div className={styles.derivedRow}>
                    <span className={styles.derivedLabel}>&#8901; LTV / CAC</span>
                    <span
                      className={styles.derivedValue}
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
                  <div className={styles.derivedRow}>
                    <span className={styles.derivedLabel}>&#8901; CAC Payback</span>
                    <span className={styles.derivedValue}>
                      {cacPaybackMonths > 0
                        ? `${cacPaybackMonths.toFixed(1)} months`
                        : "\u2014"}
                    </span>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 4 — Strategic Intent
              ═══════════════════════════════════════════════════════ */}
          {activeStep === 4 && (
            <div className={styles.stepContent}>
              <div className={styles.panelGrid}>
                <div className={styles.sectionPanel}>
                  <span className={styles.panelStatusDot} />
                  <h3 className={styles.panelTitle}>STRATEGIC POSTURE</h3>
                  <div className={styles.panelBody}>

                  <div className={styles.inputRow}>
                    <span className={styles.inputLabel}>Risk Tolerance</span>
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
                    label="Growth Band"
                    value={form.targetGrowthBand}
                    min={1} max={12} step={1}
                    format={(v) => `${v} mo`}
                    onChange={(v) => update("targetGrowthBand", v)}
                  />

                  <div className={styles.priorityRow}>
                    <span className={styles.priorityLabel}>Priority Balance</span>
                    <div className={styles.priorityControl}>
                      <span className={styles.priorityEnd}>Survival</span>
                      <input
                        type="range"
                        className={styles.sliderInput}
                        min={0} max={100} step={1}
                        value={form.priorityBalance}
                        style={sliderFill(form.priorityBalance, 0, 100)}
                        onChange={(e) =>
                          update("priorityBalance", Number(e.target.value))
                        }
                      />
                      <span className={styles.priorityEnd}>Expansion</span>
                    </div>
                  </div>
                  </div>
                </div>

                <div className={styles.sectionPanel}>
                  <span className={styles.panelStatusDot} />
                  <h3 className={styles.panelTitle}>SUMMARY</h3>
                  <div className={styles.panelBody}>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>Runway</span>
                      <span className={styles.summaryItemValue}>
                        {metrics.runway.toFixed(1)} mo
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>Burn Multiple</span>
                      <span className={styles.summaryItemValue}>
                        {metrics.burnMultiple.toFixed(2)}x
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>Monthly Burn</span>
                      <span className={styles.summaryItemValue}>
                        {fmtCurrency(metrics.monthlyBurn)}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>Survival</span>
                      <span className={styles.summaryItemValue}>
                        {metrics.survivalProbability}%
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>Rev / Head</span>
                      <span className={styles.summaryItemValue}>
                        {fmtCurrency(revenuePerEmployee)}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>Op. Profit</span>
                      <span
                        className={styles.summaryItemValue}
                        style={{
                          color:
                            operatingProfit >= 0 ? "#34d399" : "#f87171",
                        }}
                      >
                        {fmtCurrency(operatingProfit)}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>Gross Margin</span>
                      <span className={styles.summaryItemValue}>
                        {form.grossMarginPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>LTV / CAC</span>
                      <span
                        className={styles.summaryItemValue}
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
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryItemLabel}>CAC Payback</span>
                      <span className={styles.summaryItemValue}>
                        {cacPaybackMonths > 0
                          ? `${cacPaybackMonths.toFixed(1)} mo`
                          : "\u2014"}
                      </span>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ CONSOLE ACTION BAR ═══ */}
          <footer className={styles.footer}>
            <div className={styles.footerStatus}>
              <span className={styles.footerDot} />
              DRAFT &mdash; NOT LOCKED
            </div>
            <div className={styles.footerActions}>
              {canGoBack && (
                <button
                  type="button"
                  className={styles.backBtn}
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
                  className={styles.lockBtn}
                  onClick={() =>
                    setActiveStep((activeStep + 1) as WizardStep)
                  }
                >
                  NEXT &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.lockBtn}
                  onClick={handleLock}
                >
                  LOCK BASELINE &amp; ENTER STRATFIT
                </button>
              )}
            </div>
          </footer>

          </div>
          {/* ^^^ innerPlatform */}
        </main>

          </div>
          {/* ^^^ consoleLayout */}
        </div>
        {/* ^^^ glassSurface */}
      </div>
      {/* ^^^ bezelFrame */}
    </div>
    </>
  )
}
