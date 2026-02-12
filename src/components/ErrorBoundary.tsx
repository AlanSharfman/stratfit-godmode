import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  fullScreen?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      if (this.props.fullScreen === false) {
        return (
          <div style={{ padding: "1rem" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
              Something went wrong
            </div>
            <div style={{ opacity: 0.8, fontSize: "0.875rem" }}>
              Try refreshing the page.
            </div>
          </div>
        );
      }

      return (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "#0b0d10",
            color: "white",
            padding: "2rem",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Something went wrong
          </h1>
          <pre
            style={{
              background: "#1a1a1a",
              padding: "1rem",
              borderRadius: "8px",
              maxWidth: "800px",
              overflow: "auto",
            }}
          >
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#00b4ff",
              color: "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

