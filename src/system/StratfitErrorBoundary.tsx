import React from "react"

type State = { hasError: boolean; message?: string }

export default class StratfitErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false }

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : "Unknown error",
    }
  }

  componentDidCatch(error: unknown) {
    console.error("[STRATFIT] Render error caught by boundary:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#0b1016",
            color: "#e6f6ff",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div
            style={{
              padding: 32,
              borderRadius: 18,
              border: "1px solid rgba(0,224,255,0.25)",
              background: "rgba(10,16,24,0.8)",
              textAlign: "center",
              maxWidth: 420,
            }}
          >
            <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 600 }}>
              STRATFIT Recovery Mode
            </h2>
            <p style={{ margin: "0 0 24px", opacity: 0.7, fontSize: 14 }}>
              {this.state.message ?? "Something unexpected occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 24px",
                borderRadius: 8,
                border: "1px solid rgba(0,224,255,0.4)",
                background: "transparent",
                color: "#00e0ff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
