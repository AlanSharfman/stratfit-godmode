// src/finance/TermSheet.ts
// STRATFIT — Term Sheet & SAFE Modeling

// ============================================================================
// TERM SHEET (Priced Round)
// ============================================================================

export interface TermSheet {
  preMoney: number;         // Pre-money valuation
  raise: number;            // Capital raised
  optionPool: number;       // % reserved for options (e.g., 0.10 = 10%)
  liquidationPref: number;  // 1 = 1x, 2 = 2x, etc.
  round: number;            // Round number (1 = Seed, 2 = Series A, etc.)
}

// ============================================================================
// SAFE (Simple Agreement for Future Equity)
// ============================================================================

export interface SAFE {
  cap: number;              // Valuation cap
  discount: number;         // Discount rate (e.g., 0.20 = 20%)
  raise: number;            // Amount raised via SAFE
}

// ============================================================================
// FUNDING ROUND RESULT
// ============================================================================

export interface FundingRoundResult {
  round: number;
  type: "safe" | "equity";
  preMoney: number;
  postMoney: number;
  raise: number;
  dilution: number;
  founderOwnershipAfter: number;
  optionPool: number;
  liquidationPref: number;
  effectiveValuation?: number; // For SAFEs
}

// ============================================================================
// DEFAULT TERM SHEET GENERATOR
// ============================================================================

export function createDefaultTermSheet(
  preMoney: number,
  raise: number,
  round: number
): TermSheet {
  // Option pool increases with later rounds
  const optionPool = round === 1 ? 0.10 : round === 2 ? 0.12 : 0.15;
  
  // Liquidation preference typically 1x for early rounds
  const liquidationPref = round <= 2 ? 1 : 1;
  
  return {
    preMoney,
    raise,
    optionPool,
    liquidationPref,
    round,
  };
}

// ============================================================================
// DEFAULT SAFE GENERATOR
// ============================================================================

export function createDefaultSAFE(
  preMoney: number,
  raise: number
): SAFE {
  // SAFE cap is typically 1.5-2x the raise amount or based on target valuation
  const cap = Math.max(preMoney, raise * 4);
  
  return {
    cap,
    discount: 0.20, // 20% discount is standard
    raise,
  };
}

// ============================================================================
// DILUTION CALCULATIONS
// ============================================================================

/**
 * Calculate dilution for a SAFE conversion
 */
export function calculateSAFEDilution(
  safe: SAFE,
  preMoney: number
): { dilution: number; effectiveValuation: number } {
  // Effective valuation = min(pre-money, cap) × (1 - discount)
  const effectiveValuation = Math.min(preMoney, safe.cap) * (1 - safe.discount);
  
  // Ownership = raise / (effective valuation + raise)
  const ownership = safe.raise / (effectiveValuation + safe.raise);
  
  return {
    dilution: ownership,
    effectiveValuation,
  };
}

/**
 * Calculate dilution for a priced equity round
 */
export function calculateEquityDilution(
  termSheet: TermSheet
): { dilution: number; postMoney: number } {
  const postMoney = termSheet.preMoney + termSheet.raise;
  
  // Base dilution from new shares
  const baseDilution = termSheet.raise / postMoney;
  
  // Option pool also dilutes existing shareholders
  // Option pool is carved out pre-money, so it dilutes founders more
  const totalDilution = baseDilution + (termSheet.optionPool * (1 - baseDilution));
  
  return {
    dilution: Math.min(totalDilution, 0.60), // Cap at 60% per round
    postMoney,
  };
}

// ============================================================================
// IRR CALCULATION
// ============================================================================

/**
 * Calculate Internal Rate of Return
 * @param invested Total capital invested
 * @param exitValue Value at exit
 * @param years Time period in years
 */
export function calculateIRR(
  invested: number,
  exitValue: number,
  years: number
): number {
  if (invested <= 0 || exitValue <= 0 || years <= 0) return 0;
  
  // IRR = (Exit / Invested)^(1/years) - 1
  return Math.pow(exitValue / invested, 1 / years) - 1;
}

/**
 * Calculate investor proceeds considering liquidation preference
 * @param exitValue Total enterprise value at exit
 * @param investorOwnership Investor ownership %
 * @param totalInvested Total capital invested
 * @param liquidationPref Liquidation preference multiple
 */
export function calculateInvestorProceeds(
  exitValue: number,
  investorOwnership: number,
  totalInvested: number,
  liquidationPref: number = 1
): { proceeds: number; method: "preference" | "conversion" } {
  // Liquidation preference = min(exit, invested × pref)
  const preferenceAmount = Math.min(exitValue, totalInvested * liquidationPref);
  
  // Pro-rata share
  const conversionAmount = exitValue * investorOwnership;
  
  // Investors typically choose the higher of the two
  if (preferenceAmount > conversionAmount) {
    return { proceeds: preferenceAmount, method: "preference" };
  }
  
  return { proceeds: conversionAmount, method: "conversion" };
}

// ============================================================================
// FUNDING ROUND LABELS
// ============================================================================

export function getRoundLabel(round: number): string {
  switch (round) {
    case 1: return "Seed";
    case 2: return "Series A";
    case 3: return "Series B";
    case 4: return "Series C";
    case 5: return "Series D";
    default: return `Round ${round}`;
  }
}

