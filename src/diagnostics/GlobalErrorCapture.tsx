import { useEffect } from "react";
import { diag } from "./DiagnosticsStore";

export default function GlobalErrorCapture() {
    useEffect(() => {
        const onError = (event: ErrorEvent) => {
            diag("error", "global:error", event.message || "window.onerror", {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack || String(event.error || "")
            });
        };

        const onRejection = (event: PromiseRejectionEvent) => {
            diag("error", "global:unhandledrejection", "Unhandled promise rejection", {
                reason: event.reason?.stack || String(event.reason || "")
            });
        };

        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);

        diag("info", "global", "Global error capture mounted");

        return () => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        };
    }, []);

    return null;
}
