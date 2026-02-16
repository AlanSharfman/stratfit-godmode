export function logEngineHealth() {
    const baselineRaw = localStorage.getItem("stratfit.baseline.v1");
    const baseline = baselineRaw ? JSON.parse(baselineRaw) : null;

    const engineResults = (window as any).__STRATFIT_ENGINE__;

    console.group("STRATFIT ENGINE HEALTH");
    console.log("Baseline present:", !!baseline);
    console.log("Engine results:", !!engineResults);

    const arr = baseline?.arr ?? baseline?.financial?.arr;
    const burn = baseline?.monthlyBurn ?? baseline?.financial?.monthlyBurn;
    const cash = baseline?.cashOnHand ?? baseline?.financial?.cashOnHand;

    if (baseline) {
        console.log("ARR:", arr);
        console.log("Burn:", burn);
        console.log("Cash:", cash);
    }

    console.groupEnd();
}
