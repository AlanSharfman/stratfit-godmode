import React, { useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useBaselineStore } from "@/state/baselineStore"
import PortalNav from "@/components/nav/PortalNav"
import css from "./IngressConsole.module.css"

/* ═══════════════════════════════════════════════════════════════════
   STRATFIT — Initiate Intelligence Console (God Mode)

   Prompt-first onboarding. 3 input paths (Manual / Xero / Excel).
   Single-scroll collapsible glass panels. Live intelligence rail.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Types ── */

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

/* ── Defaults ── */

const INITIAL: FormState = {
  contactName: "",
  contactEmail: "",
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

const STAGES = [
  "Ideation", "Startup", "Early Growth", "Growth", "High Growth", "Scale", "Exit Ready",
]
const INDUSTRIES = [
  "SaaS", "Fintech", "HealthTech", "EdTech", "E-Commerce",
  "AI / ML", "DevTools", "Marketplace", "Hardware", "Other",
]

/* ── Helpers ── */

function fmtCurrency(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  return `$${Math.round(Math.abs(v)).toLocaleString()}`
}

function sliderFill(value: number, min: number, max: number): React.CSSProperties {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  return {
    background: `linear-gradient(90deg, #065f73 0%, #0e7490 ${pct * 0.3}%, #22d3ee ${pct * 0.7}%, #67e8f9 ${pct}%, rgba(255,255,255,0.035) ${pct}%, rgba(255,255,255,0.035) 100%)`,
    boxShadow: pct > 3
      ? `0 0 ${4 + pct * 0.08}px rgba(34,211,238,${0.14 + pct * 0.003})`
      : "none",
  }
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

  const monthlyChurnDecimal = f.monthlyChurnPct / 100
  const ltv = monthlyChurnDecimal > 0
    ? (f.avgDealSize * (f.grossMarginPct / 100)) / monthlyChurnDecimal
    : 0
  const ltvCacRatio = f.cac > 0 ? ltv / f.cac : 0
  const cacPaybackMonths = f.avgDealSize > 0 && f.grossMarginPct > 0
    ? f.cac / ((f.avgDealSize / 12) * (f.grossMarginPct / 100))
    : 0
  const totalCost =
    f.headcount * f.avgFullyLoadedCost + f.salesMarketingSpend + f.rdSpend + f.gaSpend
  const operatingProfit = f.currentARR - totalCost
  const revenuePerHead = f.headcount > 0 ? Math.round(f.currentARR / f.headcount) : 0

  return {
    runway: Number.isFinite(runway) ? runway : 0,
    burnMultiple: Number.isFinite(burnMultiple) ? burnMultiple : 0,
    monthlyBurn: f.monthlyNetBurn,
    survivalProbability: prob,
    grossMarginPct: f.grossMarginPct,
    ltvCacRatio,
    cacPaybackMonths,
    operatingProfit,
    revenuePerHead,
  }
}

function completionPct(f: FormState): number {
  let filled = 0
  let total = 0
  const check = (v: unknown, empty: unknown = "") => {
    total++
    if (v !== empty && v !== 0 && v !== "") filled++
  }
  check(f.contactName); check(f.contactEmail); check(f.companyName)
  check(f.industry); check(f.stage)
  check(f.cashOnHand, 0); check(f.monthlyNetBurn, 0); check(f.currentARR, 0)
  check(f.monthlyGrowthPct, 0); check(f.grossMarginPct, 0); check(f.avgDealSize, 0)
  check(f.monthlyChurnPct, 0); check(f.headcount, 0); check(f.cac, 0)
  return total > 0 ? Math.round((filled / total) * 100) : 0
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
  const headers = CSV_FIELD_MAP.map((f) => f.label).join(",")
  const examples = CSV_FIELD_MAP.map((f) => f.example).join(",")
  return `${headers}\n${examples}`
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function parseCSVToForm(text: string): Partial<FormState> | null {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return null
  const headers = lines[0].split(",").map((h) => h.trim())
  const values = lines[1].split(",").map((v) => v.trim())

  const result: Record<string, unknown> = {}
  for (const field of CSV_FIELD_MAP) {
    const idx = headers.findIndex(
      (h) => h.toLowerCase() === field.label.toLowerCase(),
    )
    if (idx === -1 || !values[idx]) continue
    const raw = values[idx]
    const numericKeys: Array<keyof FormState> = [
      "cashOnHand", "monthlyNetBurn", "debtOutstanding", "debtInterestRate",
      "fundraisingWindow", "currentARR", "monthlyGrowthPct", "grossMarginPct",
      "avgDealSize", "monthlyChurnPct", "salesEfficiency", "netRevenueRetentionPct",
      "headcount", "avgFullyLoadedCost", "salesMarketingSpend", "rdSpend",
      "gaSpend", "cogsPct", "cac", "salesRampTime", "engineeringVelocity",
      "targetGrowthBand", "priorityBalance",
    ]
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
   INLINE SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function SliderRow({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <div className={css.sliderRow}>
      <span className={css.sliderLabel}>{label}</span>
      <div className={css.sliderTrack}>
        <input
          type="range"
          className={css.sliderInput}
          min={min} max={max} step={step} value={value}
          style={sliderFill(value, min, max)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <span className={css.sliderValue}>{format(value)}</span>
    </div>
  )
}

function InputRow({ label, value, prefix, suffix, onChange }: {
  label: string; value: number | string; prefix?: string; suffix?: string
  onChange: (v: string) => void
}) {
  const display = typeof value === "number" ? value.toLocaleString() : value
  return (
    <div className={css.formRow}>
      <span className={css.formLabel}>{label}</span>
      <div className={css.formField}>
        <div className={css.inputWrap}>
          {prefix && <span className={css.inputPrefix}>{prefix}</span>}
          <input
            className={css.inputInner}
            type="text"
            inputMode="numeric"
            value={display}
            onChange={(e) => onChange(e.target.value.replace(/,/g, ""))}
          />
          {suffix && <span className={css.inputSuffix}>{suffix}</span>}
        </div>
      </div>
    </div>
  )
}

function ToggleGroup<T extends string>({ options, value, onChange }: {
  options: T[]; value: T; onChange: (v: T) => void
}) {
  return (
    <div className={css.toggleGroup}>
      {options.map((opt) => (
        <button
          key={opt} type="button"
          className={`${css.toggleOption} ${value === opt ? css.toggleOptionActive : ""}`}
          onClick={() => onChange(opt)}
        >{opt}</button>
      ))}
    </div>
  )
}

function PillSelect({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className={css.pillGroup}>
      {options.map((opt) => (
        <button
          key={opt} type="button"
          className={`${css.pillOption} ${value === opt ? css.pillOptionActive : ""}`}
          onClick={() => onChange(opt)}
        >{opt}</button>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION WRAPPER (collapsible)
   ═══════════════════════════════════════════════════════════════════ */

function Section({ id, title, isOpen, onToggle, completed, children }: {
  id: string; title: string; isOpen: boolean; completed?: boolean
  onToggle: (id: string) => void; children: React.ReactNode
}) {
  return (
    <div className={`${css.sectionPanel} ${completed ? css.sectionCompleted : ""}`}>
      <button
        type="button"
        className={css.sectionHeader}
        onClick={() => onToggle(id)}
      >
        <span className={css.sectionTitle}>
          {completed ? "\u2713 " : ""}{title}
        </span>
        <span className={`${css.sectionChevron} ${isOpen ? css.sectionChevronOpen : ""}`}>
          &#9660;
        </span>
      </button>
      {isOpen && <div className={css.sectionBody}>{children}</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function InitializeBaselinePage() {
  const navigate = useNavigate()
  const setBaseline = useBaselineStore((s) => s.setBaseline)

  const [form, setForm] = useState<FormState>({ ...INITIAL })
  const [inputPath, setInputPath] = useState<InputPath>("manual")
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true, liquidity: true, revenue: false,
    cost: false, operations: false, strategy: false,
  })
  const [showXeroModal, setShowXeroModal] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    }, [],
  )

  const metrics = useMemo(() => computeMetrics(form), [form])
  const completion = useMemo(() => completionPct(form), [form])

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // ── Toast auto-dismiss ──
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ── Lock baseline ──
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
      stage: form.stage || undefined,
    })
    navigate("/decision", { replace: true })
  }, [form, setBaseline, navigate])

  // ── Excel download ──
  const handleDownloadTemplate = useCallback(() => {
    downloadCSV("stratfit-baseline-template.csv", generateCSVTemplate())
    setToast("Template downloaded — fill in your data and upload it back.")
  }, [])

  // ── Excel upload ──
  const handleFileUpload = useCallback((file: File) => {
    setUploadMsg(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== "string") {
        setUploadMsg({ type: "error", text: "Could not read file." })
        return
      }
      const parsed = parseCSVToForm(text)
      if (!parsed || Object.keys(parsed).length === 0) {
        setUploadMsg({ type: "error", text: "No matching columns found. Use the template format." })
        return
      }
      setForm((prev) => ({ ...prev, ...parsed }))
      setOpenSections({ identity: true, liquidity: true, revenue: true, cost: true, operations: true, strategy: true })
      setUploadMsg({ type: "success", text: `Imported ${Object.keys(parsed).length} fields. Review and adjust below.` })
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
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  // ── Path card click ──
  const handlePathClick = useCallback((path: InputPath) => {
    setInputPath(path)
    if (path === "xero") setShowXeroModal(true)
  }, [])

  // ── Sections completion checks ──
  const identityDone = !!(form.contactName && form.contactEmail && form.companyName && form.industry && form.stage)
  const liquidityDone = form.cashOnHand > 0 && form.monthlyNetBurn > 0
  const revenueDone = form.currentARR > 0 && form.grossMarginPct > 0
  const canLock = form.companyName.trim().length > 0 && form.cashOnHand > 0

  return (
    <div className={css.page}>
      <PortalNav />

      {/* ═══ HERO ═══ */}
      <div className={css.hero}>
        <div className={css.heroLabel}>Initiate Intelligence Console</div>
        <h1 className={css.heroTitle}>Initialize Your Strategic Baseline</h1>
        <p className={css.heroSubtitle}>
          Establish your company's financial truth to anchor all scenario modelling,
          risk analysis, and strategic projections. Choose how to input your data.
        </p>

        {/* ── Input Path Cards ── */}
        <div className={css.pathCards}>
          <button
            type="button"
            className={`${css.pathCard} ${inputPath === "manual" ? css.pathCardActive : ""}`}
            onClick={() => handlePathClick("manual")}
          >
            <span className={css.pathIcon}>&#9998;</span>
            <span className={css.pathTitle}>Manual Entry</span>
            <span className={css.pathDesc}>Fill in your financials using sliders and inputs</span>
          </button>

          <button
            type="button"
            className={`${css.pathCard} ${inputPath === "xero" ? css.pathCardActive : ""}`}
            onClick={() => handlePathClick("xero")}
          >
            <span className={css.pathBadge}>Coming Soon</span>
            <span className={css.pathIcon}>&#9741;</span>
            <span className={css.pathTitle}>Connect Xero</span>
            <span className={css.pathDesc}>Auto-import from your accounting platform</span>
          </button>

          <button
            type="button"
            className={`${css.pathCard} ${inputPath === "excel" ? css.pathCardActive : ""}`}
            onClick={() => handlePathClick("excel")}
          >
            <span className={css.pathIcon}>&#9783;</span>
            <span className={css.pathTitle}>Import Excel</span>
            <span className={css.pathDesc}>Download our template, fill it in, upload it back</span>
          </button>
        </div>
      </div>

      {/* ═══ EXCEL UPLOAD ZONE ═══ */}
      {inputPath === "excel" && (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 40px" }}>
          <div className={css.uploadZone}>
            <div className={css.uploadActions}>
              <button type="button" className={css.btnDownload} onClick={handleDownloadTemplate}>
                &#8681; Download Template
              </button>
              <button type="button" className={css.btnUpload} onClick={() => fileInputRef.current?.click()}>
                &#8682; Upload Completed File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
                onChange={onFileChange}
              />
            </div>
            <div
              className={`${css.dropZone} ${dragOver ? css.dropZoneActive : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className={css.dropText}>
                {dragOver ? "Drop your file here" : "Or drag and drop your CSV file here"}
              </span>
            </div>
            {uploadMsg && (
              <div className={uploadMsg.type === "success" ? css.uploadSuccess : css.uploadError}>
                {uploadMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CONTENT ZONE ═══ */}
      <div className={css.contentZone}>
        {/* ── Left: Input Panels ── */}
        <div className={css.inputPanels}>

          {/* ── 1. Identity & Contact ── */}
          <Section id="identity" title="Identity & Contact" isOpen={!!openSections.identity}
            onToggle={toggleSection} completed={identityDone}>
            <div className={css.formRow}>
              <span className={css.formLabel}>Your Name</span>
              <div className={css.formField}>
                <input className={css.textInput} type="text" placeholder="Jane Doe"
                  value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
              </div>
            </div>
            <div className={css.formRow}>
              <span className={css.formLabel}>Email Address</span>
              <div className={css.formField}>
                <input className={css.textInput} type="email" placeholder="jane@acme.com"
                  value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
              </div>
            </div>
            <div className={css.formRow}>
              <span className={css.formLabel}>Company Name</span>
              <div className={css.formField}>
                <input className={css.textInput} type="text" placeholder="Acme Inc."
                  value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
              </div>
            </div>
            <div className={css.formRow}>
              <span className={css.formLabel}>Industry</span>
              <div className={css.formField}>
                <PillSelect options={INDUSTRIES} value={form.industry}
                  onChange={(v) => update("industry", v)} />
              </div>
            </div>
            <div className={css.formRow}>
              <span className={css.formLabel}>Stage</span>
              <div className={css.formField}>
                <PillSelect options={STAGES} value={form.stage}
                  onChange={(v) => update("stage", v)} />
              </div>
            </div>
          </Section>

          {/* ── 2. Liquidity & Capital ── */}
          <Section id="liquidity" title="Liquidity & Capital Structure" isOpen={!!openSections.liquidity}
            onToggle={toggleSection} completed={liquidityDone}>
            <SliderRow label="Cash on Hand" value={form.cashOnHand}
              min={0} max={5_000_000} step={10_000} format={fmtCurrency}
              onChange={(v) => update("cashOnHand", v)} />
            <SliderRow label="Monthly Net Burn" value={form.monthlyNetBurn}
              min={0} max={500_000} step={1_000} format={fmtCurrency}
              onChange={(v) => update("monthlyNetBurn", v)} />
            <div className={css.divider} />
            <InputRow label="Debt Outstanding" value={form.debtOutstanding} prefix="$"
              onChange={(v) => update("debtOutstanding", Number(v) || 0)} />
            <InputRow label="Interest Rate" value={form.debtInterestRate} suffix="%"
              onChange={(v) => update("debtInterestRate", Number(v) || 0)} />
            <div className={css.formRow}>
              <span className={css.formLabel}>Fundraising Window</span>
              <div className={css.formField}>
                <div className={css.incrGroup}>
                  <button type="button" className={css.incrBtn}
                    onClick={() => update("fundraisingWindow", Math.max(0, form.fundraisingWindow - 1))}>
                    &minus;
                  </button>
                  <span className={css.incrValue}>{form.fundraisingWindow} months</span>
                  <button type="button" className={css.incrBtn}
                    onClick={() => update("fundraisingWindow", form.fundraisingWindow + 1)}>
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className={css.formRow}>
              <span className={css.formLabel}>Access to Capital</span>
              <div className={css.formField}>
                <ToggleGroup options={["Moderate", "Strong"] as AccessToCapital[]}
                  value={form.accessToCapital} onChange={(v) => update("accessToCapital", v)} />
              </div>
            </div>
            <div className={css.divider} />
            <div className={css.derivedRow}>
              <span className={css.derivedLabel}>Runway</span>
              <span className={css.derivedValue} style={{
                color: metrics.runway < 6 ? "#f87171" : metrics.runway < 12 ? "#fbbf24" : "#34d399"
              }}>
                {metrics.runway.toFixed(1)} months
              </span>
            </div>
          </Section>

          {/* ── 3. Revenue Engine ── */}
          <Section id="revenue" title="Revenue Engine" isOpen={!!openSections.revenue}
            onToggle={toggleSection} completed={revenueDone}>
            <SliderRow label="Current ARR" value={form.currentARR}
              min={0} max={10_000_000} step={10_000} format={fmtCurrency}
              onChange={(v) => update("currentARR", v)} />
            <SliderRow label="Monthly Growth %" value={form.monthlyGrowthPct}
              min={0} max={30} step={0.1} format={(v) => `${v.toFixed(1)}%`}
              onChange={(v) => update("monthlyGrowthPct", v)} />
            <SliderRow label="Gross Margin %" value={form.grossMarginPct}
              min={0} max={100} step={0.5} format={(v) => `${v.toFixed(1)}%`}
              onChange={(v) => update("grossMarginPct", v)} />
            <InputRow label="Avg Deal Size (ACV)" value={form.avgDealSize} prefix="$"
              onChange={(v) => update("avgDealSize", Number(v) || 0)} />
            <SliderRow label="Monthly Churn %" value={form.monthlyChurnPct}
              min={0} max={15} step={0.1} format={(v) => `${v.toFixed(1)}%`}
              onChange={(v) => update("monthlyChurnPct", v)} />
            <SliderRow label="Sales Efficiency" value={form.salesEfficiency}
              min={0} max={3} step={0.1} format={(v) => `${v.toFixed(1)}x`}
              onChange={(v) => update("salesEfficiency", v)} />
            <SliderRow label="Net Revenue Retention %" value={form.netRevenueRetentionPct}
              min={50} max={200} step={1} format={(v) => `${v}%`}
              onChange={(v) => update("netRevenueRetentionPct", v)} />
          </Section>

          {/* ── 4. Cost Structure ── */}
          <Section id="cost" title="Cost Structure" isOpen={!!openSections.cost}
            onToggle={toggleSection}>
            <InputRow label="Headcount" value={form.headcount}
              onChange={(v) => update("headcount", Number(v) || 0)} />
            <InputRow label="Avg Fully Loaded Cost" value={form.avgFullyLoadedCost} prefix="$"
              onChange={(v) => update("avgFullyLoadedCost", Number(v) || 0)} />
            <InputRow label="Sales & Marketing" value={form.salesMarketingSpend} prefix="$"
              onChange={(v) => update("salesMarketingSpend", Number(v) || 0)} />
            <InputRow label="R&D Spend" value={form.rdSpend} prefix="$"
              onChange={(v) => update("rdSpend", Number(v) || 0)} />
            <InputRow label="G&A Spend" value={form.gaSpend} prefix="$"
              onChange={(v) => update("gaSpend", Number(v) || 0)} />
            <InputRow label="COGS" value={form.cogsPct} prefix="$"
              onChange={(v) => update("cogsPct", Number(v) || 0)} />
            <InputRow label="CAC" value={form.cac} prefix="$"
              onChange={(v) => update("cac", Number(v) || 0)} />
            <div className={css.divider} />
            <div className={css.derivedRow}>
              <span className={css.derivedLabel}>Revenue / Employee</span>
              <span className={css.derivedValue}>{fmtCurrency(metrics.revenuePerHead)}</span>
            </div>
            <div className={css.derivedRow}>
              <span className={css.derivedLabel}>Operating Profit</span>
              <span className={css.derivedValue} style={{
                color: metrics.operatingProfit >= 0 ? "#34d399" : "#f87171"
              }}>
                {metrics.operatingProfit < 0 ? "-" : ""}{fmtCurrency(Math.abs(metrics.operatingProfit))}
              </span>
            </div>
          </Section>

          {/* ── 5. Operating Structure ── */}
          <Section id="operations" title="Operating Structure" isOpen={!!openSections.operations}
            onToggle={toggleSection}>
            <div className={css.formRow}>
              <span className={css.formLabel}>Hiring Velocity</span>
              <div className={css.formField}>
                <ToggleGroup options={["Low", "Medium", "High"] as HiringVelocity[]}
                  value={form.hiringVelocity} onChange={(v) => update("hiringVelocity", v)} />
              </div>
            </div>
            <SliderRow label="Sales Ramp Time" value={form.salesRampTime}
              min={1} max={12} step={1} format={(v) => `${v} months`}
              onChange={(v) => update("salesRampTime", v)} />
            <SliderRow label="Engineering Velocity" value={form.engineeringVelocity}
              min={1} max={12} step={1} format={(v) => `${v} months`}
              onChange={(v) => update("engineeringVelocity", v)} />
            <div className={css.formRow}>
              <span className={css.formLabel}>Burn Flexibility</span>
              <div className={css.formField}>
                <ToggleGroup options={["Fixed", "Variable"] as BurnFlexibility[]}
                  value={form.burnFlexibility} onChange={(v) => update("burnFlexibility", v)} />
              </div>
            </div>
          </Section>

          {/* ── 6. Strategic Intent ── */}
          <Section id="strategy" title="Strategic Intent" isOpen={!!openSections.strategy}
            onToggle={toggleSection}>
            <div className={css.formRow}>
              <span className={css.formLabel}>Risk Tolerance</span>
              <div className={css.formField}>
                <ToggleGroup
                  options={["Conservative", "Balanced", "Aggressive"] as RiskTolerance[]}
                  value={form.riskTolerance} onChange={(v) => update("riskTolerance", v)} />
              </div>
            </div>
            <SliderRow label="Target Growth Band" value={form.targetGrowthBand}
              min={1} max={12} step={1} format={(v) => `${v} months`}
              onChange={(v) => update("targetGrowthBand", v)} />
            <div className={css.formRow}>
              <span className={css.formLabel}>Priority Balance</span>
              <div className={css.formField}>
                <div className={css.priorityWrap}>
                  <span className={css.priorityEnd}>Survival</span>
                  <div className={css.sliderTrack}>
                    <input type="range" className={css.sliderInput}
                      min={0} max={100} step={1} value={form.priorityBalance}
                      style={sliderFill(form.priorityBalance, 0, 100)}
                      onChange={(e) => update("priorityBalance", Number(e.target.value))} />
                  </div>
                  <span className={css.priorityEnd}>Expansion</span>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* ── Right: Live Intelligence Rail ── */}
        <div className={css.liveRail}>
          <div className={css.railTitle}>Live Intelligence</div>

          <div className={css.railMetric}>
            <span className={css.railMetricLabel}>Runway</span>
            <span className={css.railMetricValue} style={{
              color: metrics.runway < 6 ? "#f87171" : metrics.runway < 12 ? "#fbbf24" : "#34d399"
            }}>
              {metrics.runway.toFixed(1)} mo
            </span>
          </div>

          <div className={css.railMetric}>
            <span className={css.railMetricLabel}>Burn Multiple</span>
            <span className={css.railMetricValue}>{metrics.burnMultiple.toFixed(2)}x</span>
          </div>

          <div className={css.railMetric}>
            <span className={css.railMetricLabel}>Monthly Burn</span>
            <span className={css.railMetricValue}>{fmtCurrency(metrics.monthlyBurn)}</span>
          </div>

          <div className={css.railDivider} />

          <div className={css.railMetric}>
            <span className={css.railMetricLabel}>Survival Probability</span>
            <span className={css.railMetricValue} style={{
              color: metrics.survivalProbability >= 60 ? "#34d399"
                : metrics.survivalProbability >= 30 ? "#fbbf24" : "#f87171"
            }}>
              {metrics.survivalProbability}%
            </span>
          </div>

          <div className={css.railMetric}>
            <span className={css.railMetricLabel}>Gross Margin</span>
            <span className={css.railMetricValue}>{metrics.grossMarginPct.toFixed(0)}%</span>
          </div>

          <div className={css.railMetric}>
            <span className={css.railMetricLabel}>LTV / CAC</span>
            <span className={css.railMetricValue} style={{
              color: metrics.ltvCacRatio >= 3 ? "#34d399" : metrics.ltvCacRatio >= 1 ? "#fbbf24" : "#f87171"
            }}>
              {metrics.ltvCacRatio > 0 ? `${metrics.ltvCacRatio.toFixed(1)}x` : "\u2014"}
            </span>
          </div>

          <div className={css.railDivider} />

          <div className={css.railMetric}>
            <span className={css.railMetricLabel}>Revenue / Head</span>
            <span className={css.railMetricValue}>{fmtCurrency(metrics.revenuePerHead)}</span>
          </div>

          <div className={css.railMetric}>
            <span className={css.railMetricLabel}>Operating Profit</span>
            <span className={css.railMetricValue} style={{
              color: metrics.operatingProfit >= 0 ? "#34d399" : "#f87171"
            }}>
              {fmtCurrency(metrics.operatingProfit)}
            </span>
          </div>

          <div className={css.railMetric}>
            <span className={css.railMetricLabel}>CAC Payback</span>
            <span className={css.railMetricValue}>
              {metrics.cacPaybackMonths > 0 ? `${metrics.cacPaybackMonths.toFixed(1)} mo` : "\u2014"}
            </span>
          </div>

          <div className={css.railDivider} />

          {/* Progress */}
          <div className={css.progressWrap}>
            <div className={css.progressLabel}>
              <span className={css.progressText}>Completion</span>
              <span className={css.progressPct}>{completion}%</span>
            </div>
            <div className={css.progressTrack}>
              <div className={css.progressFill} style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LOCK ZONE ═══ */}
      <div className={css.lockZone}>
        <button
          type="button"
          className={css.lockBtn}
          disabled={!canLock}
          onClick={handleLock}
        >
          Lock Baseline &amp; Enter STRATFIT
        </button>
        <div className={css.legal}>
          All projections are generated by STRATFIT's simulation engine and do not constitute
          financial advice. Results are illustrative and based on user-supplied inputs.
        </div>
      </div>

      {/* ═══ XERO MODAL ═══ */}
      {showXeroModal && (
        <div className={css.modalBackdrop} onClick={() => setShowXeroModal(false)}>
          <div className={css.modalCard} onClick={(e) => e.stopPropagation()}>
            <span className={css.modalLogo}>&#9741;</span>
            <h2 className={css.modalTitle}>Connect Your Xero Account</h2>
            <p className={css.modalDesc}>
              Automatically import your P&L, balance sheet, and cash flow data
              from Xero to populate your baseline instantly.
            </p>
            <button type="button" className={css.modalBtn}
              onClick={() => { setShowXeroModal(false); setToast("Xero integration coming soon. Use manual entry or Excel import for now.") }}>
              Authorize with Xero
            </button>
            <button type="button" className={css.modalClose} onClick={() => setShowXeroModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && <div className={css.toast}>{toast}</div>}
    </div>
  )
}
