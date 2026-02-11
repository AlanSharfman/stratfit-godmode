import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { SystemBaselineProvider } from "./system/SystemBaselineProvider";
import ComputationMonitor from "./components/system/ComputationMonitor";
import "./styles/phase2Tokens.css";
import "./styles/tokens.css";
import "./styles/mountainBackplate.css";
import "./index.css";
import "./styles/phase1LayoutFixes.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <ErrorBoundary>
    <SystemBaselineProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <ComputationMonitor />
    </SystemBaselineProvider>
  </ErrorBoundary>
);
