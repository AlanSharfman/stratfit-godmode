import React, { useCallback, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useBaselineStore } from "@/state/baselineStore"
import css from "./IngressConsole.module.css"

/* ─── Types ──────────────────────────────────────────────── */

type RevenueMode = "ARR" | "MRR"
type MarketVolatility = "Low" | "Medium" | "High"
type FundingEnv = "Tight" | "Normal" | "Loose"
type IngressPath = "manual" | "excel" | "xero"

interface FormState {
  companyName: string
  industry: string
  stage: string
  cashBalance: string
  monthlyBurn: string
  revenueValue: string
  revenueMode: RevenueMode
  grossMarginPct: string
  growthRatePct: string
  churnPct: string
  headcount: string
  marketVolatility: MarketVolatility
  fundingEnvironment: FundingEnv
  runwayConfidence: string
}

const INITIAL: FormState = {
  companyName: "",
  industry: "",
  stage: "",
  cashBalance: "",
  monthlyBurn: "",
  revenueValue: "",
  revenueMode: "ARR",
  grossMarginPct: "",
  growthRatePct: "",
  churnPct: "",
  headcount: "",
  marketVolatility: "Medium",
  fundingEnvironment: "Normal",
  runwayConfidence: "60",
}

/* ─── Helpers ────────────────────────────────────────────── */

function toNum(v: string): number {
  const n = Number(v.replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

function pctToDecimal(v: string): number {
  return toNum(v) / 100
}

function volatilityToArpa(v: MarketVolatility): number {
  if (v === "Low") return 2500
  if (v === "High") return 800
  return 1500
}

/* ─── Validation ─────────────────────────────────────────── */

type Errors = Partial<Record<keyof FormState, string>>

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.cashBalance || toNum(f.cashBalance) < 0) e.cashBalance = "Cash balance is required"
  if (!f.monthlyBurn || toNum(f.monthlyBurn) <= 0) e.monthlyBurn = "Monthly burn must be > 0"
  if (!f.revenueValue) e.revenueValue = "Revenue is required"
  if (f.grossMarginPct === "" || toNum(f.grossMarginPct) < 0 || toNum(f.grossMarginPct) > 100)
    e.grossMarginPct = "Gross margin must be 0–100%"
  if (f.growthRatePct === "") e.growthRatePct = "Growth rate is required"
  if (f.churnPct === "" || toNum(f.churnPct) < 0 || toNum(f.churnPct) > 100)
    e.churnPct = "Churn must be 0–100%"
  if (!f.headcount || toNum(f.headcount) <= 0) e.headcount = "Headcount must be > 0"
  return e
}

/* ─── Readiness meter (deterministic, no store) ─────────── */

interface ReadinessField {
  key: string
  label: string
  check: (f: FormState) => boolean
  critical: boolean
}

const READINESS_FIELDS: ReadinessField[] = [
  { key: "cash",        label: "Cash Balance",    check: (f) => !!f.cashBalance && toNum(f.cashBalance) >= 0, critical: true },
  { key: "burn",        label: "Monthly Burn",    check: (f) => !!f.monthlyBurn && toNum(f.monthlyBurn) > 0,  critical: true },
  { key: "revenue",     label: "Revenue",         check: (f) => !!f.revenueValue && toNum(f.revenueValue) > 0, critical: true },
  { key: "margin",      label: "Gross Margin",    check: (f) => f.grossMarginPct !== "" && toNum(f.grossMarginPct) >= 0 && toNum(f.grossMarginPct) <= 100, critical: true },
  { key: "growth",      label: "Growth Rate",     check: (f) => f.growthRatePct !== "",                       critical: true },
  { key: "churn",       label: "Churn Rate",      check: (f) => f.churnPct !== "" && toNum(f.churnPct) >= 0,   critical: false },
  { key: "headcount",   label: "Headcount",       check: (f) => !!f.headcount && toNum(f.headcount) > 0,      critical: false },
  { key: "company",     label: "Company Name",    check: (f) => f.companyName.trim().length > 0,               critical: false },
  { key: "industry",    label: "Industry",        check: (f) => f.industry.trim().length > 0,                  critical: false },
]

function computeReadiness(f: FormState): { score: number; present: string[]; missing: string[] } {
  const present: string[] = []
  const missing: string[] = []
  for (const field of READINESS_FIELDS) {
    if (field.check(f)) present.push(field.key)
    else missing.push(field.key)
  }
  const score = Math.round((present.length / READINESS_FIELDS.length) * 100)
  return { score, present, missing }
}

const READINESS_THRESHOLD = 56 // 5 of 9 fields

