// src/pages/initialize/InitializeBaselinePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — System Calibration · 11/10 Institutional Refinement
// 5-Module Left Command Rail · Financial Truth Layer ONLY.
// Zero strategic controls. Zero scenario sliders. Zero future intent.
// Data: useSystemBaseline() — single canonical provider.
// Baseline is ALWAYS editable. No lock state.
// Bloomberg-meets-Palantir. Not SaaS marketing UI.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import styles from "./InitializeBaselinePage.module.css"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { SystemBlueprintBackground } from "@/components/system/SystemBlueprintBackground"
import { StaticTerrainPreview } from "@/components/system/StaticTerrainPreview"
import type { BaselineV1 } from "@/onboard/baseline"

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
// FORMATTING HELPERS — Bloomberg precision
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
// MODULE DEFINITIONS — Left Command Rail
// ═══════════════════════════════════════════════════════════════════════════

type ModuleId = "company" | "financial" | "capital" | "operations" | "customer"

const MODULES: { id: ModuleId; num: string; label: string }[] = [
  { id: "company", num: "01", label: "Company" },
  { id: "financial", num: "02", label: "Financial" },
  { id: "capital", num: "03", label: "Capital" },
  { id: "operations", num: "04", label: "Operations" },
  { id: "customer", num: "05", label: "Customer" },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function InitializeBaselinePage() {
  // ── Provider: canonical baseline source ───────────────────────────────
  const { baseline: storedBaseline, setBaseline: commitBaseline } =
    useSystemBaseline()

  // ── Local working state (initialised from provider or defaults) ──────
  const [baseline, setBaseline] = useState<BaselineV1>(() =>
    storedBaseline ? migrateBaseline(storedBaseline) : createDefaultBaseline()
  )
  const [activeModule, setActiveModule] = useState<ModuleId>("company")

  // ── Recalculation shimmer — micro-feedback on field update ───────────
  const [shimmerKey, setShimmerKey] = useState(0)
  const isFirstRender = useRef(true)

  // ── Sync local → provider on every mutation (auto-save) ──────────────
  useEffect(() => {
    commitBaseline(baseline)
    // Trigger shimmer on update (skip first render)
    if (isFirstRender.current) {
      isFirstRender.current = false
    } else {
      setShimmerKey((k) => k + 1)
    }
  }, [baseline, commitBaseline])

  // ── Derived KPIs — explicit guards, never falsy coercion ─────────────
  const runway = useMemo((): string => {
    const burn = baseline.financial.monthlyBurn
    const cash = baseline.financial.cashOnHand
    if (burn <= 0) return "—"
    return fmtMonths(cash / burn)
  }, [baseline.financial])

  const interestBurden = useMemo((): string => {
    const debt = baseline.capital.totalDebt
    const rate = baseline.capital.interestRatePct
    if (debt <= 0 || rate <= 0) return "—"
    return fmtCurrency((debt * rate) / 100 / 12)
  }, [baseline.capital])

  const burnMultiple = useMemo((): string => {
    const burn = baseline.financial.monthlyBurn
    const arr = baseline.financial.arr
    if (arr <= 0 || burn <= 0) return "—"
    return fmtMultiple(burn / (arr / 12))
  }, [baseline.financial])

  const revPerEmployee = useMemo((): string => {
    const arr = baseline.financial.arr
    const hc = baseline.financial.headcount
    if (arr <= 0 || hc <= 0) return "—"
    return fmtCurrency(arr / hc)
  }, [baseline.financial])

  // ── Terrain preview data points (derived from baseline for SVG wire mesh) ─
  const terrainPoints = useMemo(() => {
    const fin = baseline.financial
    const op = baseline.operating
    const cap = baseline.capital
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
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
    (field: keyof BaselineV1["capital"], value: number) => {
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

  // ── Continue to platform (no lock — always editable) ─────────────────
  const handleContinue = useCallback(() => {
    commitBaseline(baseline)
    window.location.assign("/")
  }, [baseline, commitBaseline])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER — no early returns. Shell always mounts.
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className={styles.root}>
      {/* ── Layer 0: Blueprint system background (pure CSS+SVG, no WebGL) ── */}
      <SystemBlueprintBackground />
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.atmosphericGlow} aria-hidden="true" />

      {/* ── Left Command Rail — Structural Spine ───────────────── */}
      <aside className={styles.rail}>
        <div className={styles.logoBlock}>
          <div className={styles.logoIcon}>&#x25C6;</div>
          <div>
            <div className={styles.logoTitle}>STRATFIT</div>
            <div className={styles.logoSub}>System Calibration</div>
      </div>
      </div>

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

      {/* ── Center Content Pane ─────────────────────────────────── */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>System Calibration</h1>
          <p className={styles.subtitle}>
            Structural truth capture — current financial &amp; operational state
          </p>
        </header>

        {/* ═══ KPI Instrument Strip ════════════════════════════════ */}
        <div className={styles.kpiStrip}>
          <KPICell label="Runway" value={runway} />
          <div className={styles.kpiSep} />
          <KPICell label="Burn Multiple" value={burnMultiple} />
          <div className={styles.kpiSep} />
          <KPICell label="Interest Burden" value={interestBurden} />
          <div className={styles.kpiSep} />
          <KPICell label="Rev / Employee" value={revPerEmployee} />
      </div>

        {/* ═══ Module Panel (cross-fade) ═══════════════════════════ */}
        <div className={styles.modulePanel} key={activeModule}>
          {activeModule === "company" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Company Identity</h2>
              <div className={styles.metricsGrid}>
                <TextField
                  label="Founder Name"
                  value={baseline.company.founderName}
                  onCommit={(v) => setCompanyStr("founderName", v)}
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
                  label="Company Name"
                  value={baseline.company.legalName}
                  onCommit={(v) => setCompanyStr("legalName", v)}
                />
                <TextField
                  label="Industry"
                  value={baseline.company.industry}
                  onCommit={(v) => setCompanyStr("industry", v)}
                />
                <TextField
                  label="Jurisdiction"
                  value={baseline.company.jurisdiction}
                  placeholder="e.g. Delaware, USA"
                  onCommit={(v) => setCompanyStr("jurisdiction", v)}
                />
                <TextField
                  label="Business Model"
                  value={baseline.company.businessModel}
                  onCommit={(v) => setCompanyStr("businessModel", v)}
                />
              </div>
            </div>
          )}

          {activeModule === "financial" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Financial Baseline</h2>
              <div className={styles.metricsGrid}>
                <NumericField
                  label="Cash on Hand"
                  value={baseline.financial.cashOnHand}
                  prefix="$"
                  onCommit={(v) => setFin("cashOnHand", v)}
                />
                <NumericField
                  label="Monthly Net Burn"
                  value={baseline.financial.monthlyBurn}
                  prefix="$"
                  onCommit={(v) => setFin("monthlyBurn", v)}
                />
                <NumericField
                  label="Current ARR"
                  value={baseline.financial.arr}
                  prefix="$"
                  onCommit={(v) => setFin("arr", v)}
                />
                <NumericField
                  label="Monthly Growth"
                  value={baseline.financial.growthRatePct}
                  suffix="%"
                  onCommit={(v) => setFin("growthRatePct", v)}
                />
                <NumericField
                  label="Monthly Churn"
                  value={baseline.operating.churnPct}
                  suffix="%"
                  onCommit={(v) => setOp("churnPct", v)}
                />
                <NumericField
                  label="Net Revenue Retention"
                  value={baseline.financial.nrrPct}
                  suffix="%"
                  onCommit={(v) => setFin("nrrPct", v)}
                />
                <NumericField
                  label="Headcount"
                  value={baseline.financial.headcount}
                  onCommit={(v) => setFin("headcount", v)}
                />
                <NumericField
                  label="Avg Fully Loaded Cost"
                  value={baseline.financial.avgFullyLoadedCost}
                  prefix="$"
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
              <div className={styles.metricsGrid}>
                <NumericField
                  label="Debt Outstanding"
                  value={baseline.capital.totalDebt}
                  prefix="$"
                  onCommit={(v) => setCap("totalDebt", v)}
                />
                <NumericField
                  label="Interest Rate"
                  value={baseline.capital.interestRatePct}
                  suffix="%"
                  onCommit={(v) => setCap("interestRatePct", v)}
                />
                <NumericField
                  label="Equity Raised to Date"
                  value={baseline.capital.equityRaisedToDate}
                  prefix="$"
                  onCommit={(v) => setCap("equityRaisedToDate", v)}
                />
              </div>
              <div className={styles.derivedRow}>
                <DerivedKPI label="Monthly Interest Burden" value={interestBurden} />
              </div>
            </div>
          )}

          {activeModule === "operations" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Operations</h2>
              <div className={styles.metricsGrid}>
                <NumericField
                  label="Gross Margin"
                  value={baseline.financial.grossMarginPct}
                  suffix="%"
                  onCommit={(v) => setFin("grossMarginPct", v)}
                />
                <NumericField
                  label="Sales Cycle Length"
                  value={baseline.operating.salesCycleMonths}
                  suffix=" mo"
                  onCommit={(v) => setOp("salesCycleMonths", v)}
                />
                <NumericField
                  label="Active Customers"
                  value={baseline.operating.activeCustomers}
                  onCommit={(v) => setOp("activeCustomers", v)}
                />
                <NumericField
                  label="Avg Deal Size"
                  value={baseline.operating.acv}
                  prefix="$"
                  onCommit={(v) => setOp("acv", v)}
                />
                <NumericField
                  label="Customer Concentration"
                  value={baseline.financial.revenueConcentrationPct}
                  suffix="%"
                  onCommit={(v) => setFin("revenueConcentrationPct", v)}
                />
              </div>
            </div>
          )}

          {activeModule === "customer" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Customer Engine</h2>
              <div className={styles.metricsGrid}>
                <NumericField
                  label="CAC"
                  value={baseline.customerEngine.cac}
                  prefix="$"
                  onCommit={(v) => setCe("cac", v)}
                />
                <NumericField
                  label="LTV"
                  value={baseline.customerEngine.ltv}
                  prefix="$"
                  onCommit={(v) => setCe("ltv", v)}
                />
                <NumericField
                  label="Payback Period"
                  value={baseline.customerEngine.paybackPeriodMonths}
                  suffix=" mo"
                  onCommit={(v) => setCe("paybackPeriodMonths", v)}
                />
                <NumericField
                  label="Expansion Rate"
                  value={baseline.customerEngine.expansionRatePct}
                  suffix="%"
                  onCommit={(v) => setCe("expansionRatePct", v)}
                />
              </div>
        </div>
      )}
        </div>

        {/* ═══ CTA — Machined Button ══════════════════════════════ */}
        <div className={styles.lockRow}>
          <button
            type="button"
            className={styles.lockButton}
            onClick={handleContinue}
          >
            Save &amp; Continue to STRATFIT
          </button>
        </div>
      </main>

      {/* ── Static Terrain Preview — Top Right (SVG 2.5D, no WebGL) ── */}
      <aside className={styles.instrumentContainer}>
        <div className={styles.instrumentPanel}>
          <span className={styles.liveBaselineBadge}>LIVE BASELINE</span>

          {/* Recalculation shimmer — 150ms pulse on field update */}
          <div className={styles.shimmerBar} key={shimmerKey} />

          <div className={styles.instrumentScene}>
            <StaticTerrainPreview
              dataPoints={terrainPoints}
              height={210}
            />
          </div>
        </div>

        {/* ═══ Instrument Strip — RUNWAY · BURN MULTIPLE · INTEREST ═══ */}
        <div className={styles.instrumentStrip}>
          <div className={styles.instrumentItem}>
            <span className={styles.instrumentLabel}>RUNWAY</span>
            <span className={styles.instrumentValue}>{runway}</span>
          </div>
          <span className={styles.instrumentSep}>·</span>
          <div className={styles.instrumentItem}>
            <span className={styles.instrumentLabel}>BURN MULTIPLE</span>
            <span className={styles.instrumentValue}>{burnMultiple}</span>
          </div>
          <span className={styles.instrumentSep}>·</span>
          <div className={styles.instrumentItem}>
            <span className={styles.instrumentLabel}>INTEREST</span>
            <span className={styles.instrumentValue}>{interestBurden}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (file-private)
// ═══════════════════════════════════════════════════════════════════════════

/** Jewelled KPI cell — derived metric, read-only. */
function KPICell({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.kpiCell}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>{value}</span>
    </div>
  )
}

