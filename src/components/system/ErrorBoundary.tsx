import React, { Component } from "react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  fullScreen?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[STRATFIT] Uncaught error:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      if (this.props.fullScreen === false) {
        return (
          <div style={{
            padding: "12px 16px",
            background: "rgba(15,25,45,0.5)",
            border: "1px solid rgba(248,113,113,0.15)",
            borderRadius: 8,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "rgba(200,220,240,0.7)",
              marginBottom: 4,
            }}>
              Something went wrong
            </div>
            <div style={{ fontSize: 11, color: "rgba(200,220,240,0.4)" }}>
              Try refreshing the page.
            </div>
          </div>
        )
      }

      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1520",
          fontFamily: "'Inter', system-ui, sans-serif",
          color: "rgba(200,220,240,0.85)",
        }}>
          <div style={{ textAlign: "center", maxWidth: 480, padding: 32 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 20, color: "#f87171",
            }}>!</div>
            <h2 style={{
              margin: "0 0 12px", fontSize: 20, fontWeight: 300,
              letterSpacing: "0.05em", color: "rgba(200,220,240,0.9)",
            }}>
              Something went wrong
            </h2>
            <p style={{
              fontSize: 13, color: "rgba(200,220,240,0.4)",
              lineHeight: 1.6, margin: "0 0 24px",
            }}>
              STRATFIT encountered an unexpected error. Your data is safe.
            </p>
            {this.state.error && (
              <div style={{
                padding: "12px 16px", background: "rgba(15,25,45,0.5)",
                border: "1px solid rgba(248,113,113,0.1)", borderRadius: 8,
                marginBottom: 24, textAlign: "left",
              }}>
                <code style={{
                  fontSize: 11, color: "rgba(248,113,113,0.7)",
                  fontFamily: "ui-monospace, monospace",
                  wordBreak: "break-all",
                }}>
                  {this.state.error.message}
                </code>
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = "/"
              }}
              style={{
                padding: "12px 28px", borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.08))",
                color: "#22d3ee", fontWeight: 600, fontSize: 13,
                letterSpacing: "0.04em", cursor: "pointer",
                boxShadow: "0 2px 12px rgba(34,211,238,0.1)",
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
