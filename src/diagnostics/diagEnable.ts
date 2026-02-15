export function shouldEnableDiagnostics(): boolean {
    try {
        const url = new URL(window.location.href);
        if (url.searchParams.get("diag") === "1") return true;
        const ls = window.localStorage?.getItem("STRATFIT_DIAG");
        if (ls === "1" || ls === "true") return true;
    } catch {
        // SSR / non-browser
    }
    return false;
}