/** Text field for string values (Company module). */
function TextField({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string
  value: string
  placeholder?: string
  onCommit: (v: string) => void
}) {
  return (
    <div className={styles.metricRow}>
      <span className={styles.metricLabel}>{label}</span>
      <div className={styles.textInputWrap}>
        <input
          className={styles.textInput}
          type="text"
          value={value}
          placeholder={placeholder ?? "—"}
          onChange={(e) => onCommit(e.target.value)}
        />
      </div>
    </div>
  )
}

/**
 * Bloomberg-grade numeric field.
 * Label left, editable value right-aligned.
 * Focus: raw number editing. Blur: formatted + commit.
 */
function NumericField({
  label,
  value,
  prefix,
  suffix,
  onCommit,
}: {
  label: string
  value: number
  prefix?: string
  suffix?: string
  onCommit: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState("")

  const display = editing ? raw : value !== 0 ? value.toLocaleString() : ""

  return (
    <div className={styles.metricRow}>
      <span className={styles.metricLabel}>{label}</span>
      <div className={styles.inputWrap}>
        {prefix ? <span className={styles.inputAffix}>{prefix}</span> : null}
        <input
          className={styles.numInput}
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
        />
        {suffix ? <span className={styles.inputAffix}>{suffix}</span> : null}
      </div>
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

// 3D ScenarioMountain removed — replaced by StaticTerrainPreview (SVG 2.5D wire mesh, no WebGL)
