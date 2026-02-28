import React, { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useBaselineStore } from "@/state/baselineStore"

/* ─── Types ──────────────────────────────────────────────── */

type RevenueMode = "ARR" | "MRR"
type MarketVolatility = "Low" | "Medium" | "High"
type FundingEnv = "Tight" | "Normal" | "Loose"

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

/* ─── Inline Styles ──────────────────────────────────────── */

const PAGE: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0a0e17 0%, #101829 100%)",
  color: "#e2e8f0",
  fontFamily: "'Inter', system-ui, sans-serif",
}

const CARD: React.CSSProperties = { maxWidth: 720, margin: "0 auto", padding: "32px 28px 40px" }

const SECTION: React.CSSProperties = {
  marginBottom: 28,
  padding: "20px 22px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.12em", color: "rgba(34,211,238,0.85)", marginBottom: 14,
}

const LABEL: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)",
}

const INPUT: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 14, outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
}

const SELECT: React.CSSProperties = { ...INPUT, cursor: "pointer" }
const ERR_STYLE: React.CSSProperties = { fontSize: 11, color: "#f87171", marginTop: 2 }
const ROW: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }

const BTN_PRIMARY: React.CSSProperties = {
  padding: "14px 28px", borderRadius: 10, border: "none",
  background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
  color: "#000", fontWeight: 700, fontSize: 15, cursor: "pointer",
  letterSpacing: "0.04em", transition: "opacity 0.15s",
}

/* ─── Component ──────────────────────────────────────────── */

