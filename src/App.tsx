import React from "react"
import { BrowserRouter } from "react-router-dom"
import AppRouter from "@/AppRouter"
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider"
import StaleDataOverlay from "@/components/system/StaleDataOverlay"
import QAFloatingPanel from "@/components/qa/QAFloatingPanel"
import CommandPalette from "@/components/command/CommandPalette"
import FirstVisitExplainer from "@/components/explainers/FirstVisitExplainer"
import ErrorBoundary from "@/components/system/ErrorBoundary"
import KeyboardHelpOverlay from "@/components/system/KeyboardHelpOverlay"
import OnboardingTour from "@/components/onboarding/OnboardingTour"
import KeyboardShortcutsBridge from "@/components/system/KeyboardShortcutsBridge"
import CollaborationPanel from "@/components/collab/CollaborationPanel"
import DocumentHead from "@/components/system/DocumentHead"
import FeatureGate from "@/components/system/FeatureGate"
import "@/styles/responsive.css"
import "@/styles/god-mode.css"

export default function App() {
  return (
    <ErrorBoundary>
      <SystemBaselineProvider>
        <BrowserRouter>
          <DocumentHead />
          <StaleDataOverlay />
          <AppRouter />
          <QAFloatingPanel />
          <CommandPalette />
          <FirstVisitExplainer />
          <KeyboardHelpOverlay />
          <OnboardingTour />
          <KeyboardShortcutsBridge />
          <FeatureGate flag="collaboration">
            <CollaborationPanel />
          </FeatureGate>
        </BrowserRouter>
      </SystemBaselineProvider>
    </ErrorBoundary>
  )
}
