import React from "react"
import { BrowserRouter } from "react-router-dom"
import AppRouter from "@/AppRouter"
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider"

export default function App() {
  return (
    <SystemBaselineProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </SystemBaselineProvider>
  )
}
