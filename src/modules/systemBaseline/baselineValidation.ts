export interface BaselineValidationResult {
    valid: boolean;
    reasons: string[];
}

export function validateBaseline(baseline: any): BaselineValidationResult {
    const reasons: string[] = [];

    if (!baseline) {
        reasons.push("Baseline missing");
        return { valid: false, reasons };
    }

    if (!baseline.arr || baseline.arr <= 0) {
        reasons.push("ARR must be greater than 0");
    }

    if (!baseline.monthlyBurn || baseline.monthlyBurn <= 0) {
        reasons.push("Monthly burn must be greater than 0");
    }

    if (!baseline.cashOnHand || baseline.cashOnHand <= 0) {
        reasons.push("Cash on hand must be greater than 0");
    }

    return {
        valid: reasons.length === 0,
        reasons
    };
}
