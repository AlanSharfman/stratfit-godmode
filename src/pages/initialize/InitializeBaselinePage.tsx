import React, { useCallback, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useBaselineStore } from "@/state/baselineStore"
import css from "./IngressConsole.module.css"

/* === Types === */

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

/* === Helpers === */

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

/* === Validation === */

type Errors = Partial<Record<keyof FormState, string>>

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.cashBalance || toNum(f.cashBalance) < 0) e.cashBalance = "Cash balance is required"
  if (!f.monthlyBurn || toNum(f.monthlyBurn) <= 0) e.monthlyBurn = "Monthly burn must be > 0"
  if (!f.revenueValue) e.revenueValue = "Revenue is required"
  if (f.grossMarginPct === "" || toNum(f.grossMarginPct) < 0 || toNum(f.grossMarginPct) > 100)
    e.grossMarginPct = "Gross margin must be 0-100%"
  if (f.growthRatePct === "") e.growthRatePct = "Growth rate is required"
  if (f.churnPct === "" || toNum(f.churnPct) < 0 || toNum(f.churnPct) > 100)
    e.churnPct = "Churn must be 0-100%"
  if (!f.headcount || toNum(f.headcount) <= 0) e.headcount = "Headcount must be > 0"
  return e
}

/* === Readiness === */

interface ReadinessField {
  key: string
  label: string
  check: (f: FormState) => boolean
  critical: boolean
}