/* ─── Component ──────────────────────────────────────────── */

export default function InitializeBaselinePage() {
  const navigate = useNavigate()
  const setBaseline = useBaselineStore((s) => s.setBaseline)
  const formRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<FormState>({ ...INITIAL })
  const [touched, setTouched] = useState(false)
  const [activePath, setActivePath] = useState<IngressPath>("manual")

  const errors = useMemo(() => validate(form), [form])
  const hasErrors = Object.keys(errors).length > 0
  const showErrors = touched && hasErrors

  const readiness = useMemo(() => computeReadiness(form), [form])
  const canProceed = readiness.score >= READINESS_THRESHOLD && !hasErrors

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleProceed = useCallback(() => {
    setTouched(true)
    if (Object.keys(validate(form)).length > 0) return

    const monthlyRevenue =
      form.revenueMode === "ARR" ? toNum(form.revenueValue) / 12 : toNum(form.revenueValue)

    setBaseline({
      cash: toNum(form.cashBalance),
      monthlyBurn: toNum(form.monthlyBurn),
      revenue: monthlyRevenue,
      grossMargin: pctToDecimal(form.grossMarginPct),
      growthRate: pctToDecimal(form.growthRatePct),
      churnRate: pctToDecimal(form.churnPct),
      headcount: Math.round(toNum(form.headcount)),
      arpa: volatilityToArpa(form.marketVolatility),
    })

    navigate("/decision", { replace: true })
  }, [form, navigate, setBaseline])

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const field = (
    key: keyof FormState,
    label: string,
    opts?: { placeholder?: string; type?: string; min?: string; max?: string },
  ) => (
    <label className={css.formLabel}>
      {label}
      <input
        className={`${css.formInput} ${showErrors && errors[key] ? css.formInputError : ""}`}
        type={opts?.type ?? "text"}
        inputMode={opts?.type === "number" ? "decimal" : undefined}
        placeholder={opts?.placeholder}
        min={opts?.min}
        max={opts?.max}
        value={form[key]}
        onChange={(e) => update(key, e.target.value as never)}
      />
      {showErrors && errors[key] && <span className={css.fieldError}>{errors[key]}</span>}
    </label>
  )

  /* Live runway preview */
  const liveRunway = useMemo(() => {
    const cash = toNum(form.cashBalance)
    const burn = toNum(form.monthlyBurn)
    return burn > 0 ? Math.round(cash / burn) : null
  }, [form.cashBalance, form.monthlyBurn])

  /* Readiness meter color */
  const readinessColor = readiness.score >= 80 ? "#34d399"
    : readiness.score >= READINESS_THRESHOLD ? "#22d3ee"
    : "#f87171"

  return (
    <div className={css.page}>
      {/* ══ TOP BAR ══ */}
      <div className={css.topBar}>
        <nav className={css.breadcrumb}>
          <span className={css.breadcrumbActive}>INITIATE</span>
          <span style={{ margin: "0 6px" }}>/</span>
          <span>SCENARIO INGRESS</span>
        </nav>
        <h1 className={css.pageTitle}>Initiate Scenario</h1>
        <p className={css.pageSubtitle}>
          Upload or enter baseline data to generate probability-first decision signals.
          STRATFIT simulates 24-month outcomes across multiple scenarios.
        </p>
      </div>

      {/* ══ TWO-COLUMN CONSOLE ══ */}
      <div className={css.consoleGrid}>
        {/* ── LEFT: Ingress Paths + Form ── */}
        <div>
          <div className={`${css.glassPanel}`}>
            <div className={css.glassPanelInner}>
              <div className={css.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h8" stroke="rgba(34,211,238,0.7)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Ingress Paths
              </div>
              <div className={css.ingressCards}>
                {/* Manual Entry */}
                <div
                  className={`${css.ingressCard} ${activePath === "manual" ? css.ingressCardActive : ""}`}
                  onClick={() => { setActivePath("manual"); scrollToForm() }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={css.ingressCardHeader}>
                    <span className={css.ingressCardTitle}>Manual Entry</span>
                    <span className={css.ingressCardBadge}>Active</span>
                  </div>
                  <div className={css.ingressCardDesc}>
                    Enter baseline financials directly. Fastest path for teams with data at hand.
                  </div>
                </div>

                {/* Excel Template */}
                <div
                  className={`${css.ingressCard} ${activePath === "excel" ? css.ingressCardActive : ""}`}
                  onClick={() => setActivePath("excel")}
                  role="button"
                  tabIndex={0}
                >
                  <div className={css.ingressCardHeader}>
                    <span className={css.ingressCardTitle}>Excel Template</span>
                    <span className={css.ingressCardBadge}>Available</span>
                  </div>
                  <div className={css.ingressCardDesc}>
                    Download our structured template, fill it offline, and upload the completed file.
                  </div>
                  {activePath === "excel" && (
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <button type="button" style={{
                        padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(34,211,238,0.3)",
                        background: "rgba(34,211,238,0.08)", color: "#22d3ee", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                        Download Template (stub)
                      </button>
                      <button type="button" style={{
                        padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12,
                        fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                      }}>
                        Upload File (stub)
                      </button>
                    </div>
                  )}
                </div>

                {/* Xero — Coming Soon */}
                <div className={`${css.ingressCard} ${css.ingressCardDisabled}`}>
                  <div className={css.ingressCardHeader}>
                    <span className={css.ingressCardTitle}>
                      <span style={{ marginRight: 6, opacity: 0.5 }}>🔒</span>
                      Xero Integration
                    </span>
                    <span className={`${css.ingressCardBadge} ${css.ingressCardBadgeDisabled}`}>Coming Soon</span>
                  </div>
                  <div className={css.ingressCardDesc}>
                    Connect Xero for automated baseline pull. Zero manual entry required.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Manual Entry Form ── */}
          {activePath === "manual" && (
            <div ref={formRef} style={{ marginTop: 20 }}>
              {/* Section 1 — Snapshot (optional) */}
              <div className={css.formSection}>
                <div className={css.formSectionTitle}>Company Snapshot <span style={{ opacity: 0.5 }}>(optional)</span></div>
                <div className={css.formGrid}>
                  {field("companyName", "Company Name", { placeholder: "e.g. Acme Inc." })}
                  <div className={css.formRow}>
                    {field("industry", "Industry", { placeholder: "e.g. SaaS, Fintech" })}
                    {field("stage", "Stage", { placeholder: "e.g. Seed, Series A" })}
                  </div>
                </div>
              </div>

              {/* Section 2 — Financial Position */}
              <div className={css.formSection}>
                <div className={css.formSectionTitle}>Financial Position</div>
                <div className={css.formGrid}>
                  {field("cashBalance", "Cash Balance ($)", { placeholder: "e.g. 500000", type: "number", min: "0" })}
                  {field("monthlyBurn", "Monthly Burn ($)", { placeholder: "e.g. 25000", type: "number", min: "0" })}
                  <div className={css.formRow}>
                    <label className={css.formLabel}>
                      Revenue ({form.revenueMode})
                      <input
                        className={`${css.formInput} ${showErrors && errors.revenueValue ? css.formInputError : ""}`}
                        type="number"
                        placeholder={form.revenueMode === "ARR" ? "e.g. 240000" : "e.g. 20000"}
                        value={form.revenueValue}
                        onChange={(e) => update("revenueValue", e.target.value)}
                      />
                      {showErrors && errors.revenueValue && <span className={css.fieldError}>{errors.revenueValue}</span>}
                    </label>
                    <label className={css.formLabel}>
                      Revenue Type
                      <select className={css.formSelect} value={form.revenueMode} onChange={(e) => update("revenueMode", e.target.value as RevenueMode)}>
                        <option value="ARR">ARR (Annual)</option>
                        <option value="MRR">MRR (Monthly)</option>
                      </select>
                    </label>
                  </div>
                  {field("grossMarginPct", "Gross Margin (%)", { placeholder: "e.g. 70", type: "number", min: "0", max: "100" })}
                </div>
              </div>

              {/* Section 3 — Growth & Stability */}
              <div className={css.formSection}>
                <div className={css.formSectionTitle}>Growth &amp; Stability</div>
                <div className={css.formGrid}>
                  <div className={css.formRow}>
                    {field("growthRatePct", "Monthly Growth (%)", { placeholder: "e.g. 5", type: "number" })}
                    {field("churnPct", "Monthly Churn (%)", { placeholder: "e.g. 3", type: "number", min: "0", max: "100" })}
                  </div>
                  {field("headcount", "Headcount", { placeholder: "e.g. 12", type: "number", min: "1" })}
                </div>
              </div>

              {/* Live Runway Preview */}
              {liveRunway !== null && (
                <div
                  className={css.runwayPreview}
                  style={{
                    background: liveRunway < 6 ? "rgba(248,113,113,0.08)" : liveRunway < 12 ? "rgba(251,191,36,0.08)" : "rgba(34,211,238,0.06)",
                    border: `1px solid ${liveRunway < 6 ? "rgba(248,113,113,0.25)" : liveRunway < 12 ? "rgba(251,191,36,0.2)" : "rgba(34,211,238,0.15)"}`,
                  }}
                >
                  <span style={{ opacity: 0.7 }}>Estimated Runway</span>
                  <span className={css.runwayValue} style={{ color: liveRunway < 6 ? "#f87171" : liveRunway < 12 ? "#fbbf24" : "#22d3ee" }}>
                    {liveRunway} months
                  </span>
                </div>
              )}

              {/* Section 4 — Risk Environment */}
              <div className={css.formSection}>
                <div className={css.formSectionTitle}>Risk Environment</div>
                <div className={css.formRow}>
                  <label className={css.formLabel}>
                    Market Volatility
                    <select className={css.formSelect} value={form.marketVolatility} onChange={(e) => update("marketVolatility", e.target.value as MarketVolatility)}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </label>
                  <label className={css.formLabel}>
                    Funding Environment
                    <select className={css.formSelect} value={form.fundingEnvironment} onChange={(e) => update("fundingEnvironment", e.target.value as FundingEnv)}>
                      <option value="Tight">Tight</option>
                      <option value="Normal">Normal</option>
                      <option value="Loose">Loose</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Section 5 — Runway Confidence (optional) */}
              <div className={css.formSection}>
                <div className={css.formSectionTitle}>Runway Confidence <span style={{ opacity: 0.5 }}>(optional)</span></div>
                <label className={css.formLabel}>
                  Confidence in runway estimate ({form.runwayConfidence}%)
                  <input
                    type="range" min="0" max="100"
                    value={form.runwayConfidence}
                    onChange={(e) => update("runwayConfidence", e.target.value)}
                    style={{ width: "100%", accentColor: "#22d3ee" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.4 }}>
                    <span>0% — Uncertain</span>
                    <span>100% — Very confident</span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Readiness Panel ── */}
        <div className={`${css.glassPanel} ${css.readinessPanel}`}>
          <div className={css.glassPanelInner}>
            <div className={css.sectionTitle}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="rgba(34,211,238,0.7)" strokeWidth="1.5" fill="none"/><path d="M8 5v3.5l2.5 1.5" stroke="rgba(34,211,238,0.7)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Baseline Readiness
            </div>

            {/* Meter bar */}
            <div className={css.readinessMeterBar}>
              <div
                className={css.readinessMeterFill}
                style={{
                  width: `${readiness.score}%`,
                  background: readinessColor,
                }}
              />
            </div>
            <div className={css.readinessScore}>
              <span className={css.readinessScoreValue} style={{ color: readinessColor }}>
                {readiness.score}%
              </span>
              <span className={css.readinessScoreLabel}>
                {readiness.score >= 80 ? "Ready" : readiness.score >= READINESS_THRESHOLD ? "Minimum Met" : "Incomplete"}
              </span>
            </div>

            {/* Field checklist */}
            <ul className={css.readinessFieldList}>
              {READINESS_FIELDS.map((rf) => {
                const isPresent = readiness.present.includes(rf.key)
                return (
                  <li key={rf.key} className={css.readinessFieldItem}>
                    <span className={`${css.readinessFieldCheck} ${isPresent ? css.readinessFieldPresent : css.readinessFieldMissing}`}>
                      {isPresent ? "✓" : "–"}
                    </span>
                    <span style={{ color: isPresent ? "rgba(255,255,255,0.7)" : undefined }}>
                      {rf.label}
                      {rf.critical && !isPresent && <span style={{ color: "#f87171", marginLeft: 4, fontSize: 10 }}>required</span>}
                    </span>
                  </li>
                )
              })}
            </ul>

            {/* Hint */}
            <div className={css.readinessHint}>
              {readiness.score < READINESS_THRESHOLD
                ? "Fill the required fields to unlock the decision engine."
                : "Baseline is sufficient. Additional fields improve simulation accuracy."
              }
            </div>
          </div>
        </div>
      </div>

      {/* ══ FOOTER ACTION BAR ══ */}
      <div className={css.footerBar}>
        {showErrors && (
          <div className={css.footerErrorBanner}>
            Please fix the highlighted fields before proceeding.
          </div>
        )}
        <button
          type="button"
          className={css.btnPrimary}
          disabled={!canProceed}
          onClick={handleProceed}
        >
          Proceed to Decision →
        </button>
        {!canProceed && (
          <div className={css.btnDisabledHint}>
            Complete at least {READINESS_THRESHOLD}% baseline readiness to proceed
          </div>
        )}
      </div>
    </div>
  )
}
