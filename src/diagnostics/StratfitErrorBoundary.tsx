import React from "react";
import { diag } from "./DiagnosticsStore";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; message?: string };

export default class StratfitErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(err: any): State {
        return { hasError: true, message: err?.message || "Unknown error" };
    }

    componentDidCatch(error: any, info: any) {
        diag("error", "react:errorboundary", "React render error", {
            error: error?.stack || String(error || ""),
            info
        });
    }

    render() {
        if (this.state.hasError) {
            // Minimal fallback; no design work in Phase 2.5
            return (
                <div style={{ padding: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>STRATFIT encountered an error</div>
                    <div style={{ opacity: 0.8, marginBottom: 12 }}>{this.state.message}</div>
                    <button onClick={() => window.location.reload()}>Reload</button>
                </div>
            );
        }
        return this.props.children;
    }
}