const READINESS_FIELDS: ReadinessField[] = [
  { key: "cash",      label: "Cash Balance",  check: (f) => !!f.cashBalance && toNum(f.cashBalance) >= 0, critical: true },
  { key: "burn",      label: "Monthly Burn",  check: (f) => !!f.monthlyBurn && toNum(f.monthlyBurn) > 0,  critical: true },
  { key: "revenue",   label: "Revenue",       check: (f) => !!f.revenueValue && toNum(f.revenueValue) > 0, critical: true },
  { key: "margin",    label: "Gross Margin",  check: (f) => f.grossMarginPct !== "" && toNum(f.grossMarginPct) >= 0 && toNum(f.grossMarginPct) <= 100, critical: true },
  { key: "growth",    label: "Growth Rate",   check: (f) => f.growthRatePct !== "",                       critical: true },
  { key: "churn",     label: "Churn Rate",    check: (f) => f.churnPct !== "" && toNum(f.churnPct) >= 0,   critical: false },
  { key: "headcount", label: "Headcount",     check: (f) => !!f.headcount && toNum(f.headcount) > 0,      critical: false },
  { key: "company",   label: "Company Name",  check: (f) => f.companyName.trim().length > 0,               critical: false },
  { key: "industry",  label: "Industry",      check: (f) => f.industry.trim().length > 0,                  critical: false },
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

const READINESS_THRESHOLD = 56

/* === Example decisions === */

const EXAMPLE_DECISIONS = [
  { group: "Financial", items: [
    "Can we hire 3 engineers without cutting runway below 12 months?",
    "What happens if churn rises by 1% for two quarters?",
  ]},
  { group: "Strategic", items: [
    "Should we expand into a new segment this year?",
    "What if pricing increases by 8% with churn sensitivity?",
  ]},
  { group: "Operational", items: [
    "Can we reduce burn by 10% without breaking growth momentum?",
    "What if delivery capacity improves by 15%?",
  ]},
]

/* === Component === */

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

  const liveRunway = useMemo(() => {
    const cash = toNum(form.cashBalance)
    const burn = toNum(form.monthlyBurn)
    return burn > 0 ? Math.round(cash / burn) : null
  }, [form.cashBalance, form.monthlyBurn])

  const readinessColor = readiness.score >= 80 ? "#34d399"
    : readiness.score >= READINESS_THRESHOLD ? "#22d3ee"
    : "#f87171"

  return (
    <div className={css.page}>

      {/* ================================================================
          TOP NAV BAR
          ================================================================ */}
      <nav className={css.navBar}>
        <div className={css.navLeft}>
          <div className={css.navGlyph}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polygon points="8,2 14,13 2,13" stroke="rgba(34,211,238,0.7)" strokeWidth="1.5" fill="rgba(34,211,238,0.08)"/></svg>
          </div>
          <span className={css.navWordmark}>STRATFIT</span>
        </div>
        <div className={css.navBreadcrumb}>
          <span className={css.navBreadcrumbActive}>Initiate</span>
          <span className={css.navBreadcrumbSep}>/</span>
          <span className={css.navBreadcrumbMuted}>Scenario Ingress</span>
        </div>
        <div className={css.navRight}>
          <span className={css.navPill}>MVP &bull; Phase-1</span>
          <button type="button" className={css.navHelpBtn} title="Help">?</button>
        </div>
      </nav>

      {/* ================================================================
          PAGE HEADER
          ================================================================ */}
      <div className={css.headerArea}>
        <div className={css.headerRow}>
          <div>
            <h1 className={css.pageTitle}>Initiate Scenario</h1>
            <p className={css.pageSubtitle}>
              Upload or enter baseline data to generate probability-first decision signals.
            </p>
          </div>
        </div>
        <div className={css.tagStrip}>
          <span className={css.tag}>Financial</span>
          <span className={css.tag}>Strategic</span>
          <span className={css.tag}>Operational</span>
        </div>
        <div className={css.headerDivider} />
      </div>

      {/* ================================================================
          THREE-COLUMN CONSOLE GRID
          ================================================================ */}
      <div className={css.consoleGrid}>

        {/* ────────────────────────────────────────
            LEFT RAIL - Ingress Modes
            ──────────────────────────────────────── */}
        <div className={css.leftRail}>
          <div className={css.glassPanel}>
            <div className={css.glassPanelInner}>
              <div className={css.sectionTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h8" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Ingress Modes
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
                  <div className={css.ingressCardDesc}>Enter baseline financials directly.</div>
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
                  <div className={css.ingressCardDesc}>Download template, fill offline, upload.</div>
                </div>

                {/* Xero */}
                <div className={`${css.ingressCard} ${css.ingressCardDisabled}`}>
                  <div className={css.ingressCardHeader}>
                    <span className={css.ingressCardTitle}>
                      <span style={{ marginRight: 5, opacity: 0.4 }}>{"\uD83D\uDD12"}</span>
                      Xero Integration
                    </span>
                    <span className={`${css.ingressCardBadge} ${css.ingressCardBadgeDisabled}`}>Coming Soon</span>
                  </div>
                  <div className={css.ingressCardDesc}>Automated baseline pull from Xero.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────
            CENTER - Ingress Workspace
            ──────────────────────────────────────── */}
        <div>
          <div className={css.glassPanel}>
            <div className={css.glassPanelInner}>
              <div className={css.sectionTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" fill="none"/><path d="M5 6h6M5 9h4" stroke="rgba(34,211,238,0.6)" strokeWidth="1" strokeLinecap="round"/></svg>
                Ingress Workspace
              </div>

              {/* ── Manual Entry Mode ── */}
              {activePath === "manual" && (
                <div ref={formRef}>
                  {/* Company Snapshot */}
                  <div className={css.formSection}>
                    <div className={css.formSectionTitle}>Company Snapshot <span style={{ opacity: 0.4 }}>(optional)</span></div>
                    <div className={css.formGrid}>
                      {field("companyName", "Company Name", { placeholder: "e.g. Acme Inc." })}
                      <div className={css.formRow}>
                        {field("industry", "Industry", { placeholder: "e.g. SaaS, Fintech" })}
                        {field("stage", "Stage", { placeholder: "e.g. Seed, Series A" })}
                      </div>
                    </div>
                  </div>

                  {/* Financial Baseline */}
                  <div className={css.formSection}>
                    <div className={css.formSectionTitle}>Financial Baseline</div>
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

                  {/* Growth & Stability */}
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
                        background: liveRunway < 6 ? "rgba(248,113,113,0.08)" : liveRunway < 12 ? "rgba(251,191,36,0.08)" : "rgba(34,211,238,0.05)",
                        border: `1px solid ${liveRunway < 6 ? "rgba(248,113,113,0.2)" : liveRunway < 12 ? "rgba(251,191,36,0.15)" : "rgba(34,211,238,0.12)"}`
                      }}
                    >
                      <span style={{ opacity: 0.6 }}>Estimated Runway</span>
                      <span className={css.runwayValue} style={{ color: liveRunway < 6 ? "#f87171" : liveRunway < 12 ? "#fbbf24" : "#22d3ee" }}>
                        {liveRunway} months
                      </span>
                    </div>
                  )}

                  {/* Risk Environment */}
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

                  {/* Runway Confidence */}
                  <div className={css.formSection}>
                    <div className={css.formSectionTitle}>Runway Confidence <span style={{ opacity: 0.4 }}>(optional)</span></div>
                    <label className={css.formLabel}>
                      Confidence in runway estimate ({form.runwayConfidence}%)
                      <input
                        type="range" min="0" max="100"
                        value={form.runwayConfidence}
                        onChange={(e) => update("runwayConfidence", e.target.value)}
                        style={{ width: "100%", accentColor: "#22d3ee" }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, opacity: 0.35 }}>
                        <span>0% - Uncertain</span>
                        <span>100% - Very confident</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* ── Excel Template Mode ── */}
              {activePath === "excel" && (
                <div className={css.excelPanel}>
                  <div className={css.excelBtnRow}>
                    <button type="button" className={css.excelBtnOutline}>Download Template</button>
                    <button type="button" className={css.excelBtnSolid}>Upload File</button>
                  </div>
                  <div className={css.excelFormats}>Accepted formats: .xlsx, .csv</div>
                  <div className={css.excelUploadSlot}>
                    No file uploaded. Drag and drop or use the Upload button above.
                  </div>
                </div>
              )}

              {/* ── Xero Mode (locked) ── */}
              {activePath === "xero" && (
                <div className={css.xeroLocked}>
                  <div className={css.xeroLockedTitle}>Xero Integration Coming Soon</div>
                  <ul className={css.xeroBullets}>
                    <li className={css.xeroBullet}><span className={css.xeroBulletDot} /> Connect Xero for automated baseline pull</li>
                    <li className={css.xeroBullet}><span className={css.xeroBulletDot} /> Sync chart of accounts &amp; run rate metrics</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────
            RIGHT RAIL - Readiness + Guidance
            ──────────────────────────────────────── */}
        <div className={css.rightRail}>

          {/* Scenario Readiness */}
          <div className={`${css.glassPanel} ${css.readinessPanel}`}>
            <div className={css.glassPanelInner}>
              <div className={css.sectionTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" fill="none"/><path d="M8 5v3.5l2.5 1.5" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Scenario Readiness
              </div>
              <div className={css.readinessMeterBar}>
                <div className={css.readinessMeterFill} style={{ width: `${readiness.score}%`, background: readinessColor }} />
              </div>
              <div className={css.readinessScore}>
                <span className={css.readinessScoreValue} style={{ color: readinessColor }}>{readiness.score}%</span>
                <span className={css.readinessScoreLabel}>
                  {readiness.score >= 80 ? "Ready" : readiness.score >= READINESS_THRESHOLD ? "Minimum Met" : "Incomplete"}
                </span>
              </div>
              <ul className={css.readinessFieldList}>
                {READINESS_FIELDS.map((rf) => {
                  const isPresent = readiness.present.includes(rf.key)
                  return (
                    <li key={rf.key} className={css.readinessFieldItem}>
                      <span className={`${css.readinessFieldCheck} ${isPresent ? css.readinessFieldPresent : css.readinessFieldMissing}`}>
                        {isPresent ? "\u2713" : "\u2013"}
                      </span>
                      <span style={{ color: isPresent ? "rgba(255,255,255,0.65)" : undefined }}>
                        {rf.label}
                        {rf.critical && !isPresent && <span style={{ color: "#f87171", marginLeft: 4, fontSize: 9 }}>required</span>}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <div className={css.readinessHint}>
                {readiness.score < READINESS_THRESHOLD
                  ? "Fill the required fields to unlock the decision engine."
                  : "Baseline is sufficient. Additional fields improve simulation accuracy."
                }
              </div>
              <div className={css.readinessMinLine}>Minimum: {READINESS_THRESHOLD}% to proceed</div>
            </div>
          </div>

          {/* What happens next */}
          <div className={`${css.glassPanel} ${css.stepsCard}`}>
            <div className={css.glassPanelInner}>
              <div className={css.sectionTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 2v12M4 8h8l-3-3M4 8h8l-3 3" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                What Happens Next
              </div>
              <ol className={css.stepsList}>
                <li className={css.stepItem}><span className={css.stepNumber}>1</span> Define a strategic decision</li>
                <li className={css.stepItem}><span className={css.stepNumber}>2</span> Adjust scenario levers</li>
                <li className={css.stepItem}><span className={css.stepNumber}>3</span> Run the probability model</li>
                <li className={css.stepItem}><span className={css.stepNumber}>4</span> Read probability signals</li>
              </ol>
            </div>
          </div>

          {/* Example decisions */}
          <div className={`${css.glassPanel} ${css.examplesCard}`}>
            <div className={css.glassPanelInner}>
              <div className={css.sectionTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v10H3z" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" fill="none" rx="2"/><path d="M6 6h4M6 9h2" stroke="rgba(34,211,238,0.6)" strokeWidth="1" strokeLinecap="round"/></svg>
                Example Decisions
              </div>
              {EXAMPLE_DECISIONS.map((group) => (
                <div key={group.group} className={css.exampleGroup}>
                  <div className={css.exampleGroupLabel}>{group.group}</div>
                  {group.items.map((item) => (
                    <div key={item} className={css.exampleItem}>{item}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          FOOTER ACTION BAR
          ================================================================ */}
      <div className={css.footerBar}>
        <div className={css.footerInner}>
          <div className={css.footerLeft}>
            <span className={css.footerDraftDot} />
            Data saved locally
          </div>
          <div className={css.footerRight}>
            {showErrors && (
              <div className={css.footerErrorBanner}>Fix highlighted fields before proceeding.</div>
            )}
            {!canProceed && (
              <span className={css.btnDisabledHint}>Complete at least {READINESS_THRESHOLD}% readiness to proceed</span>
            )}
            <button
              type="button"
              className={css.btnPrimary}
              disabled={!canProceed}
              onClick={handleProceed}
            >
              Proceed to Decision &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
