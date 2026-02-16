import type { BaselineV1 } from "@/onboard/baseline";
import { useStratfitStore } from "@/core/store/useStratfitStore";

function clamp01(x: number) {
    if (Number.isNaN(x)) return 0;
    return Math.max(0, Math.min(1, x));
}

export function applyBaselineToCoreStores(b: BaselineV1) {
    // Financial
    const arr = Math.max(0, b.financial.arr || 0);
    const growthRate = clamp01((b.financial.growthRatePct || 0) / 100);
    const grossMargin = clamp01((b.financial.grossMarginPct || 0) / 100);
    const cash = Math.max(0, b.financial.cashOnHand || 0);
    const monthlyBurn = Math.max(0, b.financial.monthlyBurn || 0);

    // Burn multiple = burn / (ARR/12). Guard ARR=0.
    const monthlyRevenue = arr > 0 ? arr / 12 : 0;
    const burnMultiple =
        monthlyRevenue > 0 ? Math.max(0, monthlyBurn / monthlyRevenue) : 0;

    const store = useStratfitStore.getState();
    store.setPosition({
        arr,
        growthRate,
        grossMargin,
        burnMultiple: Number.isFinite(burnMultiple) ? burnMultiple : 0,
    });

    store.setLiquidity({
        cash,
        monthlyBurn,
    });
}
