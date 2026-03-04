import React from "react"
import { BrowserRouter } from "react-router-dom"
import AppRouter from "@/AppRouter"
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider"
import StaleDataOverlay from "@/components/system/StaleDataOverlay"

export default function App() {
  return (
    <SystemBaselineProvider>
      <BrowserRouter>
        <StaleDataOverlay />
        <AppRouter />
      </BrowserRouter>
    </SystemBaselineProvider>
  )
}
