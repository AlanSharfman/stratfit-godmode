import { FoundationData } from "../store/foundationStore";

export type EngineElasticityParams = {
  // Core stochastic parameters (monthly)
  revenueVolPct: number; // e.g. 0.06 = 6% monthly revenue volatility
  churnVolPct: number; // e.g. 0.20 = 20% churn volatility (relative)
  burnVolPct: number; // e.g. 0.10 = 10% burn volatility

  // Tail-risk events (monthly)
  shockProb: number; // probability of a shock event per month
  shockSeverityRevenuePct: number; // revenue hit, e.g. 0.18 = -18% in shock month
  shockSeverityBurnPct: number; // burn spike, e.g. 0.15 = +15% in shock month

  // Correlations (bounded -0.95..0.95)
  corrRevenueBurn: number; // typically negative: revenue down -> burn pressure up
  corrRevenueChurn: number; // typically negative: revenue down -> churn up
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const nz = (v: string) => {
  const x = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : 0;
};

/**
 * INSTITUTIONAL-GRADE ELASTICITY ENGINE
 * 
 * Leverages comprehensive Foundation metrics to derive stochastic parameters:
 * - Unit economics (CAC, LTV, payback) → revenue stability
 * - Retention metrics (churn, NRR) → customer volatility
 * - Efficiency metrics (magic number, gross margin) → operational fragility
 * - Capital structure (debt, runway, fundraising) → tail risk
 * 
 * Output is explainable, bounded, and founder-presentable.
 */
export function deriveElasticityFromFoundation(f: FoundationData): EngineElasticityParams {
  // Core treasury
  const cash = nz(f.cash);
  const burn = nz(f.burn);
  const runway = nz(f.runway);
  
  // Revenue metrics
  const arr = nz(f.arr);
  const mrr = nz(f.mrr);
  const growth = nz(f.growth) / 100; // monthly
  const customerCount = nz(f.customerCount);
  
  // Unit economics
  const acv = nz(f.acv);
  const cac = nz(f.cac);
  const ltv = nz(f.ltv);
  const paybackPeriod = nz(f.paybackPeriod);
  
  // Retention & efficiency
  const churn = nz(f.churn) / 100; // monthly
  const nrr = nz(f.nrr) / 100; // net revenue retention
  const gm = nz(f.grossMargin) / 100; // 0..1
  const magicNumber = nz(f.magicNumber);
  
  // Operating model
  const headcount = nz(f.headcount);
  const avgCost = nz(f.avgCost);
  const salesMarketingSpend = nz(f.salesMarketingSpend);
  const rdSpend = nz(f.rdSpend);
  
  // Capital structure
  const debt = nz(f.debtOutstanding);
  const rate = nz(f.interestRate) / 100;
  const nextRaiseMonths = nz(f.nextRaiseMonths);
  const lastRaiseAmount = nz(f.lastRaiseAmount);

  // Derived metrics
  const calcRunway = burn > 0 ? cash / burn : 99;
  const effectiveRunway = runway > 0 ? runway : calcRunway;
  const calcMRR = arr > 0 ? arr / 12 : (mrr > 0 ? mrr : 0);
  const burnMultiple = calcMRR > 0 ? burn / calcMRR : 0;
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  const customerConcentration = customerCount > 0 ? (arr / customerCount) / acv : 0;

  // ---------- Base vols (founder-grade defaults) ----------
  // Interpretable starting points:
  // - revenue vol: 4–14% monthly depending on fragility
  // - churn vol: 12–40% relative volatility
  // - burn vol: 6–16% monthly
  let revenueVol = 0.06;
  let churnVol = 0.18;
  let burnVol = 0.10;

  // ---------- INSTITUTIONAL FRAGILITY MODEL (0..1) ----------
  
  // Treasury fragility: runway pressure
  const runwayFrag = clamp((12 - effectiveRunway) / 12, 0, 1); // 0 if runway>=12, 1 if runway<=0
  
  // Burn efficiency fragility
  const burnMultiFrag = clamp((burnMultiple - 1.5) / 3.0, 0, 1); // risk rises after ~1.5x
  
  // Margin fragility
  const gmFrag = clamp((0.55 - gm) / 0.55, 0, 1); // low margins => fragility
  
  // Unit economics fragility
  const ltvCacFrag = ltvCacRatio > 0 ? clamp((3.0 - ltvCacRatio) / 3.0, 0, 1) : 0.7; // <3x is risky
  const paybackFrag = paybackPeriod > 0 ? clamp((paybackPeriod - 12) / 12, 0, 1) : 0.5; // >12mo is slow
  
  // Retention fragility
  const churnFrag = clamp(churn / 0.08, 0, 1); // >8% monthly churn is dangerous
  const nrrFrag = nrr > 0 ? clamp((1.10 - nrr) / 0.40, 0, 1) : 0.6; // <110% NRR is risky
  
  // Sales efficiency fragility
  const magicFrag = magicNumber > 0 ? clamp((0.75 - magicNumber) / 0.75, 0, 1) : 0.5; // <0.75 is inefficient
  
  // Capital structure fragility
  const raiseFrag = clamp((9 - nextRaiseMonths) / 9, 0, 1); // raise within 9 months => pressure
  const debtFrag = clamp((debt > 0 ? 0.35 : 0) + (rate > 0.12 ? 0.25 : 0), 0, 1);
  
  // Customer concentration risk
  const concentrationFrag = customerCount > 0 && customerCount < 20 ? clamp((20 - customerCount) / 20, 0, 0.5) : 0;

  // WEIGHTED FRAGILITY COMPOSITE
  const fragility = clamp(
    0.22 * runwayFrag +
      0.14 * burnMultiFrag +
      0.12 * gmFrag +
      0.12 * ltvCacFrag +
      0.10 * churnFrag +
      0.08 * nrrFrag +
      0.08 * magicFrag +
      0.07 * paybackFrag +
      0.05 * raiseFrag +
      0.04 * debtFrag +
      0.03 * concentrationFrag,
    0,
    1
  );

  // ---------- Apply fragility to vols ----------
  // Revenue vol gets moderated by strong unit economics and magic number
  revenueVol += fragility * 0.06; // base fragility uplift
  if (magicNumber > 1.0) revenueVol *= 0.85; // strong sales efficiency => less vol
  if (ltvCacRatio > 4.0) revenueVol *= 0.90; // excellent unit econ => stability
  
  // Burn vol gets moderated by predictable cost structure
  burnVol += fragility * 0.06;
  const totalOpex = headcount * avgCost + salesMarketingSpend + rdSpend;
  const burnStability = totalOpex > 0 ? Math.min(totalOpex / burn, 1.2) : 1.0;
  if (burnStability > 0.9) burnVol *= 0.92; // well-understood cost base
  
  // Churn vol gets heavily influenced by retention metrics
  churnVol += fragility * 0.18;
  if (nrr > 1.15) churnVol *= 0.75; // strong NRR => stable cohorts
  if (churn < 0.02) churnVol *= 0.80; // low churn => less volatility

  // Growth moderates revenue vol (consistent growth = stability)
  const growthHelp = clamp(growth / 0.08, 0, 1) * 0.01; // up to -1%
  revenueVol = revenueVol - growthHelp + clamp(churn / 0.08, 0, 1) * 0.01;

  // Bound everything to institutional-sane ranges
  revenueVol = clamp(revenueVol, 0.04, 0.14);
  burnVol = clamp(burnVol, 0.06, 0.16);
  churnVol = clamp(churnVol, 0.12, 0.40);

  // ---------- TAIL SHOCKS (monthly probability) ----------
  // Discrete bad events: delayed raise, pipeline collapse, churn spike, cost blow-out
  let shockProb = 0.03; // 3% base monthly = ~30% chance per year
  shockProb += fragility * 0.06; // up to +6% monthly

  // Low runway increases shock probability (desperation scenarios)
  if (effectiveRunway < 6) shockProb += 0.02;
  
  // Customer concentration risk increases shock probability
  if (customerCount > 0 && customerCount < 10) shockProb += 0.015;
  
  // Upcoming fundraise increases execution risk
  if (nextRaiseMonths < 6 && nextRaiseMonths > 0) shockProb += 0.01;

  shockProb = clamp(shockProb, 0.02, 0.12);

  // Shock severity scales with fragility + unit economics weakness
  let shockRevenue = 0.12 + fragility * 0.12; // 12% to 24%
  let shockBurn = 0.10 + fragility * 0.12; // 10% to 22%
  
  // Poor unit economics amplify shock severity
  if (ltvCacRatio > 0 && ltvCacRatio < 2.0) shockRevenue += 0.03;
  if (paybackPeriod > 18) shockBurn += 0.02; // slow payback = burn vulnerability
  
  shockRevenue = clamp(shockRevenue, 0.10, 0.26);
  shockBurn = clamp(shockBurn, 0.08, 0.24);

  // ---------- CORRELATIONS (institutional reality) ----------
  // When revenue drops:
  // - Burn pressure increases (panic hiring freeze reversal, emergency spend)
  // - Churn increases (product quality drops, support degrades, morale cascades)
  
  let corrRevenueBurn = -0.35 - fragility * 0.35; // more fragile = stronger coupling
  let corrRevenueChurn = -0.25 - fragility * 0.40;
  
  // Strong retention metrics reduce revenue-churn correlation
  if (nrr > 1.20) corrRevenueChurn *= 0.80; // expansion revenue buffers churn impact
  
  // High gross margin reduces revenue-burn correlation (less cost of delivery)
  if (gm > 0.75) corrRevenueBurn *= 0.85;
  
  corrRevenueBurn = clamp(corrRevenueBurn, -0.85, -0.15);
  corrRevenueChurn = clamp(corrRevenueChurn, -0.85, -0.05);

  return {
    revenueVolPct: revenueVol,
    churnVolPct: churnVol,
    burnVolPct: burnVol,
    shockProb,
    shockSeverityRevenuePct: shockRevenue,
    shockSeverityBurnPct: shockBurn,
    corrRevenueBurn,
    corrRevenueChurn,
  };
}

