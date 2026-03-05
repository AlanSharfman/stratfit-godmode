import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ROUTES } from "@/routes/routeContract"

const PAGE_KEYS: Record<string, string> = {
  "1": ROUTES.POSITION,
  "2": ROUTES.WHAT_IF,
  "3": ROUTES.ACTIONS,
  "4": ROUTES.TIMELINE,
  "5": ROUTES.RISK,
  "6": ROUTES.COMPARE,
  "7": ROUTES.STUDIO,
  "8": ROUTES.VALUATION,
  "9": ROUTES.BOARDROOM,
  "0": ROUTES.PULSE,
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable

      if (isInput) return

      if (e.altKey && PAGE_KEYS[e.key]) {
        e.preventDefault()
        navigate(PAGE_KEYS[e.key])
        return
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("stratfit:toggle-help"))
        return
      }

      if (e.key === "m" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("stratfit:toggle-mentor"))
        return
      }

      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("stratfit:escape"))
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [navigate, location])
}