export default function InitializeBaselinePage() {
  const navigate = useNavigate()
  const setBaseline = useBaselineStore((s) => s.setBaseline)

  const [form, setForm] = useState<FormState>({ ...INITIAL })
  const [touched, setTouched] = useState(false)

  const errors = useMemo(() => validate(form), [form])
  const hasErrors = Object.keys(errors).length > 0
  const showErrors = touched && hasErrors

  const sectionsDone = useMemo(() => {
    let done = 0
    if (!errors.cashBalance && !errors.monthlyBurn && !errors.revenueValue && !errors.grossMarginPct) done++
    if (!errors.growthRatePct && !errors.churnPct && !errors.headcount) done++
    done += 3 // Risk + Snapshot + Confidence always valid
    return done
  }, [errors])

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleSave = useCallback(() => {
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

  const field = (
    key: keyof FormState,
    label: string,
    opts?: { placeholder?: string; type?: string; min?: string; max?: string },
  ) => (
    <label style={LABEL}>
      {label}
      <input
        style={{ ...INPUT, borderColor: showErrors && errors[key] ? "#f87171" : undefined }}
        type={opts?.type ?? "text"}
        inputMode={opts?.type === "number" ? "decimal" : undefined}
        placeholder={opts?.placeholder}
        min={opts?.min}
        max={opts?.max}
        value={form[key]}
        onChange={(e) => update(key, e.target.value as never)}
      />
      {showErrors && errors[key] && <span style={ERR_STYLE}>{errors[key]}</span>}
    </label>
  )

  /* Derived live preview */
  const liveRunway = useMemo(() => {
    const cash = toNum(form.cashBalance)
    const burn = toNum(form.monthlyBurn)
    return burn > 0 ? Math.round(cash / burn) : null
  }, [form.cashBalance, form.monthlyBurn])

  return (
    <div style={PAGE}>
      <div style={CARD}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: 16, fontSize: 11, opacity: 0.4, letterSpacing: "0.06em" }}>
          <span style={{ color: "#22d3ee" }}>INITIATE</span>
          <span style={{ margin: "0 6px" }}>/</span>
          <span>BASELINE SETUP</span>
        </nav>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" }}>
            Initiate Baseline
          </h1>
          <p style={{ margin: "6px 0 0", opacity: 0.6, fontSize: 14 }}>
            Enter your company&apos;s current position. We&apos;ll simulate 24 months from here.
          </p>
          <div style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: 36, height: 4, borderRadius: 2,
                  background: i <= sectionsDone ? "#22d3ee" : "rgba(255,255,255,0.12)",
                  transition: "background 0.2s",
                }}
              />
            ))}
            <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.5 }}>{sectionsDone}/5</span>
          </div>
        </div>

        {/* Section 1 — Snapshot (optional) */}
        <div style={SECTION}>
          <div style={SECTION_TITLE}>1 — Company Snapshot <span style={{ opacity: 0.5 }}>(optional)</span></div>
          <div style={{ display: "grid", gap: 12 }}>
            {field("companyName", "Company Name", { placeholder: "e.g. Acme Inc." })}
            <div style={ROW}>
              {field("industry", "Industry", { placeholder: "e.g. SaaS, Fintech" })}
              {field("stage", "Stage", { placeholder: "e.g. Seed, Series A" })}
            </div>
          </div>
        </div>

        {/* Section 2 — Financial Position */}
        <div style={SECTION}>
          <div style={SECTION_TITLE}>2 — Financial Position</div>
          <div style={{ display: "grid", gap: 12 }}>
            {field("cashBalance", "Cash Balance ($)", { placeholder: "e.g. 500000", type: "number", min: "0" })}
            {field("monthlyBurn", "Monthly Burn ($)", { placeholder: "e.g. 25000", type: "number", min: "0" })}
            <div style={ROW}>
              <label style={LABEL}>
                Revenue ({form.revenueMode})
                <input
                  style={{ ...INPUT, borderColor: showErrors && errors.revenueValue ? "#f87171" : undefined }}
                  type="number"
                  placeholder={form.revenueMode === "ARR" ? "e.g. 240000" : "e.g. 20000"}
                  value={form.revenueValue}
                  onChange={(e) => update("revenueValue", e.target.value)}
                />
                {showErrors && errors.revenueValue && <span style={ERR_STYLE}>{errors.revenueValue}</span>}
              </label>
              <label style={LABEL}>
                Revenue Type
                <select style={SELECT} value={form.revenueMode} onChange={(e) => update("revenueMode", e.target.value as RevenueMode)}>
                  <option value="ARR">ARR (Annual)</option>
                  <option value="MRR">MRR (Monthly)</option>
                </select>
              </label>
            </div>
            {field("grossMarginPct", "Gross Margin (%)", { placeholder: "e.g. 70", type: "number", min: "0", max: "100" })}
          </div>
        </div>

        {/* Section 3 — Growth & Stability */}
        <div style={SECTION}>
          <div style={SECTION_TITLE}>3 — Growth & Stability</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={ROW}>
              {field("growthRatePct", "Monthly Growth (%)", { placeholder: "e.g. 5", type: "number" })}
              {field("churnPct", "Monthly Churn (%)", { placeholder: "e.g. 3", type: "number", min: "0", max: "100" })}
            </div>
            {field("headcount", "Headcount", { placeholder: "e.g. 12", type: "number", min: "1" })}
          </div>
        </div>

        {/* Live Runway Preview */}
        {liveRunway !== null && (
          <div style={{
            marginBottom: 20, padding: "12px 16px", borderRadius: 10,
            background: liveRunway < 6 ? "rgba(248,113,113,0.08)" : liveRunway < 12 ? "rgba(251,191,36,0.08)" : "rgba(34,211,238,0.06)",
            border: `1px solid ${liveRunway < 6 ? "rgba(248,113,113,0.25)" : liveRunway < 12 ? "rgba(251,191,36,0.2)" : "rgba(34,211,238,0.15)"}`,
            display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13,
          }}>
            <span style={{ opacity: 0.7 }}>Estimated Runway</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: liveRunway < 6 ? "#f87171" : liveRunway < 12 ? "#fbbf24" : "#22d3ee" }}>
              {liveRunway} months
            </span>
          </div>
        )}

        {/* Section 4 — Risk Environment */}
        <div style={SECTION}>
          <div style={SECTION_TITLE}>4 — Risk Environment</div>
          <div style={ROW}>
            <label style={LABEL}>
              Market Volatility
              <select style={SELECT} value={form.marketVolatility} onChange={(e) => update("marketVolatility", e.target.value as MarketVolatility)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>
            <label style={LABEL}>
              Funding Environment
              <select style={SELECT} value={form.fundingEnvironment} onChange={(e) => update("fundingEnvironment", e.target.value as FundingEnv)}>
                <option value="Tight">Tight</option>
                <option value="Normal">Normal</option>
                <option value="Loose">Loose</option>
              </select>
            </label>
          </div>
        </div>

        {/* Section 5 — Runway Confidence (optional) */}
        <div style={SECTION}>
          <div style={SECTION_TITLE}>5 — Runway Confidence <span style={{ opacity: 0.5 }}>(optional)</span></div>
          <label style={LABEL}>
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

        {/* Save Footer */}
        <div style={{ position: "sticky", bottom: 0, paddingTop: 16, paddingBottom: 8, background: "linear-gradient(0deg, #0a0e17 60%, transparent)" }}>
          {showErrors && (
            <div style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", fontSize: 13, color: "#f87171" }}>
              Please fix the highlighted fields before saving.
            </div>
          )}
          <button
            type="button"
            style={{ ...BTN_PRIMARY, width: "100%", opacity: showErrors ? 0.5 : 1 }}
            onClick={handleSave}
          >
            Save Baseline & Continue →
          </button>
        </div>
      </div>
    </div>
  )
}
