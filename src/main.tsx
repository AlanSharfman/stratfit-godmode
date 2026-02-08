import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { SystemBaselineProvider } from "./system/SystemBaselineProvider";
import ComputationMonitor from "./components/system/ComputationMonitor";
import "./styles/phase2Tokens.css";
import "./index.css";
import "./styles/phase1LayoutFixes.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <ErrorBoundary>
    <SystemBaselineProvider>
      <App />
      <ComputationMonitor />
    </SystemBaselineProvider>
  </ErrorBoundary>
);
