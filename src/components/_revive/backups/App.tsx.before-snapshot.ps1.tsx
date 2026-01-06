import { useState } from "react";
import DashboardLayout from "./components/layout/DashboardLayout";
import Page2ScenarioSettings from "./components/onboarding/pages/Page2ScenarioSettings";
import { DEFAULT_SCENARIO_SETTINGS } from "./components/onboarding/onboarding.types";

export default function App() {
  // DEV FLAG — Onboarding Page2 isolated mount (reversible)
  // Enable by setting localStorage STRATFIT_DEV_ONBOARDING_P2 = "1"
  const devOnboardingP2 =
    typeof window !== "undefined" &&
    window.localStorage.getItem("STRATFIT_DEV_ONBOARDING_P2") === "1";

  const [devScenarioSettings, setDevScenarioSettings] = useState(DEFAULT_SCENARIO_SETTINGS);

  if (devOnboardingP2) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#0b0d10",
          overflow: "hidden",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Page2ScenarioSettings
            value={devScenarioSettings}
            onUpdate={setDevScenarioSettings}
            onBack={() => {}}
            onNext={() => {}}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0b0d10",
        overflow: "hidden",
      }}
    >
      <DashboardLayout />
    </div>
  );
}
