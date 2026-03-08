import { useContext } from "react"
import {
  GraphicsCapabilityContext,
  type GraphicsCapabilityContextValue,
} from "@/runtime/graphics/GraphicsCapabilityProvider"

export type { RenderProfile } from "@/runtime/graphics/detectGraphicsCapabilities"

export function useRenderProfile(): GraphicsCapabilityContextValue {
  const ctx = useContext(GraphicsCapabilityContext)
  if (!ctx) {
    throw new Error("useRenderProfile must be used within <GraphicsCapabilityProvider>")
  }
  return ctx
}

export default useRenderProfile
